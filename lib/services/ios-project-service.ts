///<reference path="../.d.ts"/>
"use strict";

import Future = require("fibers/future");
import path = require("path");
import shell = require("shelljs");
import util = require("util");
import xcode = require("xcode");
import constants = require("./../constants");
import helpers = require("./../common/helpers");
import projectServiceBaseLib = require("./platform-project-service-base");

class IOSProjectService extends projectServiceBaseLib.PlatformProjectServiceBase implements  IPlatformProjectService {
	private static XCODE_PROJECT_EXT_NAME = ".xcodeproj";
	private static XCODEBUILD_MIN_VERSION = "6.0";
	private static IOS_PROJECT_NAME_PLACEHOLDER = "__PROJECT_NAME__";
	private static IOS_PLATFORM_NAME = "ios";
	
	private get $npmInstallationManager(): INpmInstallationManager {
		return this.$injector.resolve("npmInstallationManager");
	}

	constructor(private $projectData: IProjectData,
		$fs: IFileSystem,
		private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $logger: ILogger,
		private $iOSEmulatorServices: Mobile.IEmulatorPlatformServices,
		private $options: IOptions,
		private $injector: IInjector) {
			super($fs); 
		}

	public get platformData(): IPlatformData {
		var projectRoot = path.join(this.$projectData.platformsDir, "ios");

		return {
			frameworkPackageName: "tns-ios",
			normalizedPlatformName: "iOS",
			appDestinationDirectoryPath: path.join(projectRoot, this.$projectData.projectName),
			appResourcesDestinationDirectoryPath: path.join(projectRoot, this.$projectData.projectName, "Resources"),
			platformProjectService: this,
			emulatorServices: this.$iOSEmulatorServices,
			projectRoot: projectRoot,
			deviceBuildOutputPath: path.join(projectRoot, "build", "device"),
			emulatorBuildOutputPath: path.join(projectRoot, "build", "emulator"),
			validPackageNamesForDevice: [
				this.$projectData.projectName + ".ipa"
			],
			validPackageNamesForEmulator: [
				this.$projectData.projectName + ".app"
			],
			frameworkFilesExtensions: [".a", ".framework", ".bin"],
			frameworkDirectoriesExtensions: [".framework"],
			frameworkDirectoriesNames: ["Metadata"],
			targetedOS: ['darwin'],
			configurationFileName: "Info.plist",
			configurationFilePath: path.join(projectRoot, this.$projectData.projectName,  this.$projectData.projectName+"-Info.plist"),
			mergeXmlConfig: [{ "nodename": "plist", "attrname": "*" }, {"nodename": "dict", "attrname": "*"}]
		};
	}

	public validate(): IFuture<void> {
		return (() => {
			try {
				this.$childProcess.exec("which xcodebuild").wait();
			} catch(error) {
				this.$errors.fail("Xcode is not installed. Make sure you have Xcode installed and added to your PATH");
			}

			var xcodeBuildVersion = this.$childProcess.exec("xcodebuild -version | head -n 1 | sed -e 's/Xcode //'").wait();
			var splitedXcodeBuildVersion = xcodeBuildVersion.split(".");
			if(splitedXcodeBuildVersion.length === 3) {
				xcodeBuildVersion = util.format("%s.%s", splitedXcodeBuildVersion[0], splitedXcodeBuildVersion[1]);
			}

			if(helpers.versionCompare(xcodeBuildVersion, IOSProjectService.XCODEBUILD_MIN_VERSION) < 0) {
				this.$errors.fail("NativeScript can only run in Xcode version %s or greater", IOSProjectService.XCODEBUILD_MIN_VERSION);
			}

		}).future<void>()();
	}

	public createProject(projectRoot: string, frameworkDir: string): IFuture<void> {
		return (() => {
			if(this.$options.symlink) {
				this.$fs.ensureDirectoryExists(path.join(projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER)).wait();
				var xcodeProjectName = util.format("%s.xcodeproj", IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER);

				shell.cp("-R", path.join(frameworkDir, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER, "*"), path.join(projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER));
				shell.cp("-R", path.join(frameworkDir, xcodeProjectName), projectRoot);

				var directoryContent = this.$fs.readDirectory(frameworkDir).wait();
				var frameworkFiles = _.difference(directoryContent, [IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER, xcodeProjectName]);
				_.each(frameworkFiles, (file: string) => {
					this.$fs.symlink(path.join(frameworkDir, file), path.join(projectRoot, file)).wait();
				});

			}  else {
				shell.cp("-R", path.join(frameworkDir, "*"), projectRoot);
			}
		}).future<void>()();
	}

	public interpolateData(projectRoot: string): IFuture<void> {
		return (() => {
			var infoPlistFilePath = path.join(projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER, util.format("%s-%s", IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER, "Info.plist"));
			shell.sed('-i', "__CFBUNDLEIDENTIFIER__", this.$projectData.projectId, infoPlistFilePath);

			this.replaceFileName("-Info.plist", path.join(projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER)).wait();
			this.replaceFileName("-Prefix.pch", path.join(projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER)).wait();
			this.replaceFileName(IOSProjectService.XCODE_PROJECT_EXT_NAME, projectRoot).wait();

			var pbxprojFilePath = path.join(projectRoot, this.$projectData.projectName + IOSProjectService.XCODE_PROJECT_EXT_NAME, "project.pbxproj");
			this.replaceFileContent(pbxprojFilePath).wait();

			var mainFilePath = path.join(projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER, "main.m");
			this.replaceFileContent(mainFilePath).wait();
		}).future<void>()();
	}

	public afterCreateProject(projectRoot: string): IFuture<void> {
		return (() => {
			this.$fs.rename(path.join(projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER),
				path.join(projectRoot, this.$projectData.projectName)).wait();
		}).future<void>()();
	}

	public buildProject(projectRoot: string): IFuture<void> {
		return (() => {
			let basicArgs = [
				"-configuration", this.$options.release ? "Release" : "Debug",
				"build",
				'SHARED_PRECOMPS_DIR=' + path.join(projectRoot, 'build', 'sharedpch')
			];
			
			let xcworkspacePath = path.join(projectRoot, this.$projectData.projectName + ".xcworkspace");
			if(this.$fs.exists(xcworkspacePath).wait()) {
				basicArgs.push("-workspace", xcworkspacePath);
				basicArgs.push("-scheme", this.$projectData.projectName);			
			} else {
				basicArgs.push("-project", path.join(projectRoot, this.$projectData.projectName + ".xcodeproj"));
				basicArgs.push("-target", this.$projectData.projectName);								
			}
			
			let args: string[] = [];
			if(this.$options.forDevice) {
				args = basicArgs.concat([
					"-xcconfig", path.join(projectRoot, this.$projectData.projectName, "build.xcconfig"),
					"-sdk", "iphoneos",
					'ARCHS=armv7 arm64',
					'VALID_ARCHS=armv7 arm64',
					"CONFIGURATION_BUILD_DIR=" + path.join(projectRoot, "build", "device")
				]);
			} else {
				args = basicArgs.concat([
					"-sdk", "iphonesimulator",
					"-arch", "i386",
					"VALID_ARCHS=\"i386\"",
					"CONFIGURATION_BUILD_DIR=" + path.join(projectRoot, "build", "emulator")
				]);
			}

			this.$childProcess.spawnFromEvent("xcodebuild", args, "exit", {cwd: this.$options, stdio: 'inherit'}).wait();

			if(this.$options.forDevice) {
				var buildOutputPath = path.join(projectRoot, "build", "device");

				// Produce ipa file
				var xcrunArgs = [
					"-sdk", "iphoneos",
					"PackageApplication",
					"-v", path.join(buildOutputPath, this.$projectData.projectName + ".app"),
					"-o", path.join(buildOutputPath, this.$projectData.projectName + ".ipa")
				];

				this.$childProcess.spawnFromEvent("xcrun", xcrunArgs, "exit", {cwd: this.$options, stdio: 'inherit'}).wait();
			}
		}).future<void>()();
	}

	public isPlatformPrepared(projectRoot: string): IFuture<boolean> {
		return this.$fs.exists(path.join(projectRoot, this.$projectData.projectName, constants.APP_FOLDER_NAME));
	}

	public addLibrary(libraryPath: string): IFuture<void> {
		return (() => {
			this.validateDynamicFramework(libraryPath).wait();
			var umbrellaHeader = this.getUmbrellaHeaderFromDynamicFramework(libraryPath).wait();

			let frameworkName = path.basename(libraryPath, path.extname(libraryPath));
			let targetPath = path.join("lib", this.platformData.normalizedPlatformName, frameworkName);
			let fullTargetPath = path.join(this.$projectData.projectDir, targetPath);
			this.$fs.ensureDirectoryExists(fullTargetPath).wait();
			shell.cp("-R", libraryPath, fullTargetPath);

			let project = this.createPbxProj();
			let frameworkPath = this.getFrameworkRelativePath(libraryPath);
			project.addFramework(frameworkPath, { customFramework: true, embed: true });
			project.updateBuildProperty("IPHONEOS_DEPLOYMENT_TARGET", "8.0");
			this.savePbxProj(project).wait();
			this.$logger.info("The iOS Deployment Target is now 8.0 in order to support Cocoa Touch Frameworks.");
		}).future<void>()();
	}

	public canUpdatePlatform(currentVersion: string, newVersion: string): IFuture<boolean> {
		return (() => {
			var currentXcodeProjectFile = this.buildPathToXcodeProjectFile(currentVersion);
			var currentXcodeProjectFileContent = this.$fs.readFile(currentXcodeProjectFile).wait();

			var newXcodeProjectFile = this.buildPathToXcodeProjectFile(newVersion);
			var newXcodeProjectFileContent = this.$fs.readFile(newXcodeProjectFile).wait();

			return currentXcodeProjectFileContent === newXcodeProjectFileContent;

		}).future<boolean>()();
	}

	public updatePlatform(currentVersion: string, newVersion: string): IFuture<void> {
		return (() => {
			// Copy old file to options["profile-dir"]
			var sourceFile = path.join(this.platformData.projectRoot, util.format("%s.xcodeproj", this.$projectData.projectName));
			var destinationFile = path.join(this.$options.profileDir, "xcodeproj");
			this.$fs.deleteDirectory(destinationFile).wait();
			shell.cp("-R", path.join(sourceFile, "*"), destinationFile);
			this.$logger.info("Backup file %s at location %s", sourceFile, destinationFile);
			this.$fs.deleteDirectory(path.join(this.platformData.projectRoot, util.format("%s.xcodeproj", this.$projectData.projectName))).wait();

			// Copy xcodeProject file
			var cachedPackagePath = path.join(this.$npmInstallationManager.getCachedPackagePath(this.platformData.frameworkPackageName, newVersion), constants.PROJECT_FRAMEWORK_FOLDER_NAME, util.format("%s.xcodeproj", IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER));
			shell.cp("-R", path.join(cachedPackagePath, "*"), path.join(this.platformData.projectRoot, util.format("%s.xcodeproj", this.$projectData.projectName)));
			this.$logger.info("Copied from %s at %s.", cachedPackagePath, this.platformData.projectRoot);

			var pbxprojFilePath = path.join(this.platformData.projectRoot, this.$projectData.projectName + IOSProjectService.XCODE_PROJECT_EXT_NAME, "project.pbxproj");
			this.replaceFileContent(pbxprojFilePath).wait();
		}).future<void>()();
	}
	
	public prepareProject(): IFuture<void> {
		return (() => {
			let project = this.createPbxProj();
			let resources = project.pbxGroupByName("Resources");
			
			if(resources) {
				let references = project.pbxFileReferenceSection();
				
				let xcodeProjectImages = _.map(<any[]>resources.children, resource => this.replace(references[resource.value].name));
				this.$logger.trace("Images from Xcode project");
				this.$logger.trace(xcodeProjectImages);
				
				let appResourcesImages = this.$fs.readDirectory(this.platformData.appResourcesDestinationDirectoryPath).wait();
				this.$logger.trace("Current images from App_Resources");
				this.$logger.trace(appResourcesImages);
	
				let imagesToAdd = _.difference(appResourcesImages, xcodeProjectImages);
				this.$logger.trace(`New images to add into xcode project: ${imagesToAdd.join(", ")}`);			
				_.each(imagesToAdd, image => project.addResourceFile(path.relative(this.platformData.projectRoot, path.join( this.platformData.appResourcesDestinationDirectoryPath, image))));
				
				let imagesToRemove = _.difference(xcodeProjectImages, appResourcesImages);
				this.$logger.trace(`Images to remove from xcode project: ${imagesToRemove.join(", ")}`);			
				_.each(imagesToRemove, image => project.removeResourceFile(path.join(this.platformData.appResourcesDestinationDirectoryPath, image))); 
				
				this.savePbxProj(project).wait();
			}
			
		}).future<void>()();
	}
	
	public prepareAppResources(appResourcesDirectoryPath: string): IFuture<void> {
		return this.$fs.deleteDirectory(this.platformData.appResourcesDestinationDirectoryPath);
	}
	
	private replace(name: string): string {
		if(_.startsWith(name, '"')) {
			name = name.substr(1, name.length-2);
		}
		
		return name.replace(/\\\"/g, "\"");
	}
	
	private getFrameworkRelativePath(libraryPath: string): string {
		let frameworkName = path.basename(libraryPath, path.extname(libraryPath));
		let targetPath = path.join("lib", this.platformData.normalizedPlatformName, frameworkName);
		let frameworkPath = path.relative("platforms/ios", path.join(targetPath, frameworkName + ".framework"));
		return frameworkPath;
	}
	
	private get pbxProjPath(): string {
		return path.join(this.platformData.projectRoot, this.$projectData.projectName + ".xcodeproj", "project.pbxproj");
	}
	
	private createPbxProj(): any {
		let project = new xcode.project(this.pbxProjPath);
		project.parseSync();
		
		return project;
	}
	
	private savePbxProj(project: any): IFuture<void> {
		 return this.$fs.writeFile(this.pbxProjPath, project.writeSync());
	}
	
	public preparePluginNativeCode(pluginData: IPluginData): IFuture<void> {
		return (() => {
			let pluginPlatformsFolderPath = pluginData.pluginPlatformsFolderPath(IOSProjectService.IOS_PLATFORM_NAME);
			_.each(this.getAllDynamicFrameworksForPlugin(pluginData).wait(), fileName => this.addLibrary(path.join(pluginPlatformsFolderPath, fileName)).wait());
		}).future<void>()();
	}
	
	public removePluginNativeCode(pluginData: IPluginData): IFuture<void> {
		return (() => {
			let pluginPlatformsFolderPath = pluginData.pluginPlatformsFolderPath(IOSProjectService.IOS_PLATFORM_NAME);
			let project = this.createPbxProj();
						
			_.each(this.getAllDynamicFrameworksForPlugin(pluginData).wait(), fileName => {
				let fullFrameworkPath = path.join(pluginPlatformsFolderPath, fileName);
				let relativeFrameworkPath = this.getFrameworkRelativePath(fullFrameworkPath);
				project.removeFramework(relativeFrameworkPath, { customFramework: true, embed: true })
			});
			
			this.savePbxProj(project).wait();
		}).future<void>()();
	}
	
	private getAllDynamicFrameworksForPlugin(pluginData: IPluginData): IFuture<string[]> {
		let filterCallback = (fileName: string, pluginPlatformsFolderPath: string) => path.extname(fileName) === ".framework";
		return this.getAllNativeLibrariesForPlugin(pluginData, IOSProjectService.IOS_PLATFORM_NAME, filterCallback);
	}

	private buildPathToXcodeProjectFile(version: string): string {
		return path.join(this.$npmInstallationManager.getCachedPackagePath(this.platformData.frameworkPackageName, version), constants.PROJECT_FRAMEWORK_FOLDER_NAME, util.format("%s.xcodeproj", IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER), "project.pbxproj");
	}

	private validateDynamicFramework(libraryPath: string): IFuture<void> {
		return (() => {
			var infoPlistPath = path.join(libraryPath, "Info.plist");
			if (!this.$fs.exists(infoPlistPath).wait()) {
				this.$errors.failWithoutHelp("The bundle at %s does not contain an Info.plist file.", libraryPath);
			}

			var packageType = this.$childProcess.exec(`/usr/libexec/PlistBuddy -c "Print :CFBundlePackageType" "${infoPlistPath}"`).wait().trim();
			if (packageType !== "FMWK") {
				this.$errors.failWithoutHelp("The bundle at %s does not appear to be a dynamic framework.", libraryPath);
			}
		}).future<void>()();
	}

	private getUmbrellaHeaderFromDynamicFramework(libraryPath: string): IFuture<string> {
		return (() => {
			var modulemapPath = path.join(libraryPath, "Modules", "module.modulemap");
			if (!this.$fs.exists(modulemapPath).wait()) {
				this.$errors.failWithoutHelp("The framework at %s does not contain a module.modulemap file.", modulemapPath);
			}

			var modulemap = this.$fs.readText(modulemapPath).wait();
			var umbrellaRegex = /umbrella header "(.+\.h)"/g;
			var match = umbrellaRegex.exec(modulemap);
			if (!match) {
				this.$errors.failWithoutHelp("The modulemap at %s does not specify an umbrella header.", modulemapPath);
			}

			return match[1];
		}).future<string>()();
	}

	private replaceFileContent(file: string): IFuture<void> {
		return (() => {
			var fileContent = this.$fs.readText(file).wait();
			var replacedContent = helpers.stringReplaceAll(fileContent, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER, this.$projectData.projectName);
			this.$fs.writeFile(file, replacedContent).wait();
		}).future<void>()();
	}

	private replaceFileName(fileNamePart: string, fileRootLocation: string): IFuture<void> {
		return (() => {
			var oldFileName = IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER + fileNamePart;
			var newFileName = this.$projectData.projectName + fileNamePart;

			this.$fs.rename(path.join(fileRootLocation, oldFileName), path.join(fileRootLocation, newFileName)).wait();
		}).future<void>()();
	}
}
$injector.register("iOSProjectService", IOSProjectService);