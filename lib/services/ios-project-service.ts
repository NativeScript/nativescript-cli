///<reference path="../.d.ts"/>
"use strict";

import * as path from "path";
import * as shell from "shelljs";
import * as util from "util";
import * as os from "os";
import * as semver from "semver";
import * as xcode from "xcode";
import * as constants from "../constants";
import * as helpers from "../common/helpers";
import * as projectServiceBaseLib from "./platform-project-service-base";
import Future = require("fibers/future");

export class IOSProjectService extends projectServiceBaseLib.PlatformProjectServiceBase implements IPlatformProjectService {
	private static XCODE_PROJECT_EXT_NAME = ".xcodeproj";
	private static XCODEBUILD_MIN_VERSION = "6.0";
	private static IOS_PROJECT_NAME_PLACEHOLDER = "__PROJECT_NAME__";
	private static IOS_PLATFORM_NAME = "ios";
	private static PODFILE_POST_INSTALL_SECTION_NAME = "post_install";

	private get $npmInstallationManager(): INpmInstallationManager {
		return this.$injector.resolve("npmInstallationManager");
	}

	constructor($projectData: IProjectData,
		$fs: IFileSystem,
		private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $logger: ILogger,
		private $iOSEmulatorServices: Mobile.IEmulatorPlatformServices,
		private $options: IOptions,
		private $injector: IInjector,
		$projectDataService: IProjectDataService,
		private $prompter: IPrompter,
		private $config: IConfiguration) {
			super($fs, $projectData, $projectDataService);
		}

	public get platformData(): IPlatformData {
		let projectRoot = path.join(this.$projectData.platformsDir, "ios");

		return {
			frameworkPackageName: "tns-ios",
			normalizedPlatformName: "iOS",
			appDestinationDirectoryPath: path.join(projectRoot, this.$projectData.projectName),
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
			frameworkDirectoriesNames: ["Metadata", "metadataGenerator", "NativeScript", "internal"],
			targetedOS: ['darwin'],
			configurationFileName: "Info.plist",
			configurationFilePath: path.join(projectRoot, this.$projectData.projectName,  this.$projectData.projectName+"-Info.plist"),
			relativeToFrameworkConfigurationFilePath: path.join("__PROJECT_NAME__", "__PROJECT_NAME__-Info.plist"),
			mergeXmlConfig: [{ "nodename": "plist", "attrname": "*" }, {"nodename": "dict", "attrname": "*"}]
		};
	}

	public getAppResourcesDestinationDirectoryPath(): IFuture<string> {
		return (() => {
			let frameworkVersion = this.getFrameworkVersion(this.platformData.frameworkPackageName).wait();

			if(semver.lt(frameworkVersion, "1.3.0")) {
				return path.join(this.platformData.projectRoot, this.$projectData.projectName, "Resources", "icons");
			}

			return path.join(this.platformData.projectRoot, this.$projectData.projectName, "Resources");
		}).future<string>()();
	}

	public validate(): IFuture<void> {
		return (() => {
			try {
				this.$childProcess.exec("which xcodebuild").wait();
			} catch(error) {
				this.$errors.fail("Xcode is not installed. Make sure you have Xcode installed and added to your PATH");
			}

			let xcodeBuildVersion = this.$childProcess.exec("xcodebuild -version | head -n 1 | sed -e 's/Xcode //'").wait();
			let splitedXcodeBuildVersion = xcodeBuildVersion.split(".");
			if(splitedXcodeBuildVersion.length === 3) {
				xcodeBuildVersion = util.format("%s.%s", splitedXcodeBuildVersion[0], splitedXcodeBuildVersion[1]);
			}

			if(helpers.versionCompare(xcodeBuildVersion, IOSProjectService.XCODEBUILD_MIN_VERSION) < 0) {
				this.$errors.fail("NativeScript can only run in Xcode version %s or greater", IOSProjectService.XCODEBUILD_MIN_VERSION);
			}

		}).future<void>()();
	}

	public createProject(frameworkDir: string, frameworkVersion: string): IFuture<void> {
		return (() => {
			this.$fs.ensureDirectoryExists(path.join(this.platformData.projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER)).wait();
			if(this.$options.symlink) {
				let xcodeProjectName = util.format("%s.xcodeproj", IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER);

				shell.cp("-R", path.join(frameworkDir, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER, "*"), path.join(this.platformData.projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER));
				shell.cp("-R", path.join(frameworkDir, xcodeProjectName), this.platformData.projectRoot);

				let directoryContent = this.$fs.readDirectory(frameworkDir).wait();
				let frameworkFiles = _.difference(directoryContent, [IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER, xcodeProjectName]);
				_.each(frameworkFiles, (file: string) => {
					this.$fs.symlink(path.join(frameworkDir, file), path.join(this.platformData.projectRoot, file)).wait();
				});

			}  else {
				shell.cp("-R", path.join(frameworkDir, "*"), this.platformData.projectRoot);
			}
		}).future<void>()();
	}

	public interpolateData(): IFuture<void> {
		return (() => {
			let infoPlistFilePath = path.join(this.platformData.projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER, util.format("%s-%s", IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER, "Info.plist"));
			this.interpolateConfigurationFile(infoPlistFilePath).wait();

			let projectRootFilePath = path.join(this.platformData.projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER);
			this.replaceFileName("-Info.plist", projectRootFilePath).wait();
			this.replaceFileName("-Prefix.pch", projectRootFilePath).wait();
			this.replaceFileName(IOSProjectService.XCODE_PROJECT_EXT_NAME, this.platformData.projectRoot).wait();

			let pbxprojFilePath = path.join(this.platformData.projectRoot, this.$projectData.projectName + IOSProjectService.XCODE_PROJECT_EXT_NAME, "project.pbxproj");
			this.replaceFileContent(pbxprojFilePath).wait();
		}).future<void>()();
	}

	public interpolateConfigurationFile(configurationFilePath?: string): IFuture<void> {
		return (() => {
			shell.sed('-i', "__CFBUNDLEIDENTIFIER__", this.$projectData.projectId, configurationFilePath || this.platformData.configurationFilePath);
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

			// Starting from tns-ios 1.4 the xcconfig file is referenced in the project template
			let frameworkVersion = this.getFrameworkVersion(this.platformData.frameworkPackageName).wait();
			if (semver.lt(frameworkVersion, "1.4.0")) {
				basicArgs.push("-xcconfig", path.join(projectRoot, this.$projectData.projectName, "build.xcconfig"));
			}

			let args: string[] = [];
			if(this.$options.forDevice) {
				args = basicArgs.concat([
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
				let buildOutputPath = path.join(projectRoot, "build", "device");

				// Produce ipa file
				let xcrunArgs = [
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
			let extension = path.extname(libraryPath);
			if (extension === ".framework") {
				this.addDynamicFramework(libraryPath).wait();
			} else {
				this.$errors.failWithoutHelp(`The bundle at ${libraryPath} does not appear to be a dynamic framework package.`);
			}
		}).future<void>()();
	}

	public deploy(deviceIdentifier: string): IFuture<void> {
		return Future.fromResult();
	}

	private addDynamicFramework(frameworkPath: string): IFuture<void> {
		return (() => {
			this.validateFramework(frameworkPath).wait();

			let targetPath = path.join("lib", this.platformData.normalizedPlatformName);
			let fullTargetPath = path.join(this.$projectData.projectDir, targetPath);
			this.$fs.ensureDirectoryExists(fullTargetPath).wait();
			shell.cp("-R", frameworkPath, fullTargetPath);

			let project = this.createPbxProj();
			let frameworkName = path.basename(frameworkPath, path.extname(frameworkPath));
			let frameworkBinaryPath = path.join(frameworkPath, frameworkName);
			let isDynamic = _.contains(this.$childProcess.exec(`otool -Vh ${frameworkBinaryPath}`).wait(), " DYLIB ");

			let frameworkAddOptions: xcode.Options = { customFramework: true };

			if(isDynamic) {
				frameworkAddOptions["embed"] = true;
				project.updateBuildProperty("IPHONEOS_DEPLOYMENT_TARGET", "8.0");
				this.$logger.info("The iOS Deployment Target is now 8.0 in order to support Cocoa Touch Frameworks.");
			}

			let frameworkRelativePath = this.getLibSubpathRelativeToProjectPath(path.basename(frameworkPath));
			project.addFramework(frameworkRelativePath, frameworkAddOptions);
			this.savePbxProj(project).wait();
		}).future<void>()();
	}

	private addStaticLibrary(staticLibPath: string): IFuture<void> {
		return (() => {
			this.validateStaticLibrary(staticLibPath).wait();
			// Copy files to lib folder.
			let libraryName = path.basename(staticLibPath, ".a");
			let libDestinationPath = path.join(this.$projectData.projectDir, path.join("lib", this.platformData.normalizedPlatformName));
			let headersSubpath = path.join("include", libraryName);
			this.$fs.ensureDirectoryExists(path.join(libDestinationPath, headersSubpath)).wait();
			shell.cp("-Rf", staticLibPath, libDestinationPath);
			shell.cp("-Rf", path.join(path.dirname(staticLibPath), headersSubpath), path.join(libDestinationPath, "include"));

			// Add static library to project file and setup header search paths
			let project = this.createPbxProj();
			let relativeStaticLibPath = this.getLibSubpathRelativeToProjectPath(path.basename(staticLibPath));
			project.addFramework(relativeStaticLibPath);

			let relativeHeaderSearchPath = path.join(this.getLibSubpathRelativeToProjectPath(headersSubpath));
			project.addToHeaderSearchPaths({ relativePath: relativeHeaderSearchPath });

			this.generateMobulemap(path.join(libDestinationPath, headersSubpath), libraryName);
			this.savePbxProj(project).wait();
		}).future<void>()();
	}

	public canUpdatePlatform(currentVersion: string, newVersion: string): IFuture<boolean> {
		return (() => {
			let currentXcodeProjectFile = this.buildPathToXcodeProjectFile(currentVersion);
			let currentXcodeProjectFileContent = this.$fs.readFile(currentXcodeProjectFile).wait();

			let newXcodeProjectFile = this.buildPathToXcodeProjectFile(newVersion);
			let newXcodeProjectFileContent = this.$fs.readFile(newXcodeProjectFile).wait();

			return currentXcodeProjectFileContent === newXcodeProjectFileContent;

		}).future<boolean>()();
	}

	public updatePlatform(currentVersion: string, newVersion: string, canUpdate: boolean): IFuture<boolean> {
		return (() => {
			if(!canUpdate) {
				let isUpdateConfirmed = this.$prompter.confirm(`We need to override xcodeproj file. The old one will be saved at ${this.$options.profileDir}. Are you sure?`, () => true).wait();
				if(isUpdateConfirmed) {
					// Copy old file to options["profile-dir"]
					let sourceDir = path.join(this.platformData.projectRoot, `${this.$projectData.projectName}.xcodeproj`);
					let destinationDir = path.join(this.$options.profileDir, "xcodeproj");
					this.$fs.deleteDirectory(destinationDir).wait();
					shell.cp("-R", path.join(sourceDir, "*"), destinationDir);
					this.$logger.info(`Backup file ${sourceDir} at location ${destinationDir}`);
					this.$fs.deleteDirectory(sourceDir).wait();

					// Copy xcodeProject file
					let cachedPackagePath = path.join(this.$npmInstallationManager.getCachedPackagePath(this.platformData.frameworkPackageName, newVersion), constants.PROJECT_FRAMEWORK_FOLDER_NAME, util.format("%s.xcodeproj", IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER));
					shell.cp("-R", path.join(cachedPackagePath, "*"), sourceDir);
					this.$logger.info(`Copied from ${cachedPackagePath} at ${this.platformData.projectRoot}.`);

					let pbxprojFilePath = path.join(this.platformData.projectRoot, this.$projectData.projectName + IOSProjectService.XCODE_PROJECT_EXT_NAME, "project.pbxproj");
					this.replaceFileContent(pbxprojFilePath).wait();
				}

				return isUpdateConfirmed;
			}

			return true;
		}).future<boolean>()();
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

				let appResourcesImages = this.$fs.readDirectory(this.getAppResourcesDestinationDirectoryPath().wait()).wait();
				this.$logger.trace("Current images from App_Resources");
				this.$logger.trace(appResourcesImages);

				let imagesToAdd = _.difference(appResourcesImages, xcodeProjectImages);
				this.$logger.trace(`New images to add into xcode project: ${imagesToAdd.join(", ")}`);
				_.each(imagesToAdd, image => project.addResourceFile(path.relative(this.platformData.projectRoot, path.join(this.getAppResourcesDestinationDirectoryPath().wait(), image))));

				let imagesToRemove = _.difference(xcodeProjectImages, appResourcesImages);
				this.$logger.trace(`Images to remove from xcode project: ${imagesToRemove.join(", ")}`);
				_.each(imagesToRemove, image => project.removeResourceFile(path.join(this.getAppResourcesDestinationDirectoryPath().wait(), image)));

				this.savePbxProj(project).wait();
			}
		}).future<void>()();
	}

	public prepareAppResources(appResourcesDirectoryPath: string): IFuture<void> {
		return (() => {
			this.$fs.deleteDirectory(this.getAppResourcesDestinationDirectoryPath().wait()).wait();
		}).future<void>()();
	}

	private get projectPodFilePath(): string {
		return path.join(this.platformData.projectRoot, "Podfile");
	}

	private get pluginsDebugXcconfigFilePath(): string {
		return path.join(this.platformData.projectRoot, "plugins-debug.xcconfig");
	}

	private get pluginsReleaseXcconfigFilePath(): string {
		return path.join(this.platformData.projectRoot, "plugins-release.xcconfig");
	}

	private replace(name: string): string {
		if(_.startsWith(name, '"')) {
			name = name.substr(1, name.length-2);
		}

		return name.replace(/\\\"/g, "\"");
	}

	private getLibSubpathRelativeToProjectPath(subPath: string): string {
		let targetPath = path.join("lib", this.platformData.normalizedPlatformName);
		let frameworkPath = path.relative("platforms/ios", path.join(targetPath, subPath));
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

	public preparePluginNativeCode(pluginData: IPluginData, opts?: any): IFuture<void> {
		return (() => {
			let pluginPlatformsFolderPath = pluginData.pluginPlatformsFolderPath(IOSProjectService.IOS_PLATFORM_NAME);

			this.prepareFrameworks(pluginPlatformsFolderPath, pluginData).wait();
			this.prepareStaticLibs(pluginPlatformsFolderPath, pluginData).wait();
			this.prepareCocoapods(pluginPlatformsFolderPath).wait();
		}).future<void>()();
	}

	public removePluginNativeCode(pluginData: IPluginData): IFuture<void> {
		return (() => {
			let pluginPlatformsFolderPath = pluginData.pluginPlatformsFolderPath(IOSProjectService.IOS_PLATFORM_NAME);

			this.removeFrameworks(pluginPlatformsFolderPath, pluginData).wait();
			this.removeStaticLibs(pluginPlatformsFolderPath, pluginData).wait();
			this.removeCocoapods(pluginPlatformsFolderPath).wait();
		}).future<void>()();
	}

	public afterPrepareAllPlugins(): IFuture<void> {
		return (() => {
			if(this.$fs.exists(this.projectPodFilePath).wait()) {
				// Check availability
				try {
					this.$childProcess.exec("gem which cocoapods").wait();
					this.$childProcess.exec("gem which xcodeproj").wait();
				} catch(e) {
					this.$errors.failWithoutHelp("CocoaPods or ruby gem 'xcodeproj' is not installed. Run `sudo gem install cocoapods` and try again.");
				}

				let projectPodfileContent = this.$fs.readText(this.projectPodFilePath).wait();
				this.$logger.trace("Project Podfile content");
				this.$logger.trace(projectPodfileContent);

				let firstPostInstallIndex = projectPodfileContent.indexOf(IOSProjectService.PODFILE_POST_INSTALL_SECTION_NAME);
				if(firstPostInstallIndex !== -1 && firstPostInstallIndex !== projectPodfileContent.lastIndexOf(IOSProjectService.PODFILE_POST_INSTALL_SECTION_NAME)) {
					this.$logger.warn(`Podfile contains more than one post_install sections. You need to open ${this.projectPodFilePath} file and manually resolve this issue.`);
				}

				let pbxprojFilePath = path.join(this.platformData.projectRoot, this.$projectData.projectName + IOSProjectService.XCODE_PROJECT_EXT_NAME, "xcuserdata");
				if(!this.$fs.exists(pbxprojFilePath).wait()) {
					this.$logger.info("Creating project scheme...");
					let createSchemeRubyScript = `ruby -e "require 'xcodeproj'; xcproj = Xcodeproj::Project.open('${this.$projectData.projectName}.xcodeproj'); xcproj.recreate_user_schemes; xcproj.save"`;
					this.$childProcess.exec(createSchemeRubyScript, { cwd: this.platformData.projectRoot }).wait();
				}

				this.executePodInstall().wait();
			}

			this.regeneratePluginsXcconfigFile().wait();
		}).future<void>()();
	}

	private getAllLibsForPluginWithFileExtension(pluginData: IPluginData, fileExtension: string): IFuture<string[]> {
		let filterCallback = (fileName: string, pluginPlatformsFolderPath: string) => path.extname(fileName) === fileExtension;
		return this.getAllNativeLibrariesForPlugin(pluginData, IOSProjectService.IOS_PLATFORM_NAME, filterCallback);
	};

	private buildPathToXcodeProjectFile(version: string): string {
		return path.join(this.$npmInstallationManager.getCachedPackagePath(this.platformData.frameworkPackageName, version), constants.PROJECT_FRAMEWORK_FOLDER_NAME, util.format("%s.xcodeproj", IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER), "project.pbxproj");
	}

	private validateFramework(libraryPath: string): IFuture<void> {
		return (() => {
			let infoPlistPath = path.join(libraryPath, "Info.plist");
			if (!this.$fs.exists(infoPlistPath).wait()) {
				this.$errors.failWithoutHelp("The bundle at %s does not contain an Info.plist file.", libraryPath);
			}

			let packageType = this.$childProcess.exec(`/usr/libexec/PlistBuddy -c "Print :CFBundlePackageType" "${infoPlistPath}"`).wait().trim();
			if (packageType !== "FMWK") {
				this.$errors.failWithoutHelp("The bundle at %s does not appear to be a dynamic framework.", libraryPath);
			}
		}).future<void>()();
	}

	private validateStaticLibrary(libraryPath: string): IFuture<void> {
		return (() => {
			if (path.extname(libraryPath) !== ".a") {
				this.$errors.failWithoutHelp(`The bundle at ${libraryPath} does not contain a valid static library in the '.a' file format.`);
			}

			let expectedArchs = ["armv7", "arm64", "i386"];
			let archsInTheFatFile = this.$childProcess.exec("lipo -i " + libraryPath).wait();

			expectedArchs.forEach(expectedArch => {
				if (archsInTheFatFile.indexOf(expectedArch) < 0) {
					this.$errors.failWithoutHelp(`The static library at ${libraryPath} is not built for one or more of the following required architectures: ${expectedArchs.join(", ")}. The static library must be built for all required architectures.`);
				}
			});
		}).future<void>()();
	}

	private replaceFileContent(file: string): IFuture<void> {
		return (() => {
			let fileContent = this.$fs.readText(file).wait();
			let replacedContent = helpers.stringReplaceAll(fileContent, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER, this.$projectData.projectName);
			this.$fs.writeFile(file, replacedContent).wait();
		}).future<void>()();
	}

	private replaceFileName(fileNamePart: string, fileRootLocation: string): IFuture<void> {
		return (() => {
			let oldFileName = IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER + fileNamePart;
			let newFileName = this.$projectData.projectName + fileNamePart;

			this.$fs.rename(path.join(fileRootLocation, oldFileName), path.join(fileRootLocation, newFileName)).wait();
		}).future<void>()();
	}

	private executePodInstall(): IFuture<any> {
		this.$logger.info("Installing pods...");
		let podTool = this.$config.USE_POD_SANDBOX ? "sandbox-pod" : "pod";
		return this.$childProcess.spawnFromEvent(podTool,  ["install"], "close", { cwd: this.platformData.projectRoot, stdio: 'inherit' });
	}

	private prepareFrameworks(pluginPlatformsFolderPath: string, pluginData: IPluginData): IFuture<void> {
		return (() => {
			_.each(this.getAllLibsForPluginWithFileExtension(pluginData, ".framework").wait(), fileName => this.addDynamicFramework(path.join(pluginPlatformsFolderPath, fileName)).wait());
		}).future<void>()();
	}

	private prepareStaticLibs(pluginPlatformsFolderPath: string, pluginData: IPluginData): IFuture<void> {
		return (() => {
			_.each(this.getAllLibsForPluginWithFileExtension(pluginData, ".a").wait(), fileName => this.addStaticLibrary(path.join(pluginPlatformsFolderPath, fileName)).wait());
		}).future<void>()();
	}

	private prepareCocoapods(pluginPlatformsFolderPath: string, opts?: any): IFuture<void> {
		return (() => {
			let pluginPodFilePath = path.join(pluginPlatformsFolderPath, "Podfile");

			if(this.$fs.exists(pluginPodFilePath).wait()) {
				if(!this.$fs.exists(this.projectPodFilePath).wait()) {
					this.$fs.writeFile(this.projectPodFilePath, "use_frameworks!\n").wait();
				}

				let pluginPodFileContent = this.$fs.readText(pluginPodFilePath).wait();
				let contentToWrite = this.buildPodfileContent(pluginPodFilePath, pluginPodFileContent);
				this.$fs.appendFile(this.projectPodFilePath, contentToWrite).wait();

				let project = this.createPbxProj();
				project.updateBuildProperty("IPHONEOS_DEPLOYMENT_TARGET", "8.0");
				this.$logger.info("The iOS Deployment Target is now 8.0 in order to support Cocoa Touch Frameworks in CocoaPods.");
				this.savePbxProj(project).wait();
			}

			if(opts && opts.executePodInstall && this.$fs.exists(pluginPodFilePath).wait()) {
				this.executePodInstall().wait();
			}
		}).future<void>()();
	}

	private removeFrameworks(pluginPlatformsFolderPath: string, pluginData: IPluginData): IFuture<void> {
		return (() => {
			let project = this.createPbxProj();
			_.each(this.getAllLibsForPluginWithFileExtension(pluginData, ".framework").wait(), fileName => {
				let relativeFrameworkPath = this.getLibSubpathRelativeToProjectPath(fileName);
				project.removeFramework(relativeFrameworkPath, { customFramework: true, embed: true });
			});

			this.savePbxProj(project).wait();
		}).future<void>()();
	}

	private removeStaticLibs(pluginPlatformsFolderPath: string, pluginData: IPluginData): IFuture<void> {
		return (() => {
			let project = this.createPbxProj();

			_.each(this.getAllLibsForPluginWithFileExtension(pluginData, ".a").wait(), fileName => {
				let staticLibPath = path.join(pluginPlatformsFolderPath, fileName);
				let relativeStaticLibPath = this.getLibSubpathRelativeToProjectPath(path.basename(staticLibPath));
				project.removeFramework(relativeStaticLibPath);

				let headersSubpath = path.join("include", path.basename(staticLibPath, ".a"));
				let relativeHeaderSearchPath = path.join(this.getLibSubpathRelativeToProjectPath(headersSubpath));
				project.removeFromHeaderSearchPaths({ relativePath: relativeHeaderSearchPath });
			});

			this.savePbxProj(project).wait();
		}).future<void>()();
	}

	private removeCocoapods(pluginPlatformsFolderPath: string): IFuture<void> {
		return (() => {
			let pluginPodFilePath = path.join(pluginPlatformsFolderPath, "Podfile");
			if(this.$fs.exists(pluginPodFilePath).wait() && this.$fs.exists(this.projectPodFilePath).wait()) {
				let pluginPodFileContent = this.$fs.readText(pluginPodFilePath).wait();
				let projectPodFileContent = this.$fs.readText(this.projectPodFilePath).wait();
				let contentToRemove= this.buildPodfileContent(pluginPodFilePath, pluginPodFileContent);
				projectPodFileContent = helpers.stringReplaceAll(projectPodFileContent, contentToRemove, "");
				if(projectPodFileContent.trim() === "use_frameworks!") {
					this.$fs.deleteFile(this.projectPodFilePath).wait();
				} else {
					this.$fs.writeFile(this.projectPodFilePath, projectPodFileContent).wait();
				}

			}
		}).future<void>()();
	}

	private buildPodfileContent(pluginPodFilePath: string, pluginPodFileContent: string): string {
		return `# Begin Podfile - ${pluginPodFilePath} ${os.EOL} ${pluginPodFileContent} ${os.EOL} # End Podfile ${os.EOL}`;
	}

	private generateMobulemap(headersFolderPath: string, libraryName: string): void {
		let headersFilter = (fileName: string, containingFolderPath: string) => (path.extname(fileName) === ".h" && this.$fs.getFsStats(path.join(containingFolderPath, fileName)).wait().isFile());
		let headersFolderContents = this.$fs.readDirectory(headersFolderPath).wait();
		let headers = _(headersFolderContents).filter(item => headersFilter(item, headersFolderPath)).value();

		if (!headers.length) {
			this.$fs.deleteFile(path.join(headersFolderPath, "module.modulemap")).wait();
			return;
		}

		headers = _.map(headers, value => `header "${value}"`);

		let modulemap = `module ${libraryName} { explicit module ${libraryName} { ${headers.join(" ")} } }`;
		this.$fs.writeFile(path.join(headersFolderPath, "module.modulemap"), modulemap).wait();
	}

	private mergeXcconfigFiles(pluginFile: string, projectFile: string): IFuture<void> {
		return (() => {
			if (!this.$fs.exists(projectFile).wait()) {
				this.$fs.writeFile(projectFile, "").wait();
			}

			let mergeScript = `require 'xcodeproj'; Xcodeproj::Config.new('${projectFile}').merge(Xcodeproj::Config.new('${pluginFile}')).save_as(Pathname.new('${projectFile}'))`;
			this.$childProcess.exec(`ruby -e "${mergeScript}"`).wait();
		}).future<void>()();
	}

	private regeneratePluginsXcconfigFile(): IFuture<void> {
		return (() => {
			this.$fs.deleteFile(this.pluginsDebugXcconfigFilePath).wait();
			this.$fs.deleteFile(this.pluginsReleaseXcconfigFilePath).wait();

			let allPlugins: IPluginData[] = (<IPluginsService>this.$injector.resolve("pluginsService")).getAllInstalledPlugins().wait();
			for (let plugin of allPlugins) {
				let pluginPlatformsFolderPath = plugin.pluginPlatformsFolderPath(IOSProjectService.IOS_PLATFORM_NAME);
				let pluginXcconfigFilePath = path.join(pluginPlatformsFolderPath, "build.xcconfig");
				if (this.$fs.exists(pluginXcconfigFilePath).wait()) {
					this.mergeXcconfigFiles(pluginXcconfigFilePath, this.pluginsDebugXcconfigFilePath).wait();
					this.mergeXcconfigFiles(pluginXcconfigFilePath, this.pluginsReleaseXcconfigFilePath).wait();
				}
			}

			let podFolder = path.join(this.platformData.projectRoot, "Pods/Target Support Files/Pods/");
			if (this.$fs.exists(podFolder).wait()) {
				this.mergeXcconfigFiles(path.join(this.platformData.projectRoot, "Pods/Target Support Files/Pods/Pods.debug.xcconfig"), this.pluginsDebugXcconfigFilePath).wait();
				this.mergeXcconfigFiles(path.join(this.platformData.projectRoot, "Pods/Target Support Files/Pods/Pods.release.xcconfig"), this.pluginsReleaseXcconfigFilePath).wait();
			}
		}).future<void>()();
	}
}

$injector.register("iOSProjectService", IOSProjectService);
