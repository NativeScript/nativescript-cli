import * as path from "path";
import * as shell from "shelljs";
import * as os from "os";
import * as semver from "semver";
import * as constants from "../constants";
import * as helpers from "../common/helpers";
import { attachAwaitDetach } from "../common/helpers";
import * as projectServiceBaseLib from "./platform-project-service-base";
import { PlistSession } from "plist-merge-patch";
import { EOL } from "os";
import * as temp from "temp";
import * as plist from "plist";
import { IOSProvisionService } from "./ios-provision-service";
import { IOSEntitlementsService } from "./ios-entitlements-service";
import { XCConfigService } from "./xcconfig-service";
const simplePlist = require("simple-plist");

export class IOSProjectService extends projectServiceBaseLib.PlatformProjectServiceBase implements IPlatformProjectService {
	private static XCODE_PROJECT_EXT_NAME = ".xcodeproj";
	private static XCODE_SCHEME_EXT_NAME = ".xcscheme";
	private static XCODEBUILD_MIN_VERSION = "6.0";
	private static IOS_PROJECT_NAME_PLACEHOLDER = "__PROJECT_NAME__";
	private static IOS_PLATFORM_NAME = "ios";
	private static PODFILE_POST_INSTALL_SECTION_NAME = "post_install";

	private get $npmInstallationManager(): INpmInstallationManager {
		return this.$injector.resolve("npmInstallationManager");
	}

	constructor($fs: IFileSystem,
		private $childProcess: IChildProcess,
		private $cocoapodsService: ICocoaPodsService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $iOSEmulatorServices: Mobile.IEmulatorPlatformServices,
		private $injector: IInjector,
		$projectDataService: IProjectDataService,
		private $prompter: IPrompter,
		private $config: IConfiguration,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $devicesService: Mobile.IDevicesService,
		private $mobileHelper: Mobile.IMobileHelper,
		private $hostInfo: IHostInfo,
		private $pluginVariablesService: IPluginVariablesService,
		private $xcprojService: IXcprojService,
		private $iOSProvisionService: IOSProvisionService,
		private $pbxprojDomXcode: IPbxprojDomXcode,
		private $xcode: IXcode,
		private $iOSEntitlementsService: IOSEntitlementsService,
		private $sysInfo: ISysInfo,
		private $xCConfigService: XCConfigService) {
		super($fs, $projectDataService);
	}

	private _platformsDirCache: string = null;
	private _platformData: IPlatformData = null;
	public getPlatformData(projectData: IProjectData): IPlatformData {
		if (!projectData && !this._platformData) {
			throw new Error("First call of getPlatformData without providing projectData.");
		}

		if (projectData && projectData.platformsDir && this._platformsDirCache !== projectData.platformsDir) {
			let projectRoot = path.join(projectData.platformsDir, "ios");

			this._platformData = {
				frameworkPackageName: "tns-ios",
				normalizedPlatformName: "iOS",
				appDestinationDirectoryPath: path.join(projectRoot, projectData.projectName),
				platformProjectService: this,
				emulatorServices: this.$iOSEmulatorServices,
				projectRoot: projectRoot,
				deviceBuildOutputPath: path.join(projectRoot, "build", "device"),
				emulatorBuildOutputPath: path.join(projectRoot, "build", "emulator"),
				getValidPackageNames: (buildOptions: { isReleaseBuild?: boolean, isForDevice?: boolean }): string[] => {
					if (buildOptions.isForDevice) {
						return [projectData.projectName + ".ipa"];
					}

					return [projectData.projectName + ".app"];
				},
				frameworkFilesExtensions: [".a", ".framework", ".bin"],
				frameworkDirectoriesExtensions: [".framework"],
				frameworkDirectoriesNames: ["Metadata", "metadataGenerator", "NativeScript", "internal"],
				targetedOS: ['darwin'],
				configurationFileName: "Info.plist",
				configurationFilePath: path.join(projectRoot, projectData.projectName, projectData.projectName + "-Info.plist"),
				relativeToFrameworkConfigurationFilePath: path.join("__PROJECT_NAME__", "__PROJECT_NAME__-Info.plist"),
				fastLivesyncFileExtensions: [".tiff", ".tif", ".jpg", "jpeg", "gif", ".png", ".bmp", ".BMPf", ".ico", ".cur", ".xbm"] // https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIImage_Class/
			};
		}

		return this._platformData;
	}

	public async validateOptions(projectId: string, provision: true | string): Promise<boolean> {
		if (provision === true) {
			await this.$iOSProvisionService.list(projectId);
			this.$errors.failWithoutHelp("Please provide provisioning profile uuid or name with the --provision option.");
			return false;
		}

		return true;
	}

	public getAppResourcesDestinationDirectoryPath(projectData: IProjectData): string {
		let frameworkVersion = this.getFrameworkVersion(this.getPlatformData(projectData).frameworkPackageName, projectData.projectDir);

		if (semver.lt(frameworkVersion, "1.3.0")) {
			return path.join(this.getPlatformData(projectData).projectRoot, projectData.projectName, "Resources", "icons");
		}

		return path.join(this.getPlatformData(projectData).projectRoot, projectData.projectName, "Resources");
	}

	public async validate(): Promise<void> {
		if (!this.$hostInfo.isDarwin) {
			return;
		}

		try {
			await this.$childProcess.exec("which xcodebuild");
		} catch (error) {
			this.$errors.fail("Xcode is not installed. Make sure you have Xcode installed and added to your PATH");
		}

		let xcodeBuildVersion = await this.getXcodeVersion();
		if (helpers.versionCompare(xcodeBuildVersion, IOSProjectService.XCODEBUILD_MIN_VERSION) < 0) {
			this.$errors.fail("NativeScript can only run in Xcode version %s or greater", IOSProjectService.XCODEBUILD_MIN_VERSION);
		}
	}

	// TODO: Remove Promise, reason: readDirectory - unable until androidProjectService has async operations.
	public async createProject(frameworkDir: string, frameworkVersion: string, projectData: IProjectData, config: ICreateProjectOptions): Promise<void> {
		this.$fs.ensureDirectoryExists(path.join(this.getPlatformData(projectData).projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER));
		if (config.pathToTemplate) {
			// Copy everything except the template from the runtime
			this.$fs.readDirectory(frameworkDir)
				.filter(dirName => dirName.indexOf(IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER) === -1)
				.forEach(dirName => shell.cp("-R", path.join(frameworkDir, dirName), this.getPlatformData(projectData).projectRoot));
			shell.cp("-rf", path.join(config.pathToTemplate, "*"), this.getPlatformData(projectData).projectRoot);
		} else {
			shell.cp("-R", path.join(frameworkDir, "*"), this.getPlatformData(projectData).projectRoot);
		}

	}

	//TODO: plamen5kov: revisit this method, might have unnecessary/obsolete logic
	public async interpolateData(projectData: IProjectData, platformSpecificData: IPlatformSpecificData): Promise<void> {
		let projectRootFilePath = path.join(this.getPlatformData(projectData).projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER);
		// Starting with NativeScript for iOS 1.6.0, the project Info.plist file resides not in the platform project,
		// but in the hello-world app template as a platform specific resource.
		if (this.$fs.exists(path.join(projectRootFilePath, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER + "-Info.plist"))) {
			this.replaceFileName("-Info.plist", projectRootFilePath, projectData);
		}
		this.replaceFileName("-Prefix.pch", projectRootFilePath, projectData);

		let xcschemeDirPath = path.join(this.getPlatformData(projectData).projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER + IOSProjectService.XCODE_PROJECT_EXT_NAME, "xcshareddata/xcschemes");
		let xcschemeFilePath = path.join(xcschemeDirPath, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER + IOSProjectService.XCODE_SCHEME_EXT_NAME);

		if (this.$fs.exists(xcschemeFilePath)) {
			this.$logger.debug("Found shared scheme at xcschemeFilePath, renaming to match project name.");
			this.$logger.debug("Checkpoint 0");
			this.replaceFileContent(xcschemeFilePath, projectData);
			this.$logger.debug("Checkpoint 1");
			this.replaceFileName(IOSProjectService.XCODE_SCHEME_EXT_NAME, xcschemeDirPath, projectData);
			this.$logger.debug("Checkpoint 2");
		} else {
			this.$logger.debug("Copying xcscheme from template not found at " + xcschemeFilePath);
		}

		this.replaceFileName(IOSProjectService.XCODE_PROJECT_EXT_NAME, this.getPlatformData(projectData).projectRoot, projectData);

		let pbxprojFilePath = this.getPbxProjPath(projectData);
		this.replaceFileContent(pbxprojFilePath, projectData);
	}

	public interpolateConfigurationFile(projectData: IProjectData, platformSpecificData: IPlatformSpecificData): void {
		return undefined;
	}

	public afterCreateProject(projectRoot: string, projectData: IProjectData): void {
		this.$fs.rename(path.join(projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER),
			path.join(projectRoot, projectData.projectName));
	}

	/**
	 * Archive the Xcode project to .xcarchive.
	 * Returns the path to the .xcarchive.
	 */
	public async archive(projectData: IProjectData, buildConfig?: IBuildConfig, options?: { archivePath?: string }): Promise<string> {
		let projectRoot = this.getPlatformData(projectData).projectRoot;
		let archivePath = options && options.archivePath ? path.resolve(options.archivePath) : path.join(projectRoot, "/build/archive/", projectData.projectName + ".xcarchive");
		let args = ["archive", "-archivePath", archivePath, "-configuration",
			(!buildConfig || buildConfig.release) ? "Release" : "Debug"]
			.concat(this.xcbuildProjectArgs(projectRoot, projectData, "scheme"));
		await this.$childProcess.spawnFromEvent("xcodebuild", args, "exit", { stdio: 'inherit' });
		return archivePath;
	}

	/**
	 * Exports .xcarchive for AppStore distribution.
	 */
	public async exportArchive(projectData: IProjectData, options: { archivePath: string, exportDir?: string, teamID?: string }): Promise<string> {
		let projectRoot = this.getPlatformData(projectData).projectRoot;
		let archivePath = options.archivePath;
		// The xcodebuild exportPath expects directory and writes the <project-name>.ipa at that directory.
		let exportPath = path.resolve(options.exportDir || path.join(projectRoot, "/build/archive"));
		let exportFile = path.join(exportPath, projectData.projectName + ".ipa");

		// These are the options that you can set in the Xcode UI when exporting for AppStore deployment.
		let plistTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
`;
		if (options && options.teamID) {
			plistTemplate += `    <key>teamID</key>
    <string>${options.teamID}</string>
`;
		}
		plistTemplate += `    <key>method</key>
    <string>app-store</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <false/>
</dict>
</plist>`;

		// Save the options...
		temp.track();
		let exportOptionsPlist = temp.path({ prefix: "export-", suffix: ".plist" });
		this.$fs.writeFile(exportOptionsPlist, plistTemplate);

		let args = ["-exportArchive",
			"-archivePath", archivePath,
			"-exportPath", exportPath,
			"-exportOptionsPlist", exportOptionsPlist
		];
		await this.$childProcess.spawnFromEvent("xcodebuild", args, "exit", { stdio: 'inherit' });

		return exportFile;
	}

	/**
	 * Exports .xcarchive for a development device.
	 */
	private async exportDevelopmentArchive(projectData: IProjectData, buildConfig: IBuildConfig, options: { archivePath: string, exportDir?: string, teamID?: string }): Promise<string> {
		let platformData = this.getPlatformData(projectData);
		let projectRoot = platformData.projectRoot;
		let archivePath = options.archivePath;
		let buildOutputPath = path.join(projectRoot, "build", "device");

		// The xcodebuild exportPath expects directory and writes the <project-name>.ipa at that directory.
		let exportPath = path.resolve(options.exportDir || buildOutputPath);
		let exportFile = path.join(exportPath, projectData.projectName + ".ipa");

		let args = ["-exportArchive",
			"-archivePath", archivePath,
			"-exportPath", exportPath,
			"-exportOptionsPlist", platformData.configurationFilePath
		];
		await this.$childProcess.spawnFromEvent("xcodebuild", args, "exit",
			{ stdio: buildConfig.buildOutputStdio || 'inherit', cwd: this.getPlatformData(projectData).projectRoot },
			{ emitOptions: { eventName: constants.BUILD_OUTPUT_EVENT_NAME }, throwError: true });

		return exportFile;
	}

	private xcbuildProjectArgs(projectRoot: string, projectData: IProjectData, product?: "scheme" | "target"): string[] {
		let xcworkspacePath = path.join(projectRoot, projectData.projectName + ".xcworkspace");
		if (this.$fs.exists(xcworkspacePath)) {
			return ["-workspace", xcworkspacePath, product ? "-" + product : "-scheme", projectData.projectName];
		} else {
			let xcodeprojPath = path.join(projectRoot, projectData.projectName + ".xcodeproj");
			return ["-project", xcodeprojPath, product ? "-" + product : "-target", projectData.projectName];
		}
	}

	public async buildProject(projectRoot: string, projectData: IProjectData, buildConfig: IBuildConfig): Promise<void> {
		let basicArgs = [
			"-configuration", buildConfig.release ? "Release" : "Debug",
			"build",
			'SHARED_PRECOMPS_DIR=' + path.join(projectRoot, 'build', 'sharedpch')
		];
		basicArgs = basicArgs.concat(this.xcbuildProjectArgs(projectRoot, projectData));

		// Starting from tns-ios 1.4 the xcconfig file is referenced in the project template
		let frameworkVersion = this.getFrameworkVersion(this.getPlatformData(projectData).frameworkPackageName, projectData.projectDir);
		if (semver.lt(frameworkVersion, "1.4.0")) {
			basicArgs.push("-xcconfig", path.join(projectRoot, projectData.projectName, "build.xcconfig"));
		}

		// if (this.$logger.getLevel() === "INFO") {
		// 	let xcodeBuildVersion = this.getXcodeVersion();
		// 	if (helpers.versionCompare(xcodeBuildVersion, "8.0") >= 0) {
		// 		basicArgs.push("-quiet");
		// 	}
		// }

		const handler = (data: any) => {
			this.emit(constants.BUILD_OUTPUT_EVENT_NAME, data);
		};

		if (buildConfig.buildForDevice) {
			await attachAwaitDetach(constants.BUILD_OUTPUT_EVENT_NAME,
				this.$childProcess,
				handler,
				this.buildForDevice(projectRoot, basicArgs, buildConfig, projectData));
		} else {
			await attachAwaitDetach(constants.BUILD_OUTPUT_EVENT_NAME,
				this.$childProcess,
				handler,
				this.buildForSimulator(projectRoot, basicArgs, projectData, buildConfig.buildOutputStdio));
		}
	}

	public async validatePlugins(projectData: IProjectData): Promise<void> {
		let installedPlugins = await (<IPluginsService>this.$injector.resolve("pluginsService")).getAllInstalledPlugins(projectData);
		for (let pluginData of installedPlugins) {
			let pluginsFolderExists = this.$fs.exists(path.join(pluginData.pluginPlatformsFolderPath(this.$devicePlatformsConstants.iOS.toLowerCase()), "Podfile"));
			let cocoaPodVersion = await this.$sysInfo.getCocoapodVersion();
			if (pluginsFolderExists && !cocoaPodVersion) {
				this.$errors.failWithoutHelp(`${pluginData.name} has Podfile and you don't have Cocoapods installed or it is not configured correctly. Please verify Cocoapods can work on your machine.`);
			}
		}
		Promise.resolve();
	}

	private async buildForDevice(projectRoot: string, args: string[], buildConfig: IBuildConfig, projectData: IProjectData): Promise<void> {
		let defaultArchitectures = [
			'ARCHS=armv7 arm64',
			'VALID_ARCHS=armv7 arm64'
		];

		// build only for device specific architecture
		if (!buildConfig.release && !buildConfig.architectures) {
			await this.$devicesService.initialize({
				platform: this.$devicePlatformsConstants.iOS.toLowerCase(), deviceId: buildConfig.device,
				isBuildForDevice: true
			});
			let instances = this.$devicesService.getDeviceInstances();
			let devicesArchitectures = _(instances)
				.filter(d => this.$mobileHelper.isiOSPlatform(d.deviceInfo.platform) && d.deviceInfo.activeArchitecture)
				.map(d => d.deviceInfo.activeArchitecture)
				.uniq()
				.value();
			if (devicesArchitectures.length > 0) {
				let architectures = [
					`ARCHS=${devicesArchitectures.join(" ")}`,
					`VALID_ARCHS=${devicesArchitectures.join(" ")}`
				];
				if (devicesArchitectures.length > 1) {
					architectures.push('ONLY_ACTIVE_ARCH=NO');
				}
				buildConfig.architectures = architectures;
			}
		}

		args = args.concat((buildConfig && buildConfig.architectures) || defaultArchitectures);

		args = args.concat([
			"-sdk", "iphoneos",
			"CONFIGURATION_BUILD_DIR=" + path.join(projectRoot, "build", "device")
		]);

		let xcodeBuildVersion = await this.getXcodeVersion();
		if (helpers.versionCompare(xcodeBuildVersion, "8.0") >= 0) {
			await this.setupSigningForDevice(projectRoot, buildConfig, projectData);
		}

		if (buildConfig && buildConfig.codeSignIdentity) {
			args.push(`CODE_SIGN_IDENTITY=${buildConfig.codeSignIdentity}`);
		}

		if (buildConfig && buildConfig.mobileProvisionIdentifier) {
			args.push(`PROVISIONING_PROFILE=${buildConfig.mobileProvisionIdentifier}`);
		}

		if (buildConfig && buildConfig.teamIdentifier) {
			args.push(`DEVELOPMENT_TEAM=${buildConfig.teamIdentifier}`);
		}

		// this.$logger.out("xcodebuild...");
		await this.$childProcess.spawnFromEvent("xcodebuild",
			args,
			"exit",
			{ stdio: buildConfig.buildOutputStdio || "inherit", cwd: this.getPlatformData(projectData).projectRoot },
			{ emitOptions: { eventName: constants.BUILD_OUTPUT_EVENT_NAME }, throwError: true });
		// this.$logger.out("xcodebuild build succeded.");

		await this.createIpa(projectRoot, projectData, buildConfig);
	}

	private async setupSigningFromProvision(projectRoot: string, projectData: IProjectData, provision?: string): Promise<void> {
		if (provision) {
			const xcode = this.$pbxprojDomXcode.Xcode.open(this.getPbxProjPath(projectData));
			const signing = xcode.getSigning(projectData.projectName);

			let shouldUpdateXcode = false;
			if (signing && signing.style === "Manual") {
				for (let config in signing.configurations) {
					let options = signing.configurations[config];
					if (options.name !== provision && options.uuid !== provision) {
						shouldUpdateXcode = true;
						break;
					}
				}
			} else {
				shouldUpdateXcode = true;
			}

			if (shouldUpdateXcode) {
				const pickStart = Date.now();
				const mobileprovision = await this.$iOSProvisionService.pick(provision, projectData.projectId);
				const pickEnd = Date.now();
				this.$logger.trace("Searched and " + (mobileprovision ? "found" : "failed to find ") + " matching provisioning profile. (" + (pickEnd - pickStart) + "ms.)");
				if (!mobileprovision) {
					this.$errors.failWithoutHelp("Failed to find mobile provision with UUID or Name: " + provision);
				}

				xcode.setManualSigningStyle(projectData.projectName, {
					team: mobileprovision.TeamIdentifier && mobileprovision.TeamIdentifier.length > 0 ? mobileprovision.TeamIdentifier[0] : undefined,
					uuid: mobileprovision.UUID,
					name: mobileprovision.Name,
					identity: mobileprovision.Type === "Development" ? "iPhone Developer" : "iPhone Distribution"
				});
				xcode.save();

				// this.cache(uuid);
				this.$logger.trace("Set Manual signing style and provisioning profile.");
			} else {
				this.$logger.trace("The specified provisioning profile allready set in the Xcode.");
			}
		} else {
			// read uuid from Xcode and cache...
		}
	}

	private async setupSigningForDevice(projectRoot: string, buildConfig: IiOSBuildConfig, projectData: IProjectData): Promise<void> {
		const xcode = this.$pbxprojDomXcode.Xcode.open(this.getPbxProjPath(projectData));
		const signing = xcode.getSigning(projectData.projectName);

		const hasProvisioningProfileInXCConfig =
			this.readXCConfigProvisioningProfileSpecifierForIPhoneOs(projectData) ||
			this.readXCConfigProvisioningProfileSpecifier(projectData) ||
			this.readXCConfigProvisioningProfileForIPhoneOs(projectData) ||
			this.readXCConfigProvisioningProfile(projectData);

		if (hasProvisioningProfileInXCConfig && (!signing || signing.style !== "Manual")) {
			xcode.setManualSigningStyle(projectData.projectName);
			xcode.save();
		} else if (!buildConfig.provision && !(signing && signing.style === "Manual" && !buildConfig.teamId)) {
			if (buildConfig) {
				delete buildConfig.teamIdentifier;
			}

			const teamId = await this.getDevelopmentTeam(projectData, buildConfig.teamId);

			xcode.setAutomaticSigningStyle(projectData.projectName, teamId);
			xcode.save();
			this.$logger.trace("Set Automatic signing style and team.");
		}
	}

	private async buildForSimulator(projectRoot: string, args: string[], projectData: IProjectData, buildOutputStdio?: string): Promise<void> {
		args = args.concat([
			"-sdk", "iphonesimulator",
			"ARCHS=i386 x86_64",
			"VALID_ARCHS=i386 x86_64",
			"ONLY_ACTIVE_ARCH=NO",
			"CONFIGURATION_BUILD_DIR=" + path.join(projectRoot, "build", "emulator"),
			"CODE_SIGN_IDENTITY="
		]);

		await this.$childProcess.spawnFromEvent("xcodebuild", args, "exit",
			{ stdio: buildOutputStdio || "inherit", cwd: this.getPlatformData(projectData).projectRoot },
			{ emitOptions: { eventName: constants.BUILD_OUTPUT_EVENT_NAME }, throwError: true });
	}

	private async createIpa(projectRoot: string, projectData: IProjectData, buildConfig: IBuildConfig): Promise<string> {
		let xarchivePath = await this.archive(projectData, buildConfig);
		let exportFileIpa = await this.exportDevelopmentArchive(projectData,
			buildConfig,
			{
				archivePath: xarchivePath,
			});

		return exportFileIpa;
	}

	public isPlatformPrepared(projectRoot: string, projectData: IProjectData): boolean {
		return this.$fs.exists(path.join(projectRoot, projectData.projectName, constants.APP_FOLDER_NAME));
	}

	public cleanDeviceTempFolder(deviceIdentifier: string): Promise<void> {
		return Promise.resolve();
	}

	private async addFramework(frameworkPath: string, projectData: IProjectData): Promise<void> {
		this.validateFramework(frameworkPath);

		let project = this.createPbxProj(projectData);
		let frameworkName = path.basename(frameworkPath, path.extname(frameworkPath));
		let frameworkBinaryPath = path.join(frameworkPath, frameworkName);
		const pathToFileCommand = this.$hostInfo.isWindows ? path.join(__dirname, "..", "..", "vendor", "file", "file.exe") : "file";
		let isDynamic = _.includes((await this.$childProcess.spawnFromEvent(pathToFileCommand, [frameworkBinaryPath], "close")).stdout, "dynamically linked");

		let frameworkAddOptions: IXcode.Options = { customFramework: true };

		if (isDynamic) {
			frameworkAddOptions["embed"] = true;
		}

		let frameworkRelativePath = '$(SRCROOT)/' + this.getLibSubpathRelativeToProjectPath(frameworkPath, projectData);
		project.addFramework(frameworkRelativePath, frameworkAddOptions);
		this.savePbxProj(project, projectData);

	}

	private async addStaticLibrary(staticLibPath: string, projectData: IProjectData): Promise<void> {
		await this.validateStaticLibrary(staticLibPath);
		// Copy files to lib folder.
		let libraryName = path.basename(staticLibPath, ".a");
		let headersSubpath = path.join(path.dirname(staticLibPath), "include", libraryName);

		// Add static library to project file and setup header search paths
		let project = this.createPbxProj(projectData);
		let relativeStaticLibPath = this.getLibSubpathRelativeToProjectPath(staticLibPath, projectData);
		project.addFramework(relativeStaticLibPath);

		let relativeHeaderSearchPath = path.join(this.getLibSubpathRelativeToProjectPath(headersSubpath, projectData));
		project.addToHeaderSearchPaths({ relativePath: relativeHeaderSearchPath });

		this.generateModulemap(headersSubpath, libraryName);
		this.savePbxProj(project, projectData);
	}

	public canUpdatePlatform(installedModuleDir: string, projectData: IProjectData): boolean {
		let currentXcodeProjectFile = this.buildPathToCurrentXcodeProjectFile(projectData);
		let currentXcodeProjectFileContent = this.$fs.readFile(currentXcodeProjectFile);

		let newXcodeProjectFile = this.buildPathToNewXcodeProjectFile(installedModuleDir);
		this.replaceFileContent(newXcodeProjectFile, projectData);
		let newXcodeProjectFileContent = this.$fs.readFile(newXcodeProjectFile);

		let contentIsTheSame = currentXcodeProjectFileContent.toString() === newXcodeProjectFileContent.toString();

		if (!contentIsTheSame) {
			this.$logger.warn(`The content of the current project file: ${currentXcodeProjectFile} and the new project file: ${newXcodeProjectFile} is different.`);
		}

		return contentIsTheSame;
	}

	/**
	 * Patch **LaunchScreen.xib** so we can be backward compatible for eternity.
	 * The **xcodeproj** template proior v**2.1.0** had blank white screen launch screen.
	 * We extended that by adding **app/AppResources/iOS/LaunchScreen.storyboard**
	 * However for projects created prior **2.1.0** to keep working without the obsolete **LaunchScreen.xib**
	 * we must still provide it on prepare.
	 * Here we check if **UILaunchStoryboardName** is set to **LaunchScreen** in the **platform/ios/<proj>/<proj>-Info.plist**.
	 * If it is, and no **LaunchScreen.storyboard** nor **.xib** is found in the project, we will create one.
	 */
	private provideLaunchScreenIfMissing(projectData: IProjectData): void {
		try {
			this.$logger.trace("Checking if we need to provide compatability LaunchScreen.xib");
			let platformData = this.getPlatformData(projectData);
			let projectPath = path.join(platformData.projectRoot, projectData.projectName);
			let projectPlist = this.getInfoPlistPath(projectData);
			let plistContent = plist.parse(this.$fs.readText(projectPlist));
			let storyName = plistContent["UILaunchStoryboardName"];
			this.$logger.trace(`Examining ${projectPlist} UILaunchStoryboardName: "${storyName}".`);
			if (storyName !== "LaunchScreen") {
				this.$logger.trace("The project has its UILaunchStoryboardName set to " + storyName + " which is not the pre v2.1.0 default LaunchScreen, probably the project is migrated so we are good to go.");
				return;
			}

			let expectedStoryPath = path.join(projectPath, "Resources", "LaunchScreen.storyboard");
			if (this.$fs.exists(expectedStoryPath)) {
				// Found a LaunchScreen on expected path
				this.$logger.trace("LaunchScreen.storyboard was found. Project is up to date.");
				return;
			}
			this.$logger.trace("LaunchScreen file not found at: " + expectedStoryPath);

			let expectedXibPath = path.join(projectPath, "en.lproj", "LaunchScreen.xib");
			if (this.$fs.exists(expectedXibPath)) {
				this.$logger.trace("Obsolete LaunchScreen.xib was found. It'k OK, we are probably running with iOS runtime from pre v2.1.0.");
				return;
			}
			this.$logger.trace("LaunchScreen file not found at: " + expectedXibPath);

			let isTheLaunchScreenFile = (fileName: string) => fileName === "LaunchScreen.xib" || fileName === "LaunchScreen.storyboard";
			let matches = this.$fs.enumerateFilesInDirectorySync(projectPath, isTheLaunchScreenFile, { enumerateDirectories: false });
			if (matches.length > 0) {
				this.$logger.trace("Found LaunchScreen by slowly traversing all files here: " + matches + "\nConsider moving the LaunchScreen so it could be found at: " + expectedStoryPath);
				return;
			}

			let compatabilityXibPath = path.join(projectPath, "Resources", "LaunchScreen.xib");
			this.$logger.warn(`Failed to find LaunchScreen.storyboard but it was specified in the Info.plist.
Consider updating the resources in app/App_Resources/iOS/.
A good starting point would be to create a new project and diff the changes with your current one.
Also the following repo may be helpful: https://github.com/NativeScript/template-hello-world/tree/master/App_Resources/iOS
We will now place an empty obsolete compatability white screen LauncScreen.xib for you in ${path.relative(projectData.projectDir, compatabilityXibPath)} so your app may appear as it did in pre v2.1.0 versions of the ios runtime.`);

			let content = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.XIB" version="3.0" toolsVersion="6751" systemVersion="14A389" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES">
    <dependencies>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="6736"/>
    </dependencies>
    <objects>
        <placeholder placeholderIdentifier="IBFilesOwner" id="-1" userLabel="File's Owner"/>
        <placeholder placeholderIdentifier="IBFirstResponder" id="-2" customClass="UIResponder"/>
        <view contentMode="scaleToFill" id="iN0-l3-epB">
            <rect key="frame" x="0.0" y="0.0" width="480" height="480"/>
            <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
            <color key="backgroundColor" white="1" alpha="1" colorSpace="custom" customColorSpace="calibratedWhite"/>
            <nil key="simulatedStatusBarMetrics"/>
            <freeformSimulatedSizeMetrics key="simulatedDestinationMetrics"/>
            <point key="canvasLocation" x="548" y="455"/>
        </view>
    </objects>
</document>`;
			try {
				this.$fs.createDirectory(path.dirname(compatabilityXibPath));
				this.$fs.writeFile(compatabilityXibPath, content);
			} catch (e) {
				this.$logger.warn("We have failed to add compatability LaunchScreen.xib due to: " + e);
			}
		} catch (e) {
			this.$logger.warn("We have failed to check if we need to add a compatability LaunchScreen.xib due to: " + e);
		}
	}

	public async prepareProject(projectData: IProjectData, platformSpecificData: IPlatformSpecificData): Promise<void> {
		let provision = platformSpecificData && platformSpecificData.provision;

		if (provision) {
			let projectRoot = path.join(projectData.platformsDir, "ios");
			await this.setupSigningFromProvision(projectRoot, projectData, provision);
		}

		let project = this.createPbxProj(projectData);

		this.provideLaunchScreenIfMissing(projectData);

		let resources = project.pbxGroupByName("Resources");

		if (resources) {
			let references = project.pbxFileReferenceSection();

			let xcodeProjectImages = _.map(<any[]>resources.children, resource => this.replace(references[resource.value].name));
			this.$logger.trace("Images from Xcode project");
			this.$logger.trace(xcodeProjectImages);

			let appResourcesImages = this.$fs.readDirectory(this.getAppResourcesDestinationDirectoryPath(projectData));
			this.$logger.trace("Current images from App_Resources");
			this.$logger.trace(appResourcesImages);

			let imagesToAdd = _.difference(appResourcesImages, xcodeProjectImages);
			this.$logger.trace(`New images to add into xcode project: ${imagesToAdd.join(", ")}`);
			_.each(imagesToAdd, image => project.addResourceFile(path.relative(this.getPlatformData(projectData).projectRoot, path.join(this.getAppResourcesDestinationDirectoryPath(projectData), image))));

			let imagesToRemove = _.difference(xcodeProjectImages, appResourcesImages);
			this.$logger.trace(`Images to remove from xcode project: ${imagesToRemove.join(", ")}`);
			_.each(imagesToRemove, image => project.removeResourceFile(path.join(this.getAppResourcesDestinationDirectoryPath(projectData), image)));

			this.savePbxProj(project, projectData);
		}
	}

	public prepareAppResources(appResourcesDirectoryPath: string, projectData: IProjectData): void {
		let platformFolder = path.join(appResourcesDirectoryPath, this.getPlatformData(projectData).normalizedPlatformName);
		let filterFile = (filename: string) => this.$fs.deleteFile(path.join(platformFolder, filename));

		filterFile(this.getPlatformData(projectData).configurationFileName);

		this.$fs.deleteDirectory(this.getAppResourcesDestinationDirectoryPath(projectData));
	}

	public async processConfigurationFilesFromAppResources(release: boolean, projectData: IProjectData): Promise<void> {
		await this.mergeInfoPlists({ release }, projectData);
		await this.$iOSEntitlementsService.merge(projectData);
		await this.mergeProjectXcconfigFiles(release, projectData);
		for (let pluginData of await this.getAllInstalledPlugins(projectData)) {
			await this.$pluginVariablesService.interpolatePluginVariables(pluginData, this.getPlatformData(projectData).configurationFilePath, projectData);
		}

		this.$pluginVariablesService.interpolateAppIdentifier(this.getPlatformData(projectData).configurationFilePath, projectData);
	}

	private getInfoPlistPath(projectData: IProjectData): string {
		return path.join(
			projectData.projectDir,
			constants.APP_FOLDER_NAME,
			constants.APP_RESOURCES_FOLDER_NAME,
			this.getPlatformData(projectData).normalizedPlatformName,
			this.getPlatformData(projectData).configurationFileName
		);
	}

	public ensureConfigurationFileInAppResources(): void {
		return null;
	}

	public async stopServices(): Promise<ISpawnResult> {
		return { stderr: "", stdout: "", exitCode: 0 };
	}

	public async cleanProject(projectRoot: string): Promise<void> {
		return Promise.resolve();
	}

	private async mergeInfoPlists(buildOptions: IRelease, projectData: IProjectData): Promise<void> {
		let projectDir = projectData.projectDir;
		let infoPlistPath = path.join(projectDir, constants.APP_FOLDER_NAME, constants.APP_RESOURCES_FOLDER_NAME, this.getPlatformData(projectData).normalizedPlatformName, this.getPlatformData(projectData).configurationFileName);
		this.ensureConfigurationFileInAppResources();

		if (!this.$fs.exists(infoPlistPath)) {
			this.$logger.trace("Info.plist: No app/App_Resources/iOS/Info.plist found, falling back to pre-1.6.0 Info.plist behavior.");
			return;
		}

		let session = new PlistSession({ log: (txt: string) => this.$logger.trace("Info.plist: " + txt) });
		let makePatch = (plistPath: string) => {
			if (!this.$fs.exists(plistPath)) {
				this.$logger.trace("No plist found at: " + plistPath);
				return;
			}

			this.$logger.trace("Schedule merge plist at: " + plistPath);
			session.patch({
				name: path.relative(projectDir, plistPath),
				read: () => this.$fs.readText(plistPath)
			});
		};

		let allPlugins = await this.getAllInstalledPlugins(projectData);
		for (let plugin of allPlugins) {
			let pluginInfoPlistPath = path.join(plugin.pluginPlatformsFolderPath(IOSProjectService.IOS_PLATFORM_NAME), this.getPlatformData(projectData).configurationFileName);
			makePatch(pluginInfoPlistPath);
		}

		makePatch(infoPlistPath);

		if (projectData.projectId) {
			session.patch({
				name: "CFBundleIdentifier from package.json nativescript.id",
				read: () =>
					`<?xml version="1.0" encoding="UTF-8"?>
						<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
						<plist version="1.0">
						<dict>
							<key>CFBundleIdentifier</key>
							<string>${projectData.projectId}</string>
						</dict>
						</plist>`
			});
		}

		if (!buildOptions.release && projectData.projectId) {
			session.patch({
				name: "CFBundleURLTypes from package.json nativescript.id",
				read: () =>
					`<?xml version="1.0" encoding="UTF-8"?>
						<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
						<plist version="1.0">
						<dict>
							<key>CFBundleURLTypes</key>
							<array>
								<dict>
									<key>CFBundleURLSchemes</key>
									<array>
										<string>${projectData.projectId.replace(/[^A-Za-z0-9]/g, "")}</string>
									</array>
								</dict>
							</array>
						</dict>
						</plist>`
			});
		}

		let plistContent = session.build();

		this.$logger.trace("Info.plist: Write to: " + this.getPlatformData(projectData).configurationFilePath);
		this.$fs.writeFile(this.getPlatformData(projectData).configurationFilePath, plistContent);
	}

	private getAllInstalledPlugins(projectData: IProjectData): Promise<IPluginData[]> {
		return (<IPluginsService>this.$injector.resolve("pluginsService")).getAllInstalledPlugins(projectData);
	}

	private getXcodeprojPath(projectData: IProjectData): string {
		return path.join(this.getPlatformData(projectData).projectRoot, projectData.projectName + IOSProjectService.XCODE_PROJECT_EXT_NAME);
	}

	private getProjectPodFilePath(projectData: IProjectData): string {
		return path.join(this.getPlatformData(projectData).projectRoot, "Podfile");
	}

	private getPluginsDebugXcconfigFilePath(projectData: IProjectData): string {
		return path.join(this.getPlatformData(projectData).projectRoot, "plugins-debug.xcconfig");
	}

	private getPluginsReleaseXcconfigFilePath(projectData: IProjectData): string {
		return path.join(this.getPlatformData(projectData).projectRoot, "plugins-release.xcconfig");
	}

	private replace(name: string): string {
		if (_.startsWith(name, '"')) {
			name = name.substr(1, name.length - 2);
		}

		return name.replace(/\\\"/g, "\"");
	}

	private getLibSubpathRelativeToProjectPath(targetPath: string, projectData: IProjectData): string {
		let frameworkPath = path.relative(this.getPlatformData(projectData).projectRoot, targetPath);
		return frameworkPath;
	}

	private getPbxProjPath(projectData: IProjectData): string {
		return path.join(this.getXcodeprojPath(projectData), "project.pbxproj");
	}

	private createPbxProj(projectData: IProjectData): any {
		let project = new this.$xcode.project(this.getPbxProjPath(projectData));
		project.parseSync();

		return project;
	}

	private savePbxProj(project: any, projectData: IProjectData): void {
		return this.$fs.writeFile(this.getPbxProjPath(projectData), project.writeSync());
	}

	public async preparePluginNativeCode(pluginData: IPluginData, projectData: IProjectData, opts?: any): Promise<void> {
		let pluginPlatformsFolderPath = pluginData.pluginPlatformsFolderPath(IOSProjectService.IOS_PLATFORM_NAME);

		await this.prepareFrameworks(pluginPlatformsFolderPath, pluginData, projectData);
		await this.prepareStaticLibs(pluginPlatformsFolderPath, pluginData, projectData);
		await this.prepareCocoapods(pluginPlatformsFolderPath, projectData);
	}

	public async removePluginNativeCode(pluginData: IPluginData, projectData: IProjectData): Promise<void> {
		let pluginPlatformsFolderPath = pluginData.pluginPlatformsFolderPath(IOSProjectService.IOS_PLATFORM_NAME);

		this.removeFrameworks(pluginPlatformsFolderPath, pluginData, projectData);
		this.removeStaticLibs(pluginPlatformsFolderPath, pluginData, projectData);
		this.removeCocoapods(pluginPlatformsFolderPath, projectData);
	}

	public async afterPrepareAllPlugins(projectData: IProjectData): Promise<void> {
		if (this.$fs.exists(this.getProjectPodFilePath(projectData))) {
			let projectPodfileContent = this.$fs.readText(this.getProjectPodFilePath(projectData));
			this.$logger.trace("Project Podfile content");
			this.$logger.trace(projectPodfileContent);

			let firstPostInstallIndex = projectPodfileContent.indexOf(IOSProjectService.PODFILE_POST_INSTALL_SECTION_NAME);
			if (firstPostInstallIndex !== -1 && firstPostInstallIndex !== projectPodfileContent.lastIndexOf(IOSProjectService.PODFILE_POST_INSTALL_SECTION_NAME)) {
				this.$cocoapodsService.mergePodfileHookContent(IOSProjectService.PODFILE_POST_INSTALL_SECTION_NAME, this.getProjectPodFilePath(projectData));
			}

			let xcuserDataPath = path.join(this.getXcodeprojPath(projectData), "xcuserdata");
			let sharedDataPath = path.join(this.getXcodeprojPath(projectData), "xcshareddata");

			if (!this.$fs.exists(xcuserDataPath) && !this.$fs.exists(sharedDataPath)) {
				this.$logger.info("Creating project scheme...");

				await this.checkIfXcodeprojIsRequired();

				let createSchemeRubyScript = `ruby -e "require 'xcodeproj'; xcproj = Xcodeproj::Project.open('${projectData.projectName}.xcodeproj'); xcproj.recreate_user_schemes; xcproj.save"`;
				await this.$childProcess.exec(createSchemeRubyScript, { cwd: this.getPlatformData(projectData).projectRoot });
			}

			await this.executePodInstall(projectData);
		}
	}

	public beforePrepareAllPlugins(): Promise<void> {
		return Promise.resolve();
	}

	public checkForChanges(changesInfo: IProjectChangesInfo, options: IProjectChangesOptions, projectData: IProjectData): void {
		const provision = options.provision;
		if (provision !== undefined) {
			// Check if the native project's signing is set to the provided provision...
			const pbxprojPath = this.getPbxProjPath(projectData);

			if (this.$fs.exists(pbxprojPath)) {
				const xcode = this.$pbxprojDomXcode.Xcode.open(pbxprojPath);
				const signing = xcode.getSigning(projectData.projectName);
				if (signing && signing.style === "Manual") {
					for (let name in signing.configurations) {
						let config = signing.configurations[name];
						if (config.uuid !== provision && config.name !== provision) {
							changesInfo.signingChanged = true;
							break;
						}
					}
				} else {
					// Specifying provisioning profile requires "Manual" signing style.
					// If the current signing style was not "Manual" it was probably "Automatic" or,
					// it was not uniform for the debug and release build configurations.
					changesInfo.signingChanged = true;
				}
			} else {
				changesInfo.signingChanged = true;
			}
		}
	}

	private getAllLibsForPluginWithFileExtension(pluginData: IPluginData, fileExtension: string): string[] {
		let filterCallback = (fileName: string, pluginPlatformsFolderPath: string) => path.extname(fileName) === fileExtension;
		return this.getAllNativeLibrariesForPlugin(pluginData, IOSProjectService.IOS_PLATFORM_NAME, filterCallback);
	};

	private buildPathToCurrentXcodeProjectFile(projectData: IProjectData): string {
		return path.join(projectData.platformsDir, "ios", `${projectData.projectName}.xcodeproj`, "project.pbxproj");
	}

	private buildPathToNewXcodeProjectFile(newModulesDir: string): string {
		return path.join(newModulesDir, constants.PROJECT_FRAMEWORK_FOLDER_NAME, `${IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER}.xcodeproj`, "project.pbxproj");
	}

	private validateFramework(libraryPath: string): void {
		const infoPlistPath = path.join(libraryPath, "Info.plist");
		if (!this.$fs.exists(infoPlistPath)) {
			this.$errors.failWithoutHelp("The bundle at %s does not contain an Info.plist file.", libraryPath);
		}

		const plistJson = simplePlist.readFileSync(infoPlistPath);
		const packageType = plistJson["CFBundlePackageType"];

		if (packageType !== "FMWK") {
			this.$errors.failWithoutHelp("The bundle at %s does not appear to be a dynamic framework.", libraryPath);
		}
	}

	private async validateStaticLibrary(libraryPath: string): Promise<void> {
		if (path.extname(libraryPath) !== ".a") {
			this.$errors.failWithoutHelp(`The bundle at ${libraryPath} does not contain a valid static library in the '.a' file format.`);
		}

		let expectedArchs = ["armv7", "arm64", "i386"];
		let archsInTheFatFile = await this.$childProcess.exec("lipo -i " + libraryPath);

		expectedArchs.forEach(expectedArch => {
			if (archsInTheFatFile.indexOf(expectedArch) < 0) {
				this.$errors.failWithoutHelp(`The static library at ${libraryPath} is not built for one or more of the following required architectures: ${expectedArchs.join(", ")}. The static library must be built for all required architectures.`);
			}
		});
	}

	private replaceFileContent(file: string, projectData: IProjectData): void {
		let fileContent = this.$fs.readText(file);
		let replacedContent = helpers.stringReplaceAll(fileContent, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER, projectData.projectName);
		this.$fs.writeFile(file, replacedContent);
	}

	private replaceFileName(fileNamePart: string, fileRootLocation: string, projectData: IProjectData): void {
		let oldFileName = IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER + fileNamePart;
		let newFileName = projectData.projectName + fileNamePart;

		this.$fs.rename(path.join(fileRootLocation, oldFileName), path.join(fileRootLocation, newFileName));
	}

	private async executePodInstall(projectData: IProjectData): Promise<any> {
		// Check availability
		try {
			await this.$childProcess.exec("gem which cocoapods");
			await this.$childProcess.exec("gem which xcodeproj");
		} catch (e) {
			this.$errors.failWithoutHelp("CocoaPods or ruby gem 'xcodeproj' is not installed. Run `sudo gem install cocoapods` and try again.");
		}

		await this.$xcprojService.verifyXcproj(true);

		this.$logger.info("Installing pods...");
		let podTool = this.$config.USE_POD_SANDBOX ? "sandbox-pod" : "pod";
		let childProcess = await this.$childProcess.spawnFromEvent(podTool, ["install"], "close", { cwd: this.getPlatformData(projectData).projectRoot, stdio: ['pipe', process.stdout, 'pipe'] });
		if (childProcess.stderr) {
			let warnings = childProcess.stderr.match(/(\u001b\[(?:\d*;){0,5}\d*m[\s\S]+?\u001b\[(?:\d*;){0,5}\d*m)|(\[!\].*?\n)|(.*?warning.*)/gi);
			_.each(warnings, (warning: string) => {
				this.$logger.warnWithLabel(warning.replace("\n", ""));
			});

			let errors = childProcess.stderr;
			_.each(warnings, warning => {
				errors = errors.replace(warning, "");
			});

			if (errors.trim()) {
				this.$errors.failWithoutHelp(`Pod install command failed. Error output: ${errors}`);
			}
		}

		if ((await this.$xcprojService.getXcprojInfo()).shouldUseXcproj) {
			await this.$childProcess.spawnFromEvent("xcproj", ["--project", this.getXcodeprojPath(projectData), "touch"], "close");
		}

		return childProcess;
	}

	private async prepareFrameworks(pluginPlatformsFolderPath: string, pluginData: IPluginData, projectData: IProjectData): Promise<void> {
		await _.each(this.getAllLibsForPluginWithFileExtension(pluginData, ".framework"), (fileName) => {
			this.addFramework(path.join(pluginPlatformsFolderPath, fileName), projectData);
		});
	}

	private async prepareStaticLibs(pluginPlatformsFolderPath: string, pluginData: IPluginData, projectData: IProjectData): Promise<void> {
		for (let fileName of this.getAllLibsForPluginWithFileExtension(pluginData, ".a")) {
			await this.addStaticLibrary(path.join(pluginPlatformsFolderPath, fileName), projectData);
		}
	}

	private async prepareCocoapods(pluginPlatformsFolderPath: string, projectData: IProjectData, opts?: any): Promise<void> {
		let pluginPodFilePath = path.join(pluginPlatformsFolderPath, "Podfile");
		if (this.$fs.exists(pluginPodFilePath)) {
			let pluginPodFileContent = this.$fs.readText(pluginPodFilePath),
				pluginPodFilePreparedContent = this.buildPodfileContent(pluginPodFilePath, pluginPodFileContent),
				projectPodFileContent = this.$fs.exists(this.getProjectPodFilePath(projectData)) ? this.$fs.readText(this.getProjectPodFilePath(projectData)) : "";

			if (!~projectPodFileContent.indexOf(pluginPodFilePreparedContent)) {
				let podFileHeader = this.$cocoapodsService.getPodfileHeader(projectData.projectName),
					podFileFooter = this.$cocoapodsService.getPodfileFooter();

				if (_.startsWith(projectPodFileContent, podFileHeader)) {
					projectPodFileContent = projectPodFileContent.substr(podFileHeader.length);
				}

				if (_.endsWith(projectPodFileContent, podFileFooter)) {
					projectPodFileContent = projectPodFileContent.substr(0, projectPodFileContent.length - podFileFooter.length);
				}

				let contentToWrite = `${podFileHeader}${projectPodFileContent}${pluginPodFilePreparedContent}${podFileFooter}`;
				this.$fs.writeFile(this.getProjectPodFilePath(projectData), contentToWrite);

				let project = this.createPbxProj(projectData);
				this.savePbxProj(project, projectData);
			}
		}

		if (opts && opts.executePodInstall && this.$fs.exists(pluginPodFilePath)) {
			await this.executePodInstall(projectData);
		}
	}

	private removeFrameworks(pluginPlatformsFolderPath: string, pluginData: IPluginData, projectData: IProjectData): void {
		let project = this.createPbxProj(projectData);
		_.each(this.getAllLibsForPluginWithFileExtension(pluginData, ".framework"), fileName => {
			let relativeFrameworkPath = this.getLibSubpathRelativeToProjectPath(fileName, projectData);
			project.removeFramework(relativeFrameworkPath, { customFramework: true, embed: true });
		});

		this.savePbxProj(project, projectData);
	}

	private removeStaticLibs(pluginPlatformsFolderPath: string, pluginData: IPluginData, projectData: IProjectData): void {
		let project = this.createPbxProj(projectData);

		_.each(this.getAllLibsForPluginWithFileExtension(pluginData, ".a"), fileName => {
			let staticLibPath = path.join(pluginPlatformsFolderPath, fileName);
			let relativeStaticLibPath = this.getLibSubpathRelativeToProjectPath(path.basename(staticLibPath), projectData);
			project.removeFramework(relativeStaticLibPath);

			let headersSubpath = path.join("include", path.basename(staticLibPath, ".a"));
			let relativeHeaderSearchPath = path.join(this.getLibSubpathRelativeToProjectPath(headersSubpath, projectData));
			project.removeFromHeaderSearchPaths({ relativePath: relativeHeaderSearchPath });
		});

		this.savePbxProj(project, projectData);
	}

	private removeCocoapods(pluginPlatformsFolderPath: string, projectData: IProjectData): void {
		let pluginPodFilePath = path.join(pluginPlatformsFolderPath, "Podfile");

		if (this.$fs.exists(pluginPodFilePath) && this.$fs.exists(this.getProjectPodFilePath(projectData))) {
			let pluginPodFileContent = this.$fs.readText(pluginPodFilePath);
			let projectPodFileContent = this.$fs.readText(this.getProjectPodFilePath(projectData));
			let contentToRemove = this.buildPodfileContent(pluginPodFilePath, pluginPodFileContent);
			projectPodFileContent = helpers.stringReplaceAll(projectPodFileContent, contentToRemove, "");
			if (projectPodFileContent.trim() === `use_frameworks!${os.EOL}${os.EOL}target "${projectData.projectName}" do${os.EOL}${os.EOL}end`) {
				this.$fs.deleteFile(this.getProjectPodFilePath(projectData));
			} else {
				this.$fs.writeFile(this.getProjectPodFilePath(projectData), projectPodFileContent);
			}
		}
	}

	private buildPodfileContent(pluginPodFilePath: string, pluginPodFileContent: string): string {
		return `# Begin Podfile - ${pluginPodFilePath} ${os.EOL} ${pluginPodFileContent} ${os.EOL} # End Podfile ${os.EOL}`;
	}

	private generateModulemap(headersFolderPath: string, libraryName: string): void {
		let headersFilter = (fileName: string, containingFolderPath: string) => (path.extname(fileName) === ".h" && this.$fs.getFsStats(path.join(containingFolderPath, fileName)).isFile());
		let headersFolderContents = this.$fs.readDirectory(headersFolderPath);
		let headers = _(headersFolderContents).filter(item => headersFilter(item, headersFolderPath)).value();

		if (!headers.length) {
			this.$fs.deleteFile(path.join(headersFolderPath, "module.modulemap"));
			return;
		}

		headers = _.map(headers, value => `header "${value}"`);

		let modulemap = `module ${libraryName} { explicit module ${libraryName} { ${headers.join(" ")} } }`;
		this.$fs.writeFile(path.join(headersFolderPath, "module.modulemap"), modulemap);
	}

	private async mergeXcconfigFiles(pluginFile: string, projectFile: string): Promise<void> {
		if (!this.$fs.exists(projectFile)) {
			this.$fs.writeFile(projectFile, "");
		}

		if (this.$hostInfo.isDarwin) {
			await this.checkIfXcodeprojIsRequired();
			let escapedProjectFile = projectFile.replace(/'/g, "\\'"),
				escapedPluginFile = pluginFile.replace(/'/g, "\\'"),
				mergeScript = `require 'xcodeproj'; Xcodeproj::Config.new('${escapedProjectFile}').merge(Xcodeproj::Config.new('${escapedPluginFile}')).save_as(Pathname.new('${escapedProjectFile}'))`;
			await this.$childProcess.exec(`ruby -e "${mergeScript}"`);
		}
	}

	private async mergeProjectXcconfigFiles(release: boolean, projectData: IProjectData): Promise<void> {
		let pluginsXcconfigFilePath = release ? this.getPluginsReleaseXcconfigFilePath(projectData) : this.getPluginsDebugXcconfigFilePath(projectData);
		this.$fs.deleteFile(pluginsXcconfigFilePath);

		let allPlugins: IPluginData[] = await (<IPluginsService>this.$injector.resolve("pluginsService")).getAllInstalledPlugins(projectData);
		for (let plugin of allPlugins) {
			let pluginPlatformsFolderPath = plugin.pluginPlatformsFolderPath(IOSProjectService.IOS_PLATFORM_NAME);
			let pluginXcconfigFilePath = path.join(pluginPlatformsFolderPath, "build.xcconfig");
			if (this.$fs.exists(pluginXcconfigFilePath)) {
				await this.mergeXcconfigFiles(pluginXcconfigFilePath, pluginsXcconfigFilePath);
			}
		}

		let appResourcesXcconfigPath = path.join(projectData.projectDir, constants.APP_FOLDER_NAME, constants.APP_RESOURCES_FOLDER_NAME, this.getPlatformData(projectData).normalizedPlatformName, "build.xcconfig");
		if (this.$fs.exists(appResourcesXcconfigPath)) {
			await this.mergeXcconfigFiles(appResourcesXcconfigPath, pluginsXcconfigFilePath);
		}

		// Set Entitlements Property to point to default file if not set explicitly by the user.
		let entitlementsPropertyValue = this.$xCConfigService.readPropertyValue(pluginsXcconfigFilePath, constants.CODE_SIGN_ENTITLEMENTS);
		if (entitlementsPropertyValue === null) {
			temp.track();
			const tempEntitlementsDir = temp.mkdirSync("entitlements");
			const tempEntitlementsFilePath = path.join(tempEntitlementsDir, "set-entitlements.xcconfig");
			const entitlementsRelativePath = this.$iOSEntitlementsService.getPlatformsEntitlementsRelativePath(projectData);
			this.$fs.writeFile(tempEntitlementsFilePath, `CODE_SIGN_ENTITLEMENTS = ${entitlementsRelativePath}${EOL}`);

			await this.mergeXcconfigFiles(tempEntitlementsFilePath, pluginsXcconfigFilePath);
		}

		let podFilesRootDirName = path.join("Pods", "Target Support Files", `Pods-${projectData.projectName}`);
		let podFolder = path.join(this.getPlatformData(projectData).projectRoot, podFilesRootDirName);
		if (this.$fs.exists(podFolder)) {
			if (release) {
				await this.mergeXcconfigFiles(path.join(this.getPlatformData(projectData).projectRoot, podFilesRootDirName, `Pods-${projectData.projectName}.release.xcconfig`), this.getPluginsReleaseXcconfigFilePath(projectData));
			} else {
				await this.mergeXcconfigFiles(path.join(this.getPlatformData(projectData).projectRoot, podFilesRootDirName, `Pods-${projectData.projectName}.debug.xcconfig`), this.getPluginsDebugXcconfigFilePath(projectData));
			}
		}
	}

	private async checkIfXcodeprojIsRequired(): Promise<boolean> {
		let xcprojInfo = await this.$xcprojService.getXcprojInfo();
		if (xcprojInfo.shouldUseXcproj && !xcprojInfo.xcprojAvailable) {
			let errorMessage = `You are using CocoaPods version ${xcprojInfo.cocoapodVer} which does not support Xcode ${xcprojInfo.xcodeVersion.major}.${xcprojInfo.xcodeVersion.minor} yet.${EOL}${EOL}You can update your cocoapods by running $sudo gem install cocoapods from a terminal.${EOL}${EOL}In order for the NativeScript CLI to be able to work correctly with this setup you need to install xcproj command line tool and add it to your PATH. Xcproj can be installed with homebrew by running $ brew install xcproj from the terminal`;

			this.$errors.failWithoutHelp(errorMessage);

			return true;
		}
	}

	private async getXcodeVersion(): Promise<string> {
		let xcodeBuildVersion = "";

		try {
			xcodeBuildVersion = await this.$childProcess.exec("xcodebuild -version | head -n 1 | sed -e 's/Xcode //'");
		} catch (error) {
			this.$errors.fail("xcodebuild execution failed. Make sure that you have latest Xcode and tools installed.");
		}

		let splitedXcodeBuildVersion = xcodeBuildVersion.split(".");
		if (splitedXcodeBuildVersion.length === 3) {
			xcodeBuildVersion = `${splitedXcodeBuildVersion[0]}.${splitedXcodeBuildVersion[1]}`;
		}

		return xcodeBuildVersion;
	}

	private getDevelopmentTeams(): Array<{ id: string, name: string }> {
		let dir = path.join(process.env.HOME, "Library/MobileDevice/Provisioning Profiles/");
		let files = this.$fs.readDirectory(dir);
		let teamIds: any = {};
		for (let file of files) {
			let filePath = path.join(dir, file);
			let data = this.$fs.readText(filePath, "utf8");
			let teamId = this.getProvisioningProfileValue("TeamIdentifier", data);
			let teamName = this.getProvisioningProfileValue("TeamName", data);
			if (teamId) {
				teamIds[teamId] = teamName;
			}
		}

		let teamIdsArray = new Array<{ id: string, name: string }>();
		for (let teamId in teamIds) {
			teamIdsArray.push({ id: teamId, name: teamIds[teamId] });
		}

		return teamIdsArray;
	}

	private getProvisioningProfileValue(name: string, text: string): string {
		let findStr = "<key>" + name + "</key>";
		let index = text.indexOf(findStr);
		if (index > 0) {
			index = text.indexOf("<string>", index + findStr.length);
			if (index > 0) {
				index += "<string>".length;
				let endIndex = text.indexOf("</string>", index);
				let result = text.substring(index, endIndex);
				return result;
			}
		}

		return null;
	}

	private getBuildXCConfigFilePath(projectData: IProjectData): string {
		let buildXCConfig = path.join(projectData.appResourcesDirectoryPath,
			this.getPlatformData(projectData).normalizedPlatformName, "build.xcconfig");
		return buildXCConfig;
	}

	private readTeamId(projectData: IProjectData): string {
		let teamId = this.$xCConfigService.readPropertyValue(this.getBuildXCConfigFilePath(projectData), "DEVELOPMENT_TEAM");

		let fileName = path.join(this.getPlatformData(projectData).projectRoot, "teamid");
		if (this.$fs.exists(fileName)) {
			teamId = this.$fs.readText(fileName);
		}

		return teamId;
	}

	private readXCConfigProvisioningProfile(projectData: IProjectData): string {
		return this.$xCConfigService.readPropertyValue(this.getBuildXCConfigFilePath(projectData), "PROVISIONING_PROFILE");
	}

	private readXCConfigProvisioningProfileForIPhoneOs(projectData: IProjectData): string {
		return this.$xCConfigService.readPropertyValue(this.getBuildXCConfigFilePath(projectData), "PROVISIONING_PROFILE[sdk=iphoneos*]");
	}

	private readXCConfigProvisioningProfileSpecifier(projectData: IProjectData): string {
		return this.$xCConfigService.readPropertyValue(this.getBuildXCConfigFilePath(projectData), "PROVISIONING_PROFILE_SPECIFIER");
	}

	private readXCConfigProvisioningProfileSpecifierForIPhoneOs(projectData: IProjectData): string {
		return this.$xCConfigService.readPropertyValue(this.getBuildXCConfigFilePath(projectData), "PROVISIONING_PROFILE_SPECIFIER[sdk=iphoneos*]");
	}

	private async getDevelopmentTeam(projectData: IProjectData, teamId?: string): Promise<string> {
		teamId = teamId || this.readTeamId(projectData);

		if (!teamId) {
			let teams = this.getDevelopmentTeams();
			this.$logger.warn("Xcode 8 requires a team id to be specified when building for device.");
			this.$logger.warn("You can specify the team id by setting the DEVELOPMENT_TEAM setting in build.xcconfig file located in App_Resources folder of your app, or by using the --teamId option when calling run, debug or livesync commnads.");
			if (teams.length === 1) {
				teamId = teams[0].id;
				this.$logger.warn("Found and using the following development team installed on your system: " + teams[0].name + " (" + teams[0].id + ")");
			} else if (teams.length > 0) {
				if (!helpers.isInteractive()) {
					this.$errors.failWithoutHelp(`Unable to determine default development team. Available development teams are: ${_.map(teams, team => team.id)}. Specify team in app/App_Resources/iOS/build.xcconfig file in the following way: DEVELOPMENT_TEAM = <team id>`);
				}

				let choices: string[] = [];
				for (let team of teams) {
					choices.push(team.name + " (" + team.id + ")");
				}
				let choice = await this.$prompter.promptForChoice('Found multiple development teams, select one:', choices);
				teamId = teams[choices.indexOf(choice)].id;

				let choicesPersist = [
					"Yes, set the DEVELOPMENT_TEAM setting in build.xcconfig file.",
					"Yes, persist the team id in platforms folder.",
					"No, don't persist this setting."
				];
				let choicePersist = await this.$prompter.promptForChoice("Do you want to make teamId: " + teamId + " a persistent choice for your app?", choicesPersist);
				switch (choicesPersist.indexOf(choicePersist)) {
					case 0:
						let xcconfigFile = path.join(projectData.appResourcesDirectoryPath, this.getPlatformData(projectData).normalizedPlatformName, "build.xcconfig");
						this.$fs.appendFile(xcconfigFile, "\nDEVELOPMENT_TEAM = " + teamId + "\n");
						break;
					case 1:
						this.$fs.writeFile(path.join(this.getPlatformData(projectData).projectRoot, "teamid"), teamId);
						break;
					default:
						break;
				}
			}
		}
		return teamId;
	}
}

$injector.register("iOSProjectService", IOSProjectService);
