///<reference path="../.d.ts"/>
"use strict";

import Future = require("fibers/future");
import path = require("path");
import shell = require("shelljs");
import util = require("util");
import xcode = require("xcode");
import constants = require("./../constants");
import helpers = require("./../common/helpers");
import options = require("../common/options");

class IOSProjectService implements  IPlatformProjectService {
	private static XCODE_PROJECT_EXT_NAME = ".xcodeproj";
	private static XCODEBUILD_MIN_VERSION = "6.0";
	private static IOS_PROJECT_NAME_PLACEHOLDER = "__PROJECT_NAME__";

	constructor(private $projectData: IProjectData,
		private $fs: IFileSystem,
		private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $logger: ILogger,
		private $iOSEmulatorServices: Mobile.IEmulatorPlatformServices,
		private $npm: INodePackageManager) { }

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
			frameworkFilesExtensions: [".a", ".framework", ".bin"],
			frameworkDirectoriesExtensions: [".framework"],
			frameworkDirectoriesNames: ["Metadata"],
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

			if(options.forDevice) {
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

			if(options.forDevice) {
				var buildOutputPath = path.join(projectRoot, "build", "device");

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

    public addLibrary(platformData: IPlatformData, libraryPath: string): IFuture<void> {
        return (() => {
            this.validateDynamicFramework(libraryPath).wait();
            var umbrellaHeader = this.getUmbrellaHeaderFromDynamicFramework(libraryPath).wait();

            var frameworkName = path.basename(libraryPath, path.extname(libraryPath));
            var targetPath = path.join(this.$projectData.projectDir, "lib", platformData.normalizedPlatformName, frameworkName);
            this.$fs.ensureDirectoryExists(targetPath).wait();
            shell.cp("-R", libraryPath, targetPath);

            this.generateFrameworkMetadata(platformData.projectRoot, targetPath, frameworkName, umbrellaHeader).wait();

            var pbxProjPath = path.join(platformData.projectRoot, this.$projectData.projectName + ".xcodeproj", "project.pbxproj");
            var project = new xcode.project(pbxProjPath);
            project.parseSync();

            project.addFramework(path.join(targetPath, frameworkName + ".framework"), { customFramework: true, embed: true });
            project.updateBuildProperty("IPHONEOS_DEPLOYMENT_TARGET", "8.0");
            this.$fs.writeFile(pbxProjPath, project.writeSync()).wait();
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
			var destinationFile = path.join(options.profileDir, "xcodeproj");
			this.$fs.deleteDirectory(destinationFile).wait();
			shell.cp("-R", path.join(sourceFile, "*"), destinationFile);
			this.$logger.info("Backup file %s at location %s", sourceFile, destinationFile);
			this.$fs.deleteDirectory(path.join(this.platformData.projectRoot, util.format("%s.xcodeproj", this.$projectData.projectName))).wait();

			// Copy xcodeProject file
			var cachedPackagePath = path.join(this.$npm.getCachedPackagePath(this.platformData.frameworkPackageName, newVersion), constants.PROJECT_FRAMEWORK_FOLDER_NAME, util.format("%s.xcodeproj", IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER));
			shell.cp("-R", path.join(cachedPackagePath, "*"), path.join(this.platformData.projectRoot, util.format("%s.xcodeproj", this.$projectData.projectName)));
			this.$logger.info("Copied from %s at %s.", cachedPackagePath, this.platformData.projectRoot);


			var pbxprojFilePath = path.join(this.platformData.projectRoot, this.$projectData.projectName + IOSProjectService.XCODE_PROJECT_EXT_NAME, "project.pbxproj");
			this.replaceFileContent(pbxprojFilePath).wait();
		}).future<void>()();
	}

	private buildPathToXcodeProjectFile(version: string): string {
		return path.join(this.$npm.getCachedPackagePath(this.platformData.frameworkPackageName, version), constants.PROJECT_FRAMEWORK_FOLDER_NAME, util.format("%s.xcodeproj", IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER), "project.pbxproj");
	}

    private validateDynamicFramework(libraryPath: string): IFuture<void> {
        return (() => {
            var infoPlistPath = path.join(libraryPath, "Info.plist");
            if (!this.$fs.exists(infoPlistPath).wait()) {
                this.$errors.failWithoutHelp("The bundle at %s does not contain an Info.plist file.", libraryPath);
            }

            var packageType = this.$childProcess.exec('/usr/libexec/PlistBuddy -c "Print :CFBundlePackageType" ' + infoPlistPath).wait().trim();
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

    private generateFrameworkMetadata(projectRoot: string, frameworkDir: string, frameworkName: string, umbrellaHeader: string): IFuture<void> {
        return (() => {
            if (!this.$fs.exists("/usr/local/lib/libmonoboehm-2.0.1.dylib").wait()) {
                this.$errors.failWithoutHelp("NativeScript needs Mono 3.10 or newer installed in /usr/local");
            }

            var yamlOut = path.join(frameworkDir, "Metadata");
            this.$fs.createDirectory(yamlOut).wait();

            var tempHeader = path.join(yamlOut, "Metadata.h");
            this.$fs.writeFile(tempHeader, util.format("#import <%s/%s>", frameworkName, umbrellaHeader)).wait();

            this.$logger.info("Generating metadata for %s.framework. This can take a minute.", frameworkName);
            var sdkPath = this.$childProcess.exec("xcrun -sdk iphoneos --show-sdk-path").wait().trim();
            // MetadataGenerator P/Invokes libclang.dylib, so we need to instruct the Mach-O loader where to find it.
            // Without this Mono will fail with a DllNotFoundException.
            // Once the MetadataGenerator is rewritten in C++ and starts linking Clang statically, this will become superfluous.
            var generatorExecOptions = {
                env: {
                    DYLD_FALLBACK_LIBRARY_PATH: this.$childProcess.exec("xcode-select -p").wait().trim() + "/Toolchains/XcodeDefault.xctoolchain/usr/lib"
                }
            };
            this.$childProcess.exec(util.format('%s/Metadata/MetadataGenerator -s %s -u %s -o %s -cflags="-F%s"', projectRoot, sdkPath, tempHeader, yamlOut, frameworkDir), generatorExecOptions).wait();

			var metadataFileName = frameworkName + ".yaml";
			this.$fs.copyFile(path.join(yamlOut, "Metadata-armv7", metadataFileName), path.join(projectRoot, "Metadata", "Metadata-armv7", metadataFileName)).wait();
			this.$fs.copyFile(path.join(yamlOut, "Metadata-arm64", metadataFileName), path.join(projectRoot, "Metadata", "Metadata-arm64", metadataFileName)).wait();

            this.$fs.deleteDirectory(yamlOut).wait();
        }).future<void>()();
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
