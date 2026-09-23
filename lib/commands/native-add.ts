import * as fs from "fs";
import { EOL } from "os";
import * as path from "path";
import {
	CommandContext,
	CommandName,
	defineCommand,
} from "../common/define-command";
import { capitalizeFirstLetter } from "../common/utils";
import { ProjectData } from "../contracts/project-data";
import { provideProject } from "./command-base";
import { IProjectData } from "../definitions/project";

/**
 * Which language a command generates a source file for. It also decides the
 * platform: java and kotlin write under App_Resources/Android, swift and
 * objective-c under App_Resources/iOS.
 */
type NativeAddLanguage = "java" | "kotlin" | "swift" | "objective-c";

function failWithUsage(ctx: CommandContext): void {
	ctx.fail("Usage: ns native add [swift|objective-c|java|kotlin] [class name]");
}

function getIosSourcePathBase($projectData: IProjectData): string {
	const resources = $projectData.getAppResourcesDirectoryPath();
	return path.join(resources, "iOS", "src");
}

function getAndroidSourcePathBase($projectData: IProjectData): string {
	const resources = $projectData.getAppResourcesDirectoryPath();
	return path.join(resources, "Android", "src", "main", "java");
}

function getPackageName(className: string): string {
	const lastDotIndex = className.lastIndexOf(".");
	if (lastDotIndex !== -1) {
		return className.substring(0, lastDotIndex);
	}
	return "";
}

function getClassSimpleName(className: string): string {
	const lastDotIndex = className.lastIndexOf(".");
	if (lastDotIndex !== -1) {
		return className.substring(lastDotIndex + 1);
	}
	return className;
}

function generateJavaClassContent(
	packageName: string,
	classSimpleName: string,
): string {
	return (
		(packageName.length > 0 ? `package ${packageName};` : "") +
		`
import android.util.Log;

public class ${classSimpleName} {
    public void logMessage() {
        Log.d("JS", "Hello from ${classSimpleName}!");
    }
}
`
	);
}

function generateKotlinClassContent(
	packageName: string,
	classSimpleName: string,
): string {
	return (
		(packageName.length > 0 ? `package ${packageName};` : "") +
		`

import android.util.Log

class ${classSimpleName} {
    fun logMessage() {
        Log.d("JS", "Hello from ${classSimpleName}!")
    }
}
`
	);
}

function checkAndUpdateGradleProperties(ctx: CommandContext): boolean {
	const $projectData = ctx.injector.get(ProjectData);
	const $logger = ctx.injector.get<ILogger>("logger");
	const resources = $projectData.getAppResourcesDirectoryPath();

	const filePath = path.join(resources, "Android", "gradle.properties");

	if (fs.existsSync(filePath)) {
		const fileContent = fs.readFileSync(filePath, "utf8");
		const propertyRegex = /^useKotlin\s*=\s*(true|false)$/m;
		const match = propertyRegex.exec(fileContent);

		if (match) {
			const useKotlin = match[1];

			if (useKotlin === "false") {
				ctx.fail(
					"The useKotlin property is set to false. Stopping processing. Kotlin must be enabled in gradle.properties to use.",
				);
				return false;
			}

			if (useKotlin === "true") {
				return true;
			}
		} else {
			fs.appendFileSync(filePath, `${EOL}useKotlin=true${EOL}`);
			$logger.info('Added "useKotlin=true" property to gradle.properties.');
		}
	} else {
		fs.writeFileSync(filePath, `useKotlin=true${EOL}`);
		$logger.info('Created gradle.properties with "useKotlin=true" property.');
	}
	return true;
}

function generateJavaKotlin(
	ctx: CommandContext,
	className: string,
	extension: string,
): void {
	const $projectData = ctx.injector.get(ProjectData);
	const $logger = ctx.injector.get<ILogger>("logger");
	const fileExt = extension == "java" ? extension : "kt";
	const packageName = getPackageName(className);
	const classSimpleName = getClassSimpleName(className);
	const packagePath = path.join(
		getAndroidSourcePathBase($projectData),
		...packageName.split("."),
	);
	const filePath = path.join(packagePath, `${classSimpleName}.${fileExt}`);

	if (fs.existsSync(filePath)) {
		ctx.fail(`${extension} file '${filePath}' already exists.`);
		return;
	}

	if (extension == "kotlin" && !checkAndUpdateGradleProperties(ctx)) {
		return;
	}

	const fileContent =
		extension == "java"
			? generateJavaClassContent(packageName, classSimpleName)
			: generateKotlinClassContent(packageName, classSimpleName);

	fs.mkdirSync(packagePath, { recursive: true });
	fs.writeFileSync(filePath, fileContent);
	$logger.info(
		`${capitalizeFirstLetter(
			extension,
		)} file '${filePath}' generated successfully.`,
	);
}

function generateOrUpdateModuleMap(
	$logger: ILogger,
	headerFileName: string,
	moduleMapPath: string,
): void {
	const moduleName = "LocalModule";
	const headerPath = headerFileName;

	let moduleMapContent = "";

	if (fs.existsSync(moduleMapPath)) {
		moduleMapContent = fs.readFileSync(moduleMapPath, "utf8");
	}

	const headerDeclaration = `header "${headerPath}"`;

	if (moduleMapContent.includes(`module ${moduleName}`)) {
		// Module declaration already exists in the module map
		if (moduleMapContent.includes(headerDeclaration)) {
			// Header is already present in the module map
			$logger.warn(
				`Header '${headerFileName}' is already added to the module map.`,
			);
			return;
		}

		const updatedModuleMapContent = moduleMapContent.replace(
			new RegExp(`module ${moduleName} {\\s*([^}]*)\\s*}`, "s"),
			`module ${moduleName} {${EOL}    $1${EOL}    ${headerDeclaration}${EOL}}`,
		);

		fs.writeFileSync(moduleMapPath, updatedModuleMapContent);
	} else {
		// Module declaration does not exist in the module map
		const moduleDeclaration = `module ${moduleName} {${EOL}    ${headerDeclaration}${EOL}    export *${EOL}}`;

		moduleMapContent += `${EOL}${EOL}${moduleDeclaration}`;
		fs.writeFileSync(moduleMapPath, moduleMapContent);
	}

	$logger.info(
		`Module map '${moduleMapPath}' has been updated with the header '${headerFileName}'.`,
	);
}

function generateObjectiveCFiles(
	ctx: CommandContext,
	className: string,
	classFilePath: string,
	interfaceFilePath: string,
): boolean {
	const $logger = ctx.injector.get<ILogger>("logger");

	if (fs.existsSync(classFilePath)) {
		ctx.fail(`Error: File '${classFilePath}' already exists.`);
		return false;
	}

	if (fs.existsSync(interfaceFilePath)) {
		ctx.fail(`Error: File '${interfaceFilePath}' already exists.`);
		return false;
	}

	const interfaceContent = `#import <Foundation/Foundation.h>

@interface ${className} : NSObject

- (void)logMessage;

@end
`;

	const classContent = `#import "${className}.h"

@implementation ${className}

- (void)logMessage {
    NSLog(@"Hello from ${className} class!");
}

@end
`;

	fs.writeFileSync(classFilePath, classContent);
	$logger.trace(
		`Objective-C class file '${classFilePath}' generated successfully.`,
	);

	fs.writeFileSync(interfaceFilePath, interfaceContent);
	$logger.trace(
		`Objective-C interface file '${interfaceFilePath}' generated successfully.`,
	);
	return true;
}

function generateObjectiveC(ctx: CommandContext, className: string): void {
	const $projectData = ctx.injector.get(ProjectData);
	const $logger = ctx.injector.get<ILogger>("logger");
	const iosSourceBase = getIosSourcePathBase($projectData);

	const classFilePath = path.join(iosSourceBase, `${className}.m`);
	const headerFilePath = path.join(iosSourceBase, `${className}.h`);

	if (generateObjectiveCFiles(ctx, className, classFilePath, headerFilePath)) {
		// Modify/Generate moduleMap
		generateOrUpdateModuleMap(
			$logger,
			`${className}.h`,
			path.join(iosSourceBase, "module.modulemap"),
		);
	}
}

function generateSwiftFile(
	ctx: CommandContext,
	className: string,
	filePath: string,
): void {
	const $logger = ctx.injector.get<ILogger>("logger");
	const directory = path.dirname(filePath);

	if (!fs.existsSync(directory)) {
		fs.mkdirSync(directory, { recursive: true });
		$logger.trace(`Created directory: '${directory}'.`);
	}

	if (fs.existsSync(filePath)) {
		ctx.fail(`Error: File '${filePath}' already exists.`);
		return;
	}

	const content = `import Foundation;
import os;		

@objc class ${className}: NSObject {
	@objc func logMessage() {
		os_log("Hello from ${className} class!")
	}
}`;

	fs.writeFileSync(filePath, content);
	$logger.info(`Swift file '${filePath}' generated successfully.`);
}

function generateSwift(ctx: CommandContext, className: string): void {
	const $projectData = ctx.injector.get(ProjectData);
	const iosSourceBase = getIosSourcePathBase($projectData);
	const swiftFilePath = path.join(iosSourceBase, `${className}.swift`);
	generateSwiftFile(ctx, className, swiftFilePath);
}

const generators: Record<
	NativeAddLanguage,
	(ctx: CommandContext, className: string) => void
> = {
	java: (ctx, className) => generateJavaKotlin(ctx, className, "java"),
	kotlin: (ctx, className) => generateJavaKotlin(ctx, className, "kotlin"),
	swift: generateSwift,
	"objective-c": generateObjectiveC,
};

export const nativeAddCommandDefinition = defineCommand({
	name: "native|add",
	description:
		"Commands to add native files to the application placing them in the correct directory.",
	params: "any",
	providers: [provideProject()],
	canExecute(context): boolean {
		failWithUsage(context);
		return false;
	},
	run(context): void {
		failWithUsage(context);
	},
});

const defineNativeAddLanguageCommand = <const TName extends CommandName>(
	name: TName,
	language: NativeAddLanguage,
) =>
	defineCommand({
		name,
		description: "Adds a native source file to the application.",
		// The one usage message answers both too few and too many arguments; a
		// declared argument spec would report them with two different ones.
		params: "any",
		providers: [provideProject()],
		canExecute(context): boolean {
			if (context.args.length !== 1) {
				failWithUsage(context);
			}

			return true;
		},
		run(context): void {
			generators[language](context, context.args[0]);
		},
	});

export const javaNativeAddCommand = defineNativeAddLanguageCommand(
	"native|add|java",
	"java",
);

export const kotlinNativeAddCommand = defineNativeAddLanguageCommand(
	"native|add|kotlin",
	"kotlin",
);

export const swiftNativeAddCommand = defineNativeAddLanguageCommand(
	"native|add|swift",
	"swift",
);

export const objectiveCNativeAddCommand = defineNativeAddLanguageCommand(
	"native|add|objective-c",
	"objective-c",
);
