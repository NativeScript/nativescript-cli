import { IProjectData } from "../definitions/project";
import * as fs from "fs";
import { ICommandParameter, ICommand } from "../common/definitions/commands";
import { IErrors } from "../common/declarations";
import * as path from "path";
import { injector } from "../common/yok";
import { EOL } from "os";

export class NativeAddCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		protected $projectData: IProjectData,
		protected $logger: ILogger,
		protected $errors: IErrors
	) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		this.failWithUsage();

		return Promise.resolve();
	}

	protected failWithUsage(): void {
		this.$errors.failWithHelp(
			"Usage: ns native add [swift|objective-c|java|kotlin] [class name]"
		);
	}
	public async canExecute(args: string[]): Promise<boolean> {
		this.failWithUsage();
		return false;
	}

	protected getIosSourcePathBase() {
		const resources = this.$projectData.getAppResourcesDirectoryPath();
		return path.join(resources, "iOS", "src");
	}

	protected getAndroidSourcePathBase() {
		const resources = this.$projectData.getAppResourcesDirectoryPath();
		return path.join(resources, "Android", "src", "main", "java");
	}
}
export class NativeAddSingleCommand extends NativeAddCommand {
	constructor($projectData: IProjectData, $logger: ILogger, $errors: IErrors) {
		super($projectData, $logger, $errors);
	}
	public async canExecute(args: string[]): Promise<boolean> {
		if (!args || args.length !== 1) {
			this.failWithUsage();
		}

		return true;
	}
}

export class NativeAddAndroidCommand extends NativeAddSingleCommand {
	constructor($projectData: IProjectData, $logger: ILogger, $errors: IErrors) {
		super($projectData, $logger, $errors);
	}

	private getPackageName(className: string): string {
		const lastDotIndex = className.lastIndexOf(".");
		if (lastDotIndex !== -1) {
			return className.substring(0, lastDotIndex);
		}
		return "";
	}

	private getClassSimpleName(className: string): string {
		const lastDotIndex = className.lastIndexOf(".");
		if (lastDotIndex !== -1) {
			return className.substring(lastDotIndex + 1);
		}
		return className;
	}

	private generateJavaClassContent(
		packageName: string,
		classSimpleName: string
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

	private generateKotlinClassContent(
		packageName: string,
		classSimpleName: string
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
	public doJavaKotlin(className: string, extension: string): void {
		const fileExt = extension == "java" ? extension : "kt";
		const packageName = this.getPackageName(className);
		const classSimpleName = this.getClassSimpleName(className);
		const packagePath = path.join(
			this.getAndroidSourcePathBase(),
			...packageName.split(".")
		);
		const filePath = path.join(packagePath, `${classSimpleName}.${fileExt}`);

		if (fs.existsSync(filePath)) {
			this.$errors.failWithHelp(
				`${extension} file '${filePath}' already exists.`
			);
			return;
		}

		if (extension == "kotlin" && !this.checkAndUpdateGradleProperties()) {
			return;
		}

		const fileContent =
			extension == "java"
				? this.generateJavaClassContent(packageName, classSimpleName)
				: this.generateKotlinClassContent(packageName, classSimpleName);

		fs.mkdirSync(packagePath, { recursive: true });
		fs.writeFileSync(filePath, fileContent);
		this.$logger.info(
			`${extension} file '${filePath}' generated successfully.`
		);
	}

	private checkAndUpdateGradleProperties(): boolean {
		const resources = this.$projectData.getAppResourcesDirectoryPath();

		const filePath = path.join(resources, "Android", "gradle.properties");

		if (fs.existsSync(filePath)) {
			const fileContent = fs.readFileSync(filePath, "utf8");
			const propertyRegex = /^useKotlin\s*=\s*(true|false)$/m;
			const match = propertyRegex.exec(fileContent);

			if (match) {
				const useKotlin = match[1];

				if (useKotlin === "false") {
					this.$errors.failWithHelp(
						"The useKotlin property is set to false. Stopping processing."
					);
					return false;
				}

				if (useKotlin === "true") {
					this.$logger.warn(
						'gradle.properties already contains "useKotlin=true".'
					);
					return true;
				}
			} else {
				fs.appendFileSync(filePath, `${EOL}useKotlin=true${EOL}`);
				this.$logger.info(
					'Added "useKotlin=true" property to gradle.properties.'
				);
			}
		} else {
			fs.writeFileSync(filePath, `useKotlin=true${EOL}`);
			this.$logger.info(
				'Created gradle.properties with "useKotlin=true" property.'
			);
		}
		return true;
	}
}

export class NativeAddJavaCommand extends NativeAddAndroidCommand {
	constructor($projectData: IProjectData, $logger: ILogger, $errors: IErrors) {
		super($projectData, $logger, $errors);
	}

	public async execute(args: string[]): Promise<void> {
		this.doJavaKotlin(args[0], "java");

		return Promise.resolve();
	}
}

export class NativeAddKotlinCommand extends NativeAddAndroidCommand {
	constructor($projectData: IProjectData, $logger: ILogger, $errors: IErrors) {
		super($projectData, $logger, $errors);
	}

	public async execute(args: string[]): Promise<void> {
		this.doJavaKotlin(args[0], "kotlin");

		return Promise.resolve();
	}
}

export class NativeAddObjectiveCCommand extends NativeAddSingleCommand {
	constructor($projectData: IProjectData, $logger: ILogger, $errors: IErrors) {
		super($projectData, $logger, $errors);
	}

	public async execute(args: string[]): Promise<void> {
		this.doObjectiveC(args[0]);

		return Promise.resolve();
	}
	private doObjectiveC(className: string) {
		const iosSourceBase = this.getIosSourcePathBase();

		const classFilePath = path.join(iosSourceBase, `${className}.m`);
		const headerFilePath = path.join(iosSourceBase, `${className}.h`);

		if (
			this.generateObjectiveCFiles(className, classFilePath, headerFilePath)
		) {
			// Modify/Generate moduleMap
			this.generateOrUpdateModuleMap(
				`${className}.h`,
				path.join(iosSourceBase, "module.modulemap")
			);
		}
	}

	private generateOrUpdateModuleMap(
		headerFileName: string,
		moduleMapPath: string
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
				this.$logger.warn(
					`Header '${headerFileName}' is already added to the module map.`
				);
				return;
			}

			const updatedModuleMapContent = moduleMapContent.replace(
				new RegExp(`module ${moduleName} {\\s*([^}]*)\\s*}`, "s"),
				`module ${moduleName} {${EOL}    $1${EOL}    ${headerDeclaration}${EOL}}`
			);

			fs.writeFileSync(moduleMapPath, updatedModuleMapContent);
		} else {
			// Module declaration does not exist in the module map
			const moduleDeclaration = `module ${moduleName} {${EOL}    ${headerDeclaration}${EOL}    export *${EOL}}`;

			moduleMapContent += `${EOL}${EOL}${moduleDeclaration}`;
			fs.writeFileSync(moduleMapPath, moduleMapContent);
		}

		this.$logger.info(
			`Module map '${moduleMapPath}' has been updated with the header '${headerFileName}'.`
		);
	}

	private generateObjectiveCFiles(
		className: string,
		classFilePath: string,
		interfaceFilePath: string
	): boolean {
		if (fs.existsSync(classFilePath)) {
			this.$errors.failWithHelp(
				`Error: File '${classFilePath}' already exists.`
			);
			return false;
		}

		if (fs.existsSync(interfaceFilePath)) {
			this.$errors.failWithHelp(
				`Error: File '${interfaceFilePath}' already exists.`
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
		this.$logger.trace(
			`Objective-C class file '${classFilePath}' generated successfully.`
		);

		fs.writeFileSync(interfaceFilePath, interfaceContent);
		this.$logger.trace(
			`Objective-C interface file '${interfaceFilePath}' generated successfully.`
		);
		return true;
	}
}

export class NativeAddSwiftCommand extends NativeAddSingleCommand {
	constructor($projectData: IProjectData, $logger: ILogger, $errors: IErrors) {
		super($projectData, $logger, $errors);
	}

	public async execute(args: string[]): Promise<void> {
		this.doSwift(args[0]);

		return Promise.resolve();
	}

	private doSwift(className: string) {
		const iosSourceBase = this.getIosSourcePathBase();
		const swiftFilePath = path.join(iosSourceBase, `${className}.swift`);
		this.generateSwiftFile(className, swiftFilePath);
	}

	private generateSwiftFile(className: string, filePath: string): void {
		const directory = path.dirname(filePath);

		if (!fs.existsSync(directory)) {
			fs.mkdirSync(directory, { recursive: true });
			this.$logger.trace(`Created directory: '${directory}'.`);
		}

		if (fs.existsSync(filePath)) {
			this.$errors.failWithHelp(`Error: File '${filePath}' already exists.`);
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
		this.$logger.info(`Swift file '${filePath}' generated successfully.`);
	}
}

injector.registerCommand(["native|add"], NativeAddCommand);
injector.registerCommand(["native|add|java"], NativeAddJavaCommand);
injector.registerCommand(["native|add|kotlin"], NativeAddKotlinCommand);
injector.registerCommand(["native|add|swift"], NativeAddSwiftCommand);
injector.registerCommand(
	["native|add|objective-c"],
	NativeAddObjectiveCCommand
);
