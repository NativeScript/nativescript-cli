import * as fs from "fs";
import { EOL } from "os";
import * as path from "path";
import { IErrors } from "../common/declarations";
import { CommandName, defineCommand } from "../common/define-command";
import { inject } from "../common/di";
import { capitalizeFirstLetter } from "../common/utils";
import { IProjectData } from "../definitions/project";

/**
 * Which language a command generates a source file for. It also decides the
 * platform: java and kotlin write under App_Resources/Android, swift and
 * objective-c under App_Resources/iOS.
 */
type NativeAddLanguage = "java" | "kotlin" | "swift" | "objective-c";

interface INativeAddLanguageCommandServices extends INativeAddCommandServices {
	language: NativeAddLanguage;
}

export function setupNativeAddCommand() {
	const services = {
		$projectData: inject<IProjectData>("projectData"),
		$logger: inject<ILogger>("logger"),
		$errors: inject<IErrors>("errors"),
	};
	services.$projectData.initializeProjectData();

	return services;
}

export type INativeAddCommandServices = ReturnType<
	typeof setupNativeAddCommand
>;

function failWithUsage(services: INativeAddCommandServices): void {
	services.$errors.failWithHelp(
		"Usage: ns native add [swift|objective-c|java|kotlin] [class name]",
	);
}

function getIosSourcePathBase(services: INativeAddCommandServices): string {
	const resources = services.$projectData.getAppResourcesDirectoryPath();
	return path.join(resources, "iOS", "src");
}

function getAndroidSourcePathBase(services: INativeAddCommandServices): string {
	const resources = services.$projectData.getAppResourcesDirectoryPath();
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

function checkAndUpdateGradleProperties(
	services: INativeAddCommandServices,
): boolean {
	const resources = services.$projectData.getAppResourcesDirectoryPath();

	const filePath = path.join(resources, "Android", "gradle.properties");

	if (fs.existsSync(filePath)) {
		const fileContent = fs.readFileSync(filePath, "utf8");
		const propertyRegex = /^useKotlin\s*=\s*(true|false)$/m;
		const match = propertyRegex.exec(fileContent);

		if (match) {
			const useKotlin = match[1];

			if (useKotlin === "false") {
				services.$errors.failWithHelp(
					"The useKotlin property is set to false. Stopping processing. Kotlin must be enabled in gradle.properties to use.",
				);
				return false;
			}

			if (useKotlin === "true") {
				return true;
			}
		} else {
			fs.appendFileSync(filePath, `${EOL}useKotlin=true${EOL}`);
			services.$logger.info(
				'Added "useKotlin=true" property to gradle.properties.',
			);
		}
	} else {
		fs.writeFileSync(filePath, `useKotlin=true${EOL}`);
		services.$logger.info(
			'Created gradle.properties with "useKotlin=true" property.',
		);
	}
	return true;
}

export function generateJavaKotlin(
	services: INativeAddCommandServices,
	className: string,
	extension: string,
): void {
	const fileExt = extension == "java" ? extension : "kt";
	const packageName = getPackageName(className);
	const classSimpleName = getClassSimpleName(className);
	const packagePath = path.join(
		getAndroidSourcePathBase(services),
		...packageName.split("."),
	);
	const filePath = path.join(packagePath, `${classSimpleName}.${fileExt}`);

	if (fs.existsSync(filePath)) {
		services.$errors.failWithHelp(
			`${extension} file '${filePath}' already exists.`,
		);
		return;
	}

	if (extension == "kotlin" && !checkAndUpdateGradleProperties(services)) {
		return;
	}

	const fileContent =
		extension == "java"
			? generateJavaClassContent(packageName, classSimpleName)
			: generateKotlinClassContent(packageName, classSimpleName);

	fs.mkdirSync(packagePath, { recursive: true });
	fs.writeFileSync(filePath, fileContent);
	services.$logger.info(
		`${capitalizeFirstLetter(
			extension,
		)} file '${filePath}' generated successfully.`,
	);
}

function generateOrUpdateModuleMap(
	services: INativeAddCommandServices,
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
			services.$logger.warn(
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

	services.$logger.info(
		`Module map '${moduleMapPath}' has been updated with the header '${headerFileName}'.`,
	);
}

function generateObjectiveCFiles(
	services: INativeAddCommandServices,
	className: string,
	classFilePath: string,
	interfaceFilePath: string,
): boolean {
	if (fs.existsSync(classFilePath)) {
		services.$errors.failWithHelp(
			`Error: File '${classFilePath}' already exists.`,
		);
		return false;
	}

	if (fs.existsSync(interfaceFilePath)) {
		services.$errors.failWithHelp(
			`Error: File '${interfaceFilePath}' already exists.`,
		);
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
	services.$logger.trace(
		`Objective-C class file '${classFilePath}' generated successfully.`,
	);

	fs.writeFileSync(interfaceFilePath, interfaceContent);
	services.$logger.trace(
		`Objective-C interface file '${interfaceFilePath}' generated successfully.`,
	);
	return true;
}

export function generateObjectiveC(
	services: INativeAddCommandServices,
	className: string,
): void {
	const iosSourceBase = getIosSourcePathBase(services);

	const classFilePath = path.join(iosSourceBase, `${className}.m`);
	const headerFilePath = path.join(iosSourceBase, `${className}.h`);

	if (
		generateObjectiveCFiles(services, className, classFilePath, headerFilePath)
	) {
		// Modify/Generate moduleMap
		generateOrUpdateModuleMap(
			services,
			`${className}.h`,
			path.join(iosSourceBase, "module.modulemap"),
		);
	}
}

function generateSwiftFile(
	services: INativeAddCommandServices,
	className: string,
	filePath: string,
): void {
	const directory = path.dirname(filePath);

	if (!fs.existsSync(directory)) {
		fs.mkdirSync(directory, { recursive: true });
		services.$logger.trace(`Created directory: '${directory}'.`);
	}

	if (fs.existsSync(filePath)) {
		services.$errors.failWithHelp(`Error: File '${filePath}' already exists.`);
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
	services.$logger.info(`Swift file '${filePath}' generated successfully.`);
}

export function generateSwift(
	services: INativeAddCommandServices,
	className: string,
): void {
	const iosSourceBase = getIosSourcePathBase(services);
	const swiftFilePath = path.join(iosSourceBase, `${className}.swift`);
	generateSwiftFile(services, className, swiftFilePath);
}

const generators: Record<
	NativeAddLanguage,
	(services: INativeAddCommandServices, className: string) => void
> = {
	java: (services, className) =>
		generateJavaKotlin(services, className, "java"),
	kotlin: (services, className) =>
		generateJavaKotlin(services, className, "kotlin"),
	swift: generateSwift,
	"objective-c": generateObjectiveC,
};

export const nativeAddCommandDefinition = defineCommand({
	name: "native|add",
	description:
		"Commands to add native files to the application placing them in the correct directory.",
	arguments: "any",
	setup: setupNativeAddCommand,
	canExecute(context, services: INativeAddCommandServices): boolean {
		failWithUsage(services);
		return false;
	},
	run(context, services: INativeAddCommandServices): void {
		failWithUsage(services);
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
		arguments: "any",
		setup(): INativeAddLanguageCommandServices {
			return {
				...setupNativeAddCommand(),
				language,
			};
		},
		canExecute(context, services: INativeAddLanguageCommandServices): boolean {
			if (context.args.length !== 1) {
				failWithUsage(services);
			}

			return true;
		},
		run(context, services: INativeAddLanguageCommandServices): void {
			generators[services.language](services, context.args[0]);
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
