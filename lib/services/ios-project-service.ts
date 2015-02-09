///<reference path="../.d.ts"/>
"use strict";

import Future = require("fibers/future");
import path = require("path");
import shell = require("shelljs");
import util = require("util");
import constants = require("./../constants");
import helpers = require("./../common/helpers");
import options = require("./../options");

class IOSProjectService implements  IPlatformProjectService {
	private static XCODE_PROJECT_EXT_NAME = ".xcodeproj";
	private static XCODEBUILD_MIN_VERSION = "5.0";
	private static IOS_PROJECT_NAME_PLACEHOLDER = "__PROJECT_NAME__";

	constructor(private $projectData: IProjectData,
		private $fs: IFileSystem,
		private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $iOSEmulatorServices: Mobile.IEmulatorPlatformServices) { }

	public get platformData(): IPlatformData {
		return {
			frameworkPackageName: "tns-ios",
			normalizedPlatformName: "iOS",
			platformProjectService: this,
			emulatorServices: this.$iOSEmulatorServices,
			projectRoot: path.join(this.$projectData.platformsDir, "ios"),
			deviceBuildOutputPath: path.join(this.$projectData.platformsDir, "ios", "build", "device"),
			emulatorBuildOutputPath: path.join(this.$projectData.platformsDir, "ios", "build", "emulator"),
			validPackageNamesForDevice: [
				this.$projectData.projectName + ".ipa"
			],
			validPackageNamesForEmulator: [
				this.$projectData.projectName + ".app"
			],
			frameworkFilesExtensions: [".a", ".h", ".bin"],
			targetedOS: ['darwin']
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
			if(options.symlink) {
				this.$fs.ensureDirectoryExists(path.join(projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER)).wait();
				var xcodeProjectName = util.format("%s.xcodeproj", IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER);

				shell.cp("-R", path.join(frameworkDir, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER, "*"), path.join(projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER));
				shell.cp("-R", path.join(frameworkDir, xcodeProjectName), path.join(projectRoot));

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
			this.replaceFileName("-Info.plist", path.join(projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER)).wait();
			this.replaceFileName("-Prefix.pch", path.join(projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER)).wait();
			this.replaceFileName(IOSProjectService.XCODE_PROJECT_EXT_NAME, projectRoot).wait();

			var pbxprojFilePath = path.join(projectRoot, this.$projectData.projectName + IOSProjectService.XCODE_PROJECT_EXT_NAME, "project.pbxproj");
			this.replaceFileContent(pbxprojFilePath).wait();
		}).future<void>()();
	}

	public afterCreateProject(projectRoot: string): IFuture<void> {
		return (() => {
			this.$fs.rename(path.join(projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER),
				path.join(projectRoot, this.$projectData.projectName)).wait();
		}).future<void>()();
	}

	public prepareProject(platformData: IPlatformData): IFuture<string> {
		return (() => {
			var appSourceDirectory = path.join(this.$projectData.projectDir, constants.APP_FOLDER_NAME);
			var appDestinationDirectory = path.join(platformData.projectRoot, this.$projectData.projectName);
			var resDirectory = path.join(platformData.projectRoot, this.$projectData.projectName, "Resources", "icons");
			this.$fs.ensureDirectoryExists(resDirectory).wait();

			shell.cp("-Rf", path.join(appSourceDirectory, "*"), appDestinationDirectory);

			var appResourcesDirectoryPath = path.join(appDestinationDirectory, constants.APP_RESOURCES_FOLDER_NAME);
			if (this.$fs.exists(appResourcesDirectoryPath).wait()) {
				shell.cp("-Rf", path.join(appResourcesDirectoryPath, platformData.normalizedPlatformName, "*"), resDirectory);
				this.$fs.deleteDirectory(appResourcesDirectoryPath).wait();
			}

			return appDestinationDirectory;
		}).future<string>()();
	}

	public buildProject(projectRoot: string): IFuture<void> {
		return (() => {
			var basicArgs = [
				"-project", path.join(projectRoot, this.$projectData.projectName + ".xcodeproj"),
				"-target", this.$projectData.projectName,
				"-configuration", options.release ? "Release" : "Debug",
				"build",
				'SHARED_PRECOMPS_DIR=' + path.join(projectRoot, 'build', 'sharedpch')
			];
			var args: string[] = [];

			if(options.device) {
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

			this.$childProcess.spawnFromEvent("xcodebuild", args, "exit", {cwd: options, stdio: 'inherit'}).wait();

			if(options.device) {
				var buildOutputPath = path.join(projectRoot, "build", options.device ? "device" : "emulator");

				// Produce ipa file
				var xcrunArgs = [
					"-sdk", "iphoneos",
					"PackageApplication",
					"-v", path.join(buildOutputPath, this.$projectData.projectName + ".app"),
					"-o", path.join(buildOutputPath, this.$projectData.projectName + ".ipa")
				];

				this.$childProcess.spawnFromEvent("xcrun", xcrunArgs, "exit", {cwd: options, stdio: 'inherit'}).wait();
			}
		}).future<void>()();
	}

	public isPlatformPrepared(projectRoot: string): IFuture<boolean> {
		return this.$fs.exists(path.join(projectRoot, this.$projectData.projectName, constants.APP_FOLDER_NAME));
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