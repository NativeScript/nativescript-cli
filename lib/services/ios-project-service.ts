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

export class IOSProjectService extends projectServiceBaseLib.PlatformProjectServiceBase implements  IPlatformProjectService {
	private static XCODE_PROJECT_EXT_NAME = ".xcodeproj";
	private static XCODEBUILD_MIN_VERSION = "6.0";
	private static IOS_PROJECT_NAME_PLACEHOLDER = "__PROJECT_NAME__";
	private static IOS_PLATFORM_NAME = "ios";
	private static PODFILE_POST_INSTALL_SECTION_NAME = "post_install";

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
		private $injector: IInjector,
		private $projectDataService: IProjectDataService) {
			super($fs);
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
			frameworkDirectoriesNames: ["Metadata"],
			targetedOS: ['darwin'],
			configurationFileName: "Info.plist",
			configurationFilePath: path.join(projectRoot, this.$projectData.projectName,  this.$projectData.projectName+"-Info.plist"),
			mergeXmlConfig: [{ "nodename": "plist", "attrname": "*" }, {"nodename": "dict", "attrname": "*"}]
		};
	}

	public getAppResourcesDestinationDirectoryPath(): IFuture<string> {
		return (() => {
			this.$projectDataService.initialize(this.$projectData.projectDir);
			let frameworkVersion = this.$projectDataService.getValue(this.platformData.frameworkPackageName).wait()["version"];

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

	public createProject(projectRoot: string, frameworkDir: string): IFuture<void> {
		return (() => {
			this.$fs.ensureDirectoryExists(path.join(projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER)).wait();
			if(this.$options.symlink) {
				let xcodeProjectName = util.format("%s.xcodeproj", IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER);

				shell.cp("-R", path.join(frameworkDir, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER, "*"), path.join(projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER));
				shell.cp("-R", path.join(frameworkDir, xcodeProjectName), projectRoot);

				let directoryContent = this.$fs.readDirectory(frameworkDir).wait();
				let frameworkFiles = _.difference(directoryContent, [IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER, xcodeProjectName]);
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
			let infoPlistFilePath = path.join(projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER, util.format("%s-%s", IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER, "Info.plist"));
			shell.sed('-i', "__CFBUNDLEIDENTIFIER__", this.$projectData.projectId, infoPlistFilePath);

			this.replaceFileName("-Info.plist", path.join(projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER)).wait();
			this.replaceFileName("-Prefix.pch", path.join(projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER)).wait();
			this.replaceFileName(IOSProjectService.XCODE_PROJECT_EXT_NAME, projectRoot).wait();

			let pbxprojFilePath = path.join(projectRoot, this.$projectData.projectName + IOSProjectService.XCODE_PROJECT_EXT_NAME, "project.pbxproj");
			this.replaceFileContent(pbxprojFilePath).wait();

			let mainFilePath = path.join(projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER, "main.m");
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
			this.validateFramework(libraryPath).wait();

			let targetPath = path.join("lib", this.platformData.normalizedPlatformName);
			let fullTargetPath = path.join(this.$projectData.projectDir, targetPath);
			this.$fs.ensureDirectoryExists(fullTargetPath).wait();
			shell.cp("-R", libraryPath, fullTargetPath);

			let project = this.createPbxProj();

			let frameworkName = path.basename(libraryPath, path.extname(libraryPath));
			let frameworkBinaryPath = path.join(libraryPath, frameworkName);
			let isDynamic = _.contains(this.$childProcess.exec(`otool -Vh ${frameworkBinaryPath}`).wait(), " DYLIB ");

			let frameworkAddOptions: xcode.FrameworkOptions = { customFramework: true };

			if(isDynamic) {
				frameworkAddOptions["embed"] = true;
				project.updateBuildProperty("IPHONEOS_DEPLOYMENT_TARGET", "8.0");
				this.$logger.info("The iOS Deployment Target is now 8.0 in order to support Cocoa Touch Frameworks.");
			}

			let frameworkPath = this.getFrameworkRelativePath(libraryPath);
			project.addFramework(frameworkPath, frameworkAddOptions);
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

	public updatePlatform(currentVersion: string, newVersion: string): IFuture<void> {
		return (() => {
			// Copy old file to options["profile-dir"]
			let sourceFile = path.join(this.platformData.projectRoot, util.format("%s.xcodeproj", this.$projectData.projectName));
			let destinationFile = path.join(this.$options.profileDir, "xcodeproj");
			this.$fs.deleteDirectory(destinationFile).wait();
			shell.cp("-R", path.join(sourceFile, "*"), destinationFile);
			this.$logger.info("Backup file %s at location %s", sourceFile, destinationFile);
			this.$fs.deleteDirectory(path.join(this.platformData.projectRoot, util.format("%s.xcodeproj", this.$projectData.projectName))).wait();

			// Copy xcodeProject file
			let cachedPackagePath = path.join(this.$npmInstallationManager.getCachedPackagePath(this.platformData.frameworkPackageName, newVersion), constants.PROJECT_FRAMEWORK_FOLDER_NAME, util.format("%s.xcodeproj", IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER));
			shell.cp("-R", path.join(cachedPackagePath, "*"), path.join(this.platformData.projectRoot, util.format("%s.xcodeproj", this.$projectData.projectName)));
			this.$logger.info("Copied from %s at %s.", cachedPackagePath, this.platformData.projectRoot);

			let pbxprojFilePath = path.join(this.platformData.projectRoot, this.$projectData.projectName + IOSProjectService.XCODE_PROJECT_EXT_NAME, "project.pbxproj");
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

	private replace(name: string): string {
		if(_.startsWith(name, '"')) {
			name = name.substr(1, name.length-2);
		}

		return name.replace(/\\\"/g, "\"");
	}

	private getFrameworkRelativePath(libraryPath: string): string {
		let frameworkName = path.basename(libraryPath, path.extname(libraryPath));
		let targetPath = path.join("lib", this.platformData.normalizedPlatformName);
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
			this.prepareFrameworks(pluginPlatformsFolderPath, pluginData).wait();
			this.prepareCocoapods(pluginPlatformsFolderPath).wait();
		}).future<void>()();
	}

	public removePluginNativeCode(pluginData: IPluginData): IFuture<void> {
		return (() => {
			let pluginPlatformsFolderPath = pluginData.pluginPlatformsFolderPath(IOSProjectService.IOS_PLATFORM_NAME);
			this.removeFrameworks(pluginPlatformsFolderPath, pluginData).wait();
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
				
				this.$logger.info("Installing pods...");
				this.$childProcess.exec("pod install", { cwd: this.platformData.projectRoot }).wait();
			}
		}).future<void>()();
	}

	private getAllFrameworksForPlugin(pluginData: IPluginData): IFuture<string[]> {
		let filterCallback = (fileName: string, pluginPlatformsFolderPath: string) => path.extname(fileName) === ".framework";
		return this.getAllNativeLibrariesForPlugin(pluginData, IOSProjectService.IOS_PLATFORM_NAME, filterCallback);
	}

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

	private prepareFrameworks(pluginPlatformsFolderPath: string, pluginData: IPluginData): IFuture<void> {
		return (() => {
			_.each(this.getAllFrameworksForPlugin(pluginData).wait(), fileName => this.addLibrary(path.join(pluginPlatformsFolderPath, fileName)).wait());
		}).future<void>()();
	}

	private prepareCocoapods(pluginPlatformsFolderPath: string): IFuture<void> {
		return (() => {
			if(!this.$fs.exists(this.projectPodFilePath).wait()) {
				this.$fs.writeFile(this.projectPodFilePath, "use_frameworks!\n").wait();
			}
			let pluginPodFilePath = path.join(pluginPlatformsFolderPath, "Podfile");
			if(this.$fs.exists(pluginPodFilePath).wait()) {
				let pluginPodFileContent = this.$fs.readText(pluginPodFilePath).wait();
				let contentToWrite = this.buildPodfileContent(pluginPodFilePath, pluginPodFileContent);
				this.$fs.appendFile(this.projectPodFilePath, contentToWrite).wait();
			}
		}).future<void>()();
	}

	private removeFrameworks(pluginPlatformsFolderPath: string, pluginData: IPluginData): IFuture<void> {
		return (() => {
			let project = this.createPbxProj();

			_.each(this.getAllFrameworksForPlugin(pluginData).wait(), fileName => {
				let fullFrameworkPath = path.join(pluginPlatformsFolderPath, fileName);
				let relativeFrameworkPath = this.getFrameworkRelativePath(fullFrameworkPath);
				project.removeFramework(relativeFrameworkPath, { customFramework: true, embed: true });
			});

			this.savePbxProj(project).wait();
		}).future<void>()();
	}

	private removeCocoapods(pluginPlatformsFolderPath: string): IFuture<void> {
		return (() => {
			let pluginPodFilePath = path.join(pluginPlatformsFolderPath, "Podfile");
			if(this.$fs.exists(pluginPodFilePath).wait()) {
				let pluginPodFileContent = this.$fs.readText(pluginPodFilePath).wait();
				let projectPodFileContent = this.$fs.readText(this.projectPodFilePath).wait();
				let contentToRemove= this.buildPodfileContent(pluginPodFilePath, pluginPodFileContent);
				projectPodFileContent = helpers.stringReplaceAll(projectPodFileContent, contentToRemove, "");
				if(_.isEmpty(projectPodFileContent)) {
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
}
$injector.register("iOSProjectService", IOSProjectService);
