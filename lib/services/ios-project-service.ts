import * as path from "path";
import * as shell from "shelljs";
import * as semver from "semver";
import * as constants from "../constants";
import { Configurations } from "../common/constants";
import * as helpers from "../common/helpers";
import { attachAwaitDetach } from "../common/helpers";
import * as projectServiceBaseLib from "./platform-project-service-base";
import { PlistSession, Reporter } from "plist-merge-patch";
import { EOL } from "os";
import * as temp from "temp";
import * as plist from "plist";
import { IOSProvisionService } from "./ios-provision-service";
import { IOSEntitlementsService } from "./ios-entitlements-service";
import * as mobileProvisionFinder from "ios-mobileprovision-finder";
import { BUILD_XCCONFIG_FILE_NAME, IosProjectConstants, IOSNativeTargetProductTypes } from "../constants";

interface INativeSourceCodeGroup {
	name: string;
	path: string;
	files: string[];
}

enum ProductArgs {
	target = "target",
	scheme = "scheme"
}

const DevicePlatformSdkName = "iphoneos";
const SimulatorPlatformSdkName = "iphonesimulator";

const getPlatformSdkName = (forDevice: boolean): string => forDevice ? DevicePlatformSdkName : SimulatorPlatformSdkName;
const getConfigurationName = (release: boolean): string => release ? Configurations.Release : Configurations.Debug;

export class IOSProjectService extends projectServiceBaseLib.PlatformProjectServiceBase implements IPlatformProjectService {
	private static IOS_PROJECT_NAME_PLACEHOLDER = "__PROJECT_NAME__";
	private static IOS_PLATFORM_NAME = "ios";

	constructor($fs: IFileSystem,
		private $childProcess: IChildProcess,
		private $cocoapodsService: ICocoaPodsService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $injector: IInjector,
		$projectDataService: IProjectDataService,
		private $prompter: IPrompter,
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
		private $platformEnvironmentRequirements: IPlatformEnvironmentRequirements,
		private $plistParser: IPlistParser,
		private $sysInfo: ISysInfo,
		private $xcconfigService: IXcconfigService,
		private $iOSExtensionsService: IIOSExtensionsService,
		private $iOSWatchAppService: IIOSWatchAppService) {
		super($fs, $projectDataService);
	}

	private _platformsDirCache: string = null;
	private _platformData: IPlatformData = null;
	public getPlatformData(projectData: IProjectData): IPlatformData {
		if (!projectData && !this._platformData) {
			throw new Error("First call of getPlatformData without providing projectData.");
		}

		if (projectData && projectData.platformsDir && this._platformsDirCache !== projectData.platformsDir) {
			const projectRoot = path.join(projectData.platformsDir, this.$devicePlatformsConstants.iOS.toLowerCase());

			this._platformData = {
				frameworkPackageName: constants.TNS_IOS_RUNTIME_NAME,
				normalizedPlatformName: "iOS",
				appDestinationDirectoryPath: path.join(projectRoot, projectData.projectName),
				platformProjectService: this,
				projectRoot: projectRoot,
				getBuildOutputPath: (options: IBuildOutputOptions): string => {
					const config = getConfigurationName(!options || options.release);
					return path.join(projectRoot, constants.BUILD_DIR, `${config}-${getPlatformSdkName(!options || options.buildForDevice)}`);
				},
				getValidBuildOutputData: (buildOptions: IBuildOutputOptions): IValidBuildOutputData => {
					const forDevice = !buildOptions || !!buildOptions.buildForDevice;
					if (forDevice) {
						return {
							packageNames: [`${projectData.projectName}.ipa`]
						};
					}

					return {
						packageNames: [`${projectData.projectName}.app`, `${projectData.projectName}.zip`]
					};
				},
				frameworkFilesExtensions: [".a", ".framework", ".bin"],
				frameworkDirectoriesExtensions: [".framework"],
				frameworkDirectoriesNames: ["Metadata", "metadataGenerator", "NativeScript", "internal"],
				targetedOS: ['darwin'],
				configurationFileName: constants.INFO_PLIST_FILE_NAME,
				configurationFilePath: path.join(projectRoot, projectData.projectName, projectData.projectName + `-${constants.INFO_PLIST_FILE_NAME}`),
				relativeToFrameworkConfigurationFilePath: path.join("__PROJECT_NAME__", "__PROJECT_NAME__-Info.plist"),
				fastLivesyncFileExtensions: [".tiff", ".tif", ".jpg", "jpeg", "gif", ".png", ".bmp", ".BMPf", ".ico", ".cur", ".xbm"] // https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIImage_Class/
			};
		}

		return this._platformData;
	}

	public async validateOptions(projectId: string, provision: true | string, teamId: true | string): Promise<boolean> {
		if (provision && teamId) {
			this.$errors.failWithoutHelp("The options --provision and --teamId are mutually exclusive.");
		}

		if (provision === true) {
			await this.$iOSProvisionService.listProvisions(projectId);
			this.$errors.failWithoutHelp("Please provide provisioning profile uuid or name with the --provision option.");
			return false;
		}

		if (teamId === true) {
			await this.$iOSProvisionService.listTeams();
			this.$errors.failWithoutHelp("Please provide team id or team name with the --teamId options.");
			return false;
		}

		return true;
	}

	public getAppResourcesDestinationDirectoryPath(projectData: IProjectData): string {
		const frameworkVersion = this.getFrameworkVersion(projectData);

		if (semver.lt(frameworkVersion, "1.3.0")) {
			return path.join(this.getPlatformData(projectData).projectRoot, projectData.projectName, "Resources", "icons");
		}

		return path.join(this.getPlatformData(projectData).projectRoot, projectData.projectName, "Resources");
	}

	public async validate(projectData: IProjectData, options: IOptions, notConfiguredEnvOptions?: INotConfiguredEnvOptions): Promise<IValidatePlatformOutput> {
		if (!this.$hostInfo.isDarwin) {
			return;
		}

		const checkEnvironmentRequirementsOutput = await this.$platformEnvironmentRequirements.checkEnvironmentRequirements({
			platform: this.getPlatformData(projectData).normalizedPlatformName,
			projectDir: projectData.projectDir,
			options,
			notConfiguredEnvOptions
		});

		return {
			checkEnvironmentRequirementsOutput
		};
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
		const projectRootFilePath = path.join(this.getPlatformData(projectData).projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER);
		// Starting with NativeScript for iOS 1.6.0, the project Info.plist file resides not in the platform project,
		// but in the hello-world app template as a platform specific resource.
		if (this.$fs.exists(path.join(projectRootFilePath, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER + "-Info.plist"))) {
			this.replaceFileName("-Info.plist", projectRootFilePath, projectData);
		}
		this.replaceFileName("-Prefix.pch", projectRootFilePath, projectData);

		const xcschemeDirPath = path.join(this.getPlatformData(projectData).projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER + IosProjectConstants.XcodeProjExtName, "xcshareddata/xcschemes");
		const xcschemeFilePath = path.join(xcschemeDirPath, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER + IosProjectConstants.XcodeSchemeExtName);

		if (this.$fs.exists(xcschemeFilePath)) {
			this.$logger.debug("Found shared scheme at xcschemeFilePath, renaming to match project name.");
			this.$logger.debug("Checkpoint 0");
			this.replaceFileContent(xcschemeFilePath, projectData);
			this.$logger.debug("Checkpoint 1");
			this.replaceFileName(IosProjectConstants.XcodeSchemeExtName, xcschemeDirPath, projectData);
			this.$logger.debug("Checkpoint 2");
		} else {
			this.$logger.debug("Copying xcscheme from template not found at " + xcschemeFilePath);
		}

		this.replaceFileName(IosProjectConstants.XcodeProjExtName, this.getPlatformData(projectData).projectRoot, projectData);

		const pbxprojFilePath = this.getPbxProjPath(projectData);
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
	public async archive(projectData: IProjectData, buildConfig?: IBuildConfig, options?: { archivePath?: string, additionalArgs?: string[] }): Promise<string> {
		const platformData = this.getPlatformData(projectData);
		const projectRoot = this.getPlatformData(projectData).projectRoot;
		const archivePath = options && options.archivePath ? path.resolve(options.archivePath) : path.join(platformData.getBuildOutputPath(buildConfig), projectData.projectName + ".xcarchive");
		let args = ["archive", "-archivePath", archivePath, "-configuration",
			getConfigurationName(!buildConfig || buildConfig.release)]
			.concat(this.xcbuildProjectArgs(projectRoot, projectData, ProductArgs.scheme));

		if (options && options.additionalArgs) {
			args = args.concat(options.additionalArgs);
		}

		await this.xcodebuild(args, projectRoot, buildConfig && buildConfig.buildOutputStdio);
		return archivePath;
	}

	/**
	 * Exports .xcarchive for AppStore distribution.
	 */
	public async exportArchive(projectData: IProjectData, options: { archivePath: string, exportDir?: string, teamID?: string, provision?: string }): Promise<string> {
		const projectRoot = this.getPlatformData(projectData).projectRoot;
		const archivePath = options.archivePath;
		// The xcodebuild exportPath expects directory and writes the <project-name>.ipa at that directory.
		const exportPath = path.resolve(options.exportDir || path.join(projectRoot, "/build/archive"));
		const exportFile = path.join(exportPath, projectData.projectName + ".ipa");

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
		if (options && options.provision) {
			plistTemplate += `    <key>provisioningProfiles</key>
    <dict>
        <key>${projectData.projectIdentifiers.ios}</key>
        <string>${options.provision}</string>
    </dict>`;
		}
		plistTemplate += `    <key>method</key>
    <string>app-store</string>
    <key>uploadBitcode</key>
    <false/>
    <key>compileBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <false/>
</dict>
</plist>`;

		// Save the options...
		temp.track();
		const exportOptionsPlist = temp.path({ prefix: "export-", suffix: ".plist" });
		this.$fs.writeFile(exportOptionsPlist, plistTemplate);

		await this.xcodebuild(
			[
				"-exportArchive",
				"-archivePath", archivePath,
				"-exportPath", exportPath,
				"-exportOptionsPlist", exportOptionsPlist
			],
			projectRoot);
		return exportFile;
	}

	private iCloudContainerEnvironment(buildConfig: IBuildConfig): string {
		return buildConfig && buildConfig.iCloudContainerEnvironment ? buildConfig.iCloudContainerEnvironment : null;
	}

	/**
	 * Exports .xcarchive for a development device.
	 */
	private async exportDevelopmentArchive(projectData: IProjectData, buildConfig: IBuildConfig, options: { archivePath: string, provision?: string }): Promise<string> {
		const platformData = this.getPlatformData(projectData);
		const projectRoot = platformData.projectRoot;
		const archivePath = options.archivePath;
		const exportOptionsMethod = await this.getExportOptionsMethod(projectData, archivePath);
		const iCloudContainerEnvironment = this.iCloudContainerEnvironment(buildConfig);
		let plistTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
	<string>${exportOptionsMethod}</string>`;
		if (options && options.provision) {
			plistTemplate += `    <key>provisioningProfiles</key>
<dict>
	<key>${projectData.projectIdentifiers.ios}</key>
	<string>${options.provision}</string>
</dict>`;
		}
		plistTemplate += `
    <key>uploadBitcode</key>
    <false/>
    <key>compileBitcode</key>
    <false/>`;
		if (iCloudContainerEnvironment) {
			plistTemplate += `
    <key>iCloudContainerEnvironment</key>
    <string>${iCloudContainerEnvironment}</string>`;
		}
		plistTemplate += `
</dict>
</plist>`;

		// Save the options...
		temp.track();
		const exportOptionsPlist = temp.path({ prefix: "export-", suffix: ".plist" });
		this.$fs.writeFile(exportOptionsPlist, plistTemplate);

		// The xcodebuild exportPath expects directory and writes the <project-name>.ipa at that directory.
		const exportPath = path.resolve(path.dirname(archivePath));
		const exportFile = path.join(exportPath, projectData.projectName + ".ipa");

		await this.xcodebuild(
			[
				"-exportArchive",
				"-archivePath", archivePath,
				"-exportPath", exportPath,
				"-exportOptionsPlist", exportOptionsPlist
			],
			projectRoot, buildConfig.buildOutputStdio);
		return exportFile;
	}

	private xcbuildProjectArgs(projectRoot: string, projectData: IProjectData, product?: ProductArgs): string[] {
		const xcworkspacePath = path.join(projectRoot, projectData.projectName + ".xcworkspace");
		if (this.$fs.exists(xcworkspacePath)) {
			return ["-workspace", xcworkspacePath, product ? "-" + product : "-scheme", projectData.projectName];
		} else {
			const xcodeprojPath = path.join(projectRoot, projectData.projectName + ".xcodeproj");
			return ["-project", xcodeprojPath, product ? "-" + product : "-target", projectData.projectName];
		}
	}

	public async buildProject(projectRoot: string, projectData: IProjectData, buildConfig: IBuildConfig): Promise<void> {
		const basicArgs = [
			'SHARED_PRECOMPS_DIR=' + path.join(projectRoot, 'build', 'sharedpch')
		];

		// Starting from tns-ios 1.4 the xcconfig file is referenced in the project template
		const frameworkVersion = this.getFrameworkVersion(projectData);
		if (semver.lt(frameworkVersion, "1.4.0")) {
			basicArgs.push("-xcconfig", path.join(projectRoot, projectData.projectName, BUILD_XCCONFIG_FILE_NAME));
		}

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
				this.buildForSimulator(projectRoot, basicArgs, projectData, buildConfig));
		}

		this.validateApplicationIdentifier(projectData);
	}

	public async validatePlugins(projectData: IProjectData): Promise<void> {
		const installedPlugins = await (<IPluginsService>this.$injector.resolve("pluginsService")).getAllInstalledPlugins(projectData);
		for (const pluginData of installedPlugins) {
			const pluginsFolderExists = this.$fs.exists(path.join(pluginData.pluginPlatformsFolderPath(this.$devicePlatformsConstants.iOS.toLowerCase()), "Podfile"));
			const cocoaPodVersion = await this.$sysInfo.getCocoaPodsVersion();
			if (pluginsFolderExists && !cocoaPodVersion) {
				this.$errors.failWithoutHelp(`${pluginData.name} has Podfile and you don't have Cocoapods installed or it is not configured correctly. Please verify Cocoapods can work on your machine.`);
			}
		}
	}

	private async buildForDevice(projectRoot: string, args: string[], buildConfig: IBuildConfig, projectData: IProjectData): Promise<void> {
		if (!buildConfig.release && !buildConfig.architectures) {
			await this.$devicesService.initialize({
				platform: this.$devicePlatformsConstants.iOS.toLowerCase(), deviceId: buildConfig.device,
				skipEmulatorStart: true
			});
			const instances = this.$devicesService.getDeviceInstances();
			const devicesArchitectures = _(instances)
				.filter(d => this.$mobileHelper.isiOSPlatform(d.deviceInfo.platform) && !!d.deviceInfo.activeArchitecture)
				.map(d => d.deviceInfo.activeArchitecture)
				.uniq()
				.value();
			if (devicesArchitectures.length > 0) {
				const architectures = this.getBuildArchitectures(projectData, buildConfig, devicesArchitectures);
				if (devicesArchitectures.length > 1) {
					architectures.push('ONLY_ACTIVE_ARCH=NO');
				}
				buildConfig.architectures = architectures;
			}
		}

		args = args.concat((buildConfig && buildConfig.architectures) || this.getBuildArchitectures(projectData, buildConfig, ["armv7", "arm64"]));

		if (!this.hasWatchApp(projectData)) {
			args = args.concat([
				"-sdk", DevicePlatformSdkName
			]);
		}

		args = args.concat([
			"BUILD_DIR=" + path.join(projectRoot, constants.BUILD_DIR)
		]);

		const xcodeBuildVersion = await this.getXcodeVersion();
		if (helpers.versionCompare(xcodeBuildVersion, "8.0") >= 0) {
			await this.setupSigningForDevice(projectRoot, buildConfig, projectData);
		}

		await this.createIpa(projectRoot, projectData, buildConfig, args);
	}

	private async xcodebuild(args: string[], cwd: string, stdio: any = "inherit"): Promise<ISpawnResult> {
		const localArgs = [...args];
		const xcodeBuildVersion = await this.getXcodeVersion();
		try {
			if (helpers.versionCompare(xcodeBuildVersion, "9.0") >= 0) {
				localArgs.push("-allowProvisioningUpdates");
			}
		} catch (e) {
			this.$logger.warn("Failed to detect whether -allowProvisioningUpdates can be used with your xcodebuild version due to error: " + e);
		}
		if (this.$logger.getLevel() === "INFO") {
			localArgs.push("-quiet");
			this.$logger.info("Xcode build...");
		}

		let commandResult;
		try {
			commandResult = await this.$childProcess.spawnFromEvent("xcodebuild",
				localArgs,
				"exit",
				{ stdio: stdio || "inherit", cwd },
				{ emitOptions: { eventName: constants.BUILD_OUTPUT_EVENT_NAME }, throwError: true });
		} catch (err) {
			this.$errors.failWithoutHelp(err.message);
		}

		return commandResult;
	}

	private getBuildArchitectures(projectData: IProjectData, buildConfig: IBuildConfig, architectures: string[]): string[] {
		let result: string[] = [];

		const frameworkVersion = this.getFrameworkVersion(projectData);
		if (semver.valid(frameworkVersion) && semver.lt(semver.coerce(frameworkVersion), "5.1.0")) {
			const target = this.getDeploymentTarget(projectData);
			if (target && target.major >= 11) {
				// We need to strip 32bit architectures as of deployment target >= 11 it is not allowed to have such
				architectures = _.filter(architectures, arch => {
					const is64BitArchitecture = arch === "x86_64" || arch === "arm64";
					if (!is64BitArchitecture) {
						this.$logger.warn(`The architecture ${arch} will be stripped as it is not supported for deployment target ${target.version}.`);
					}
					return is64BitArchitecture;
				});
			}
			result = [`ARCHS=${architectures.join(" ")}`, `VALID_ARCHS=${architectures.join(" ")}`];
		}

		return result;
	}

	private async setupSigningFromTeam(projectRoot: string, projectData: IProjectData, teamId: string) {
		const xcode = this.$pbxprojDomXcode.Xcode.open(this.getPbxProjPath(projectData));
		const signing = xcode.getSigning(projectData.projectName);

		let shouldUpdateXcode = false;
		if (signing && signing.style === "Automatic") {
			if (signing.team !== teamId) {
				// Maybe the provided team is name such as "Telerik AD" and we need to convert it to CH******37
				const teamIdsForName = await this.$iOSProvisionService.getTeamIdsWithName(teamId);
				if (!teamIdsForName.some(id => id === signing.team)) {
					shouldUpdateXcode = true;
				}
			}
		} else {
			shouldUpdateXcode = true;
		}

		if (shouldUpdateXcode) {
			const teamIdsForName = await this.$iOSProvisionService.getTeamIdsWithName(teamId);
			if (teamIdsForName.length > 0) {
				this.$logger.trace(`Team id ${teamIdsForName[0]} will be used for team name "${teamId}".`);
				teamId = teamIdsForName[0];
			}

			xcode.setAutomaticSigningStyle(projectData.projectName, teamId);
			xcode.setAutomaticSigningStyleByTargetProductTypesList([
				IOSNativeTargetProductTypes.appExtension,
				IOSNativeTargetProductTypes.watchApp,
				IOSNativeTargetProductTypes.watchExtension
			],
			teamId);
			xcode.save();

			this.$logger.trace(`Set Automatic signing style and team id ${teamId}.`);
		} else {
			this.$logger.trace(`The specified ${teamId} is already set in the Xcode.`);
		}
	}

	private async setupSigningFromProvision(projectRoot: string, projectData: IProjectData, provision?: string, mobileProvisionData?: mobileProvisionFinder.provision.MobileProvision): Promise<void> {
		if (provision) {
			const xcode = this.$pbxprojDomXcode.Xcode.open(this.getPbxProjPath(projectData));
			const signing = xcode.getSigning(projectData.projectName);

			let shouldUpdateXcode = false;
			if (signing && signing.style === "Manual") {
				for (const config in signing.configurations) {
					const options = signing.configurations[config];
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
				const mobileprovision = mobileProvisionData || await this.$iOSProvisionService.pick(provision, projectData.projectIdentifiers.ios);
				const pickEnd = Date.now();
				this.$logger.trace("Searched and " + (mobileprovision ? "found" : "failed to find ") + " matching provisioning profile. (" + (pickEnd - pickStart) + "ms.)");
				if (!mobileprovision) {
					this.$errors.failWithoutHelp("Failed to find mobile provision with UUID or Name: " + provision);
				}
				const configuration = {
					team: mobileprovision.TeamIdentifier && mobileprovision.TeamIdentifier.length > 0 ? mobileprovision.TeamIdentifier[0] : undefined,
					uuid: mobileprovision.UUID,
					name: mobileprovision.Name,
					identity: mobileprovision.Type === "Development" ? "iPhone Developer" : "iPhone Distribution"
				};
				xcode.setManualSigningStyle(projectData.projectName, configuration);
				xcode.setManualSigningStyleByTargetProductTypesList([
					IOSNativeTargetProductTypes.appExtension,
					IOSNativeTargetProductTypes.watchApp,
					IOSNativeTargetProductTypes.watchExtension
				],
				configuration);
				xcode.save();

				// this.cache(uuid);
				this.$logger.trace(`Set Manual signing style and provisioning profile: ${mobileprovision.Name} (${mobileprovision.UUID})`);
			} else {
				this.$logger.trace(`The specified provisioning profile is already set in the Xcode: ${provision}`);
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
			const teamId = await this.getDevelopmentTeam(projectData, buildConfig.teamId);
			await this.setupSigningFromTeam(projectRoot, projectData, teamId);
		}
	}

	private async buildForSimulator(projectRoot: string, args: string[], projectData: IProjectData, buildConfig?: IBuildConfig): Promise<void> {
		const architectures = this.getBuildArchitectures(projectData, buildConfig, ["i386", "x86_64"]);
		let product = ProductArgs.target;

		args = args
			.concat(architectures)
			.concat([
				"build",
				"-configuration", getConfigurationName(buildConfig.release),
				"ONLY_ACTIVE_ARCH=NO",
				"BUILD_DIR=" + path.join(projectRoot, constants.BUILD_DIR),
			]);

			if (this.hasWatchApp(projectData)) {
				product = ProductArgs.scheme;
				args = args.concat(["-destination", "generic/platform=iOS Simulator", "CODE_SIGNING_ALLOWED=NO"]);
			} else {
				args = args.concat(["-sdk", SimulatorPlatformSdkName, "CODE_SIGN_IDENTITY="]);
			}

		args = args.concat(this.xcbuildProjectArgs(projectRoot, projectData, product));

		await this.xcodebuild(args, projectRoot, buildConfig.buildOutputStdio);
	}

	private async createIpa(projectRoot: string, projectData: IProjectData, buildConfig: IBuildConfig, args: string[]): Promise<string> {
		const archivePath = await this.archive(projectData, buildConfig, { additionalArgs: args });
		const exportFileIpa = await this.exportDevelopmentArchive(projectData, buildConfig, { archivePath, provision: buildConfig.provision || buildConfig.mobileProvisionIdentifier });
		return exportFileIpa;
	}

	public isPlatformPrepared(projectRoot: string, projectData: IProjectData): boolean {
		return this.$fs.exists(path.join(projectRoot, projectData.projectName, constants.APP_FOLDER_NAME));
	}

	public cleanDeviceTempFolder(deviceIdentifier: string): Promise<void> {
		return Promise.resolve();
	}

	private async addFramework(frameworkPath: string, projectData: IProjectData): Promise<void> {
		if (!this.$hostInfo.isWindows) {
			this.validateFramework(frameworkPath);

			const project = this.createPbxProj(projectData);
			const frameworkName = path.basename(frameworkPath, path.extname(frameworkPath));
			const frameworkBinaryPath = path.join(frameworkPath, frameworkName);
			const isDynamic = _.includes((await this.$childProcess.spawnFromEvent("file", [frameworkBinaryPath], "close")).stdout, "dynamically linked");
			const frameworkAddOptions: IXcode.Options = { customFramework: true };

			if (isDynamic) {
				frameworkAddOptions["embed"] = true;
			}

			const frameworkRelativePath = '$(SRCROOT)/' + this.getLibSubpathRelativeToProjectPath(frameworkPath, projectData);
			project.addFramework(frameworkRelativePath, frameworkAddOptions);
			this.savePbxProj(project, projectData);
		}
	}

	private async addStaticLibrary(staticLibPath: string, projectData: IProjectData): Promise<void> {
		// Copy files to lib folder.
		const libraryName = path.basename(staticLibPath, ".a");
		const headersSubpath = path.join(path.dirname(staticLibPath), "include", libraryName);

		// Add static library to project file and setup header search paths
		const project = this.createPbxProj(projectData);
		const relativeStaticLibPath = this.getLibSubpathRelativeToProjectPath(staticLibPath, projectData);
		project.addFramework(relativeStaticLibPath);

		const relativeHeaderSearchPath = path.join(this.getLibSubpathRelativeToProjectPath(headersSubpath, projectData));
		project.addToHeaderSearchPaths({ relativePath: relativeHeaderSearchPath });

		this.generateModulemap(headersSubpath, libraryName);
		this.savePbxProj(project, projectData);
	}

	public canUpdatePlatform(installedModuleDir: string, projectData: IProjectData): boolean {
		const currentXcodeProjectFile = this.buildPathToCurrentXcodeProjectFile(projectData);
		const currentXcodeProjectFileContent = this.$fs.readFile(currentXcodeProjectFile);

		const newXcodeProjectFile = this.buildPathToNewXcodeProjectFile(installedModuleDir);
		this.replaceFileContent(newXcodeProjectFile, projectData);
		const newXcodeProjectFileContent = this.$fs.readFile(newXcodeProjectFile);

		const contentIsTheSame = currentXcodeProjectFileContent.toString() === newXcodeProjectFileContent.toString();

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
			const platformData = this.getPlatformData(projectData);
			const projectPath = path.join(platformData.projectRoot, projectData.projectName);
			const projectPlist = this.getInfoPlistPath(projectData);
			const plistContent = plist.parse(this.$fs.readText(projectPlist));
			const storyName = plistContent["UILaunchStoryboardName"];
			this.$logger.trace(`Examining ${projectPlist} UILaunchStoryboardName: "${storyName}".`);
			if (storyName !== "LaunchScreen") {
				this.$logger.trace("The project has its UILaunchStoryboardName set to " + storyName + " which is not the pre v2.1.0 default LaunchScreen, probably the project is migrated so we are good to go.");
				return;
			}

			const expectedStoryPath = path.join(projectPath, "Resources", "LaunchScreen.storyboard");
			if (this.$fs.exists(expectedStoryPath)) {
				// Found a LaunchScreen on expected path
				this.$logger.trace("LaunchScreen.storyboard was found. Project is up to date.");
				return;
			}
			this.$logger.trace("LaunchScreen file not found at: " + expectedStoryPath);

			const expectedXibPath = path.join(projectPath, "en.lproj", "LaunchScreen.xib");
			if (this.$fs.exists(expectedXibPath)) {
				this.$logger.trace("Obsolete LaunchScreen.xib was found. It'k OK, we are probably running with iOS runtime from pre v2.1.0.");
				return;
			}
			this.$logger.trace("LaunchScreen file not found at: " + expectedXibPath);

			const isTheLaunchScreenFile = (fileName: string) => fileName === "LaunchScreen.xib" || fileName === "LaunchScreen.storyboard";
			const matches = this.$fs.enumerateFilesInDirectorySync(projectPath, isTheLaunchScreenFile, { enumerateDirectories: false });
			if (matches.length > 0) {
				this.$logger.trace("Found LaunchScreen by slowly traversing all files here: " + matches + "\nConsider moving the LaunchScreen so it could be found at: " + expectedStoryPath);
				return;
			}

			const compatabilityXibPath = path.join(projectPath, "Resources", "LaunchScreen.xib");
			this.$logger.warn(`Failed to find LaunchScreen.storyboard but it was specified in the Info.plist.
Consider updating the resources in app/App_Resources/iOS/.
A good starting point would be to create a new project and diff the changes with your current one.
Also the following repo may be helpful: https://github.com/NativeScript/template-hello-world/tree/master/App_Resources/iOS
We will now place an empty obsolete compatability white screen LauncScreen.xib for you in ${path.relative(projectData.projectDir, compatabilityXibPath)} so your app may appear as it did in pre v2.1.0 versions of the ios runtime.`);

			const content = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
		const projectRoot = path.join(projectData.platformsDir, "ios");

		const provision = platformSpecificData && platformSpecificData.provision;
		const teamId = platformSpecificData && platformSpecificData.teamId;
		if (provision) {
			await this.setupSigningFromProvision(projectRoot, projectData, provision, platformSpecificData.mobileProvisionData);
		}
		if (teamId) {
			await this.setupSigningFromTeam(projectRoot, projectData, teamId);
		}

		const project = this.createPbxProj(projectData);

		this.provideLaunchScreenIfMissing(projectData);

		const resources = project.pbxGroupByName("Resources");

		if (resources) {
			const references = project.pbxFileReferenceSection();

			const xcodeProjectImages = _.map(<any[]>resources.children, resource => this.replace(references[resource.value].name));
			this.$logger.trace("Images from Xcode project");
			this.$logger.trace(xcodeProjectImages);

			const appResourcesImages = this.$fs.readDirectory(this.getAppResourcesDestinationDirectoryPath(projectData));
			this.$logger.trace("Current images from App_Resources");
			this.$logger.trace(appResourcesImages);

			const imagesToAdd = _.difference(appResourcesImages, xcodeProjectImages);
			this.$logger.trace(`New images to add into xcode project: ${imagesToAdd.join(", ")}`);
			_.each(imagesToAdd, image => project.addResourceFile(path.relative(this.getPlatformData(projectData).projectRoot, path.join(this.getAppResourcesDestinationDirectoryPath(projectData), image))));

			const imagesToRemove = _.difference(xcodeProjectImages, appResourcesImages);
			this.$logger.trace(`Images to remove from xcode project: ${imagesToRemove.join(", ")}`);
			_.each(imagesToRemove, image => project.removeResourceFile(path.join(this.getAppResourcesDestinationDirectoryPath(projectData), image)));

			this.savePbxProj(project, projectData);
		}

		const platformData = this.getPlatformData(projectData);
		const resourcesDirectoryPath = projectData.getAppResourcesDirectoryPath();
		const pbxProjPath = this.getPbxProjPath(projectData);
		const resourcesNativeCodePath = path.join(
			resourcesDirectoryPath,
			platformData.normalizedPlatformName,
			constants.NATIVE_SOURCE_FOLDER
		);
		await this.prepareNativeSourceCode(constants.TNS_NATIVE_SOURCE_GROUP_NAME, resourcesNativeCodePath, projectData);
		this.$iOSWatchAppService.removeWatchApp({ pbxProjPath });
		const addedWatchApp = await this.$iOSWatchAppService.addWatchAppFromPath({ watchAppFolderPath: path.join(resourcesDirectoryPath, platformData.normalizedPlatformName), projectData, platformData, pbxProjPath });

		if (addedWatchApp) {
			this.$logger.warn("The support for Apple Watch App is currently in Beta. For more information about the current development state and any known issues, please check the relevant GitHub issue: ISSUE LINK");
		}

	}

	public prepareAppResources(appResourcesDirectoryPath: string, projectData: IProjectData): void {
		const platformFolder = path.join(appResourcesDirectoryPath, this.getPlatformData(projectData).normalizedPlatformName);
		const filterFile = (filename: string) => this.$fs.deleteFile(path.join(platformFolder, filename));

		filterFile(this.getPlatformData(projectData).configurationFileName);
		filterFile(constants.PODFILE_NAME);

		// src folder should not be copied as the pbxproject will have references to its files
		this.$fs.deleteDirectory(path.join(appResourcesDirectoryPath, this.getPlatformData(projectData).normalizedPlatformName, constants.NATIVE_SOURCE_FOLDER));
		this.$fs.deleteDirectory(path.join(appResourcesDirectoryPath, this.getPlatformData(projectData).normalizedPlatformName, constants.NATIVE_EXTENSION_FOLDER));
		this.$fs.deleteDirectory(path.join(appResourcesDirectoryPath, this.getPlatformData(projectData).normalizedPlatformName, "watchapp"));
		this.$fs.deleteDirectory(path.join(appResourcesDirectoryPath, this.getPlatformData(projectData).normalizedPlatformName, "watchextension"));

		this.$fs.deleteDirectory(this.getAppResourcesDestinationDirectoryPath(projectData));
	}

	public async processConfigurationFilesFromAppResources(projectData: IProjectData, opts: IRelease): Promise<void> {
		await this.mergeInfoPlists(projectData, opts);
		await this.$iOSEntitlementsService.merge(projectData);
		await this.mergeProjectXcconfigFiles(projectData, opts);
		for (const pluginData of await this.getAllInstalledPlugins(projectData)) {
			await this.$pluginVariablesService.interpolatePluginVariables(pluginData, this.getPlatformData(projectData).configurationFilePath, projectData.projectDir);
		}

		this.$pluginVariablesService.interpolateAppIdentifier(this.getPlatformData(projectData).configurationFilePath, projectData.projectIdentifiers.ios);
	}

	private getInfoPlistPath(projectData: IProjectData): string {
		return path.join(
			projectData.appResourcesDirectoryPath,
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

	private async mergeInfoPlists(projectData: IProjectData, buildOptions: IRelease): Promise<void> {
		const projectDir = projectData.projectDir;
		const infoPlistPath = path.join(projectData.appResourcesDirectoryPath, this.getPlatformData(projectData).normalizedPlatformName, this.getPlatformData(projectData).configurationFileName);
		this.ensureConfigurationFileInAppResources();

		if (!this.$fs.exists(infoPlistPath)) {
			this.$logger.trace("Info.plist: No app/App_Resources/iOS/Info.plist found, falling back to pre-1.6.0 Info.plist behavior.");
			return;
		}

		const reporterTraceMessage = "Info.plist:";
		const reporter: Reporter = {
			log: (txt: string) => this.$logger.trace(`${reporterTraceMessage} ${txt}`),
			warn: (txt: string) => this.$logger.warn(`${reporterTraceMessage} ${txt}`)
		};

		const session = new PlistSession(reporter);
		const makePatch = (plistPath: string) => {
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

		const allPlugins = await this.getAllInstalledPlugins(projectData);
		for (const plugin of allPlugins) {
			const pluginInfoPlistPath = path.join(plugin.pluginPlatformsFolderPath(IOSProjectService.IOS_PLATFORM_NAME), this.getPlatformData(projectData).configurationFileName);
			makePatch(pluginInfoPlistPath);
		}

		makePatch(infoPlistPath);

		if (projectData.projectIdentifiers && projectData.projectIdentifiers.ios) {
			session.patch({
				name: "CFBundleIdentifier from package.json nativescript.id",
				read: () =>
					`<?xml version="1.0" encoding="UTF-8"?>
						<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
						<plist version="1.0">
						<dict>
							<key>CFBundleIdentifier</key>
							<string>${projectData.projectIdentifiers.ios}</string>
						</dict>
						</plist>`
			});
		}

		if (!buildOptions.release && projectData.projectIdentifiers && projectData.projectIdentifiers.ios) {
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
									<key>CFBundleTypeRole</key>
									<string>Editor</string>
									<key>CFBundleURLSchemes</key>
									<array>
										<string>${projectData.projectIdentifiers.ios.replace(/[^A-Za-z0-9]/g, "")}</string>
									</array>
								</dict>
							</array>
						</dict>
						</plist>`
			});
		}

		const plistContent = session.build();

		this.$logger.trace("Info.plist: Write to: " + this.getPlatformData(projectData).configurationFilePath);
		this.$fs.writeFile(this.getPlatformData(projectData).configurationFilePath, plistContent);
	}

	private getAllInstalledPlugins(projectData: IProjectData): Promise<IPluginData[]> {
		return (<IPluginsService>this.$injector.resolve("pluginsService")).getAllInstalledPlugins(projectData);
	}

	private replace(name: string): string {
		if (_.startsWith(name, '"')) {
			name = name.substr(1, name.length - 2);
		}

		return name.replace(/\\\"/g, "\"");
	}

	private getLibSubpathRelativeToProjectPath(targetPath: string, projectData: IProjectData): string {
		const frameworkPath = path.relative(this.getPlatformData(projectData).projectRoot, targetPath);
		return frameworkPath;
	}

	private getPbxProjPath(projectData: IProjectData): string {
		return path.join(this.$xcprojService.getXcodeprojPath(projectData, this.getPlatformData(projectData)), "project.pbxproj");
	}

	private createPbxProj(projectData: IProjectData): any {
		const project = new this.$xcode.project(this.getPbxProjPath(projectData));
		project.parseSync();

		return project;
	}

	private savePbxProj(project: any, projectData: IProjectData, omitEmptyValues?: boolean): void {
		return this.$fs.writeFile(this.getPbxProjPath(projectData), project.writeSync({ omitEmptyValues }));
	}

	public async preparePluginNativeCode(pluginData: IPluginData, projectData: IProjectData, opts?: any): Promise<void> {
		const pluginPlatformsFolderPath = pluginData.pluginPlatformsFolderPath(IOSProjectService.IOS_PLATFORM_NAME);

		const sourcePath = path.join(pluginPlatformsFolderPath, "src");
		if (this.$fs.exists(pluginPlatformsFolderPath) && this.$fs.exists(sourcePath)) {
			await this.prepareNativeSourceCode(pluginData.name, sourcePath, projectData);
		}

		await this.prepareResources(pluginPlatformsFolderPath, pluginData, projectData);
		await this.prepareFrameworks(pluginPlatformsFolderPath, pluginData, projectData);
		await this.prepareStaticLibs(pluginPlatformsFolderPath, pluginData, projectData);

		const projectRoot = this.getPlatformData(projectData).projectRoot;
		await this.$cocoapodsService.applyPodfileToProject(pluginData.name, this.$cocoapodsService.getPluginPodfilePath(pluginData), projectData, projectRoot);
	}

	public async removePluginNativeCode(pluginData: IPluginData, projectData: IProjectData): Promise<void> {
		const pluginPlatformsFolderPath = pluginData.pluginPlatformsFolderPath(IOSProjectService.IOS_PLATFORM_NAME);

		this.removeNativeSourceCode(pluginPlatformsFolderPath, pluginData, projectData);
		this.removeFrameworks(pluginPlatformsFolderPath, pluginData, projectData);
		this.removeStaticLibs(pluginPlatformsFolderPath, pluginData, projectData);
		const projectRoot = this.getPlatformData(projectData).projectRoot;

		this.$cocoapodsService.removePodfileFromProject(pluginData.name, this.$cocoapodsService.getPluginPodfilePath(pluginData), projectData, projectRoot);
	}

	public async handleNativeDependenciesChange(projectData: IProjectData, opts: IRelease): Promise<void> {
		const platformData = this.getPlatformData(projectData);
		await this.$cocoapodsService.applyPodfileFromAppResources(projectData, platformData);

		const projectPodfilePath = this.$cocoapodsService.getProjectPodfilePath(platformData.projectRoot);
		if (this.$fs.exists(projectPodfilePath)) {
			await this.$cocoapodsService.executePodInstall(platformData.projectRoot, this.$xcprojService.getXcodeprojPath(projectData, platformData));
			// The `pod install` command adds a new target to the .pbxproject. This target adds additional build phases to Xcode project.
			// Some of these phases relies on env variables (like PODS_PODFILE_DIR_PATH or PODS_ROOT).
			// These variables are produced from merge of pod's xcconfig file and project's xcconfig file.
			// So the correct order is `pod install` to be executed before merging pod's xcconfig file.
			await this.$cocoapodsService.mergePodXcconfigFile(projectData, platformData, opts);
		}

		const pbxProjPath = this.getPbxProjPath(projectData);
		this.$iOSExtensionsService.removeExtensions({ pbxProjPath });
		await this.addExtensions(projectData);
	}
	public beforePrepareAllPlugins(): Promise<void> {
		return Promise.resolve();
	}

	public async checkForChanges(changesInfo: IProjectChangesInfo, { provision, teamId }: IProjectChangesOptions, projectData: IProjectData): Promise<void> {
		const hasProvision = provision !== undefined;
		const hasTeamId = teamId !== undefined;
		if (hasProvision || hasTeamId) {
			// Check if the native project's signing is set to the provided provision...
			const pbxprojPath = this.getPbxProjPath(projectData);

			if (this.$fs.exists(pbxprojPath)) {
				const xcode = this.$pbxprojDomXcode.Xcode.open(pbxprojPath);
				const signing = xcode.getSigning(projectData.projectName);

				if (hasProvision) {
					if (signing && signing.style === "Manual") {
						for (const name in signing.configurations) {
							const config = signing.configurations[name];
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
				}
				if (hasTeamId) {
					if (signing && signing.style === "Automatic") {
						if (signing.team !== teamId) {
							const teamIdsForName = await this.$iOSProvisionService.getTeamIdsWithName(teamId);
							if (!teamIdsForName.some(id => id === signing.team)) {
								changesInfo.signingChanged = true;
							}
						}
					} else {
						// Specifying team id or name requires "Automatic" signing style.
						// If the current signing style was not "Automatic" it was probably "Manual".
						changesInfo.signingChanged = true;
					}
				}
			} else {
				changesInfo.signingChanged = true;
			}
		}
	}

	public async prebuildNativePlugin(options: IPluginBuildOptions): Promise<void> { /** */ }

	public async checkIfPluginsNeedBuild(projectData: IProjectData): Promise<Array<any>> {
		return [];
	}

	public getDeploymentTarget(projectData: IProjectData): semver.SemVer {
		const target = this.$xcconfigService.readPropertyValue(this.getBuildXCConfigFilePath(projectData), "IPHONEOS_DEPLOYMENT_TARGET");
		if (!target) {
			return null;
		}

		return semver.coerce(target);
	}

	private getAllLibsForPluginWithFileExtension(pluginData: IPluginData, fileExtension: string): string[] {
		const filterCallback = (fileName: string, pluginPlatformsFolderPath: string) => path.extname(fileName) === fileExtension;
		return this.getAllNativeLibrariesForPlugin(pluginData, IOSProjectService.IOS_PLATFORM_NAME, filterCallback);
	}

	private buildPathToCurrentXcodeProjectFile(projectData: IProjectData): string {
		return path.join(projectData.platformsDir, "ios", `${projectData.projectName}.xcodeproj`, "project.pbxproj");
	}

	private buildPathToNewXcodeProjectFile(newModulesDir: string): string {
		return path.join(newModulesDir, constants.PROJECT_FRAMEWORK_FOLDER_NAME, `${IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER}.xcodeproj`, "project.pbxproj");
	}

	private validateFramework(libraryPath: string): void {
		const infoPlistPath = path.join(libraryPath, constants.INFO_PLIST_FILE_NAME);
		if (!this.$fs.exists(infoPlistPath)) {
			this.$errors.failWithoutHelp("The bundle at %s does not contain an Info.plist file.", libraryPath);
		}

		const plistJson = this.$plistParser.parseFileSync(infoPlistPath);
		const packageType = plistJson["CFBundlePackageType"];

		if (packageType !== "FMWK") {
			this.$errors.failWithoutHelp("The bundle at %s does not appear to be a dynamic framework.", libraryPath);
		}
	}

	private replaceFileContent(file: string, projectData: IProjectData): void {
		const fileContent = this.$fs.readText(file);
		const replacedContent = helpers.stringReplaceAll(fileContent, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER, projectData.projectName);
		this.$fs.writeFile(file, replacedContent);
	}

	private replaceFileName(fileNamePart: string, fileRootLocation: string, projectData: IProjectData): void {
		const oldFileName = IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER + fileNamePart;
		const newFileName = projectData.projectName + fileNamePart;

		this.$fs.rename(path.join(fileRootLocation, oldFileName), path.join(fileRootLocation, newFileName));
	}

	private async prepareNativeSourceCode(groupName: string, sourceFolderPath: string, projectData: IProjectData): Promise<void> {
		const project = this.createPbxProj(projectData);
		const group = this.getRootGroup(groupName, sourceFolderPath);
		project.addPbxGroup(group.files, group.name, group.path, null, { isMain: true, filesRelativeToProject: true });
		project.addToHeaderSearchPaths(group.path);
		this.savePbxProj(project, projectData);
	}

	private async addExtensions(projectData: IProjectData): Promise<void> {
		const resorcesExtensionsPath = path.join(
			projectData.getAppResourcesDirectoryPath(),
			this.getPlatformData(projectData).normalizedPlatformName, constants.NATIVE_EXTENSION_FOLDER
		);
		const platformData = this.getPlatformData(projectData);
		const pbxProjPath = this.getPbxProjPath(projectData);
		const addedExtensionsFromResources = await this.$iOSExtensionsService.addExtensionsFromPath({ extensionsFolderPath: resorcesExtensionsPath, projectData, platformData, pbxProjPath });
		const plugins = await this.getAllInstalledPlugins(projectData);
		let addedExtensionsFromPlugins = false;
		for (const pluginIndex in plugins) {
			const pluginData = plugins[pluginIndex];
			const pluginPlatformsFolderPath = pluginData.pluginPlatformsFolderPath(IOSProjectService.IOS_PLATFORM_NAME);

			const extensionPath = path.join(pluginPlatformsFolderPath, constants.NATIVE_EXTENSION_FOLDER);
			const addedExtensionFromPlugin = await this.$iOSExtensionsService.addExtensionsFromPath({ extensionsFolderPath: extensionPath, projectData, platformData, pbxProjPath });
			addedExtensionsFromPlugins = addedExtensionsFromPlugins || addedExtensionFromPlugin;
		}

		if (addedExtensionsFromResources || addedExtensionsFromPlugins) {
			this.$logger.warn("The support for iOS App Extensions is currently in Beta. For more information about the current development state and any known issues, please check the relevant GitHub issue: https://github.com/NativeScript/nativescript-cli/issues/4472");
		}
	}

	private getRootGroup(name: string, rootPath: string) {
		const filePathsArr: string[] = [];
		const rootGroup: INativeSourceCodeGroup = { name: name, files: filePathsArr, path: rootPath };

		if (this.$fs.exists(rootPath)) {
			const stats = this.$fs.getFsStats(rootPath);
			if (stats.isDirectory() && !this.$fs.isEmptyDir(rootPath)) {
				this.$fs.readDirectory(rootPath).forEach(fileName => {
					const filePath = path.join(rootGroup.path, fileName);
					filePathsArr.push(filePath);
				});
			}
		}

		return rootGroup;
	}

	private async prepareResources(pluginPlatformsFolderPath: string, pluginData: IPluginData, projectData: IProjectData): Promise<void> {
		const project = this.createPbxProj(projectData);
		const resourcesPath = path.join(pluginPlatformsFolderPath, "Resources");
		if (this.$fs.exists(resourcesPath) && !this.$fs.isEmptyDir(resourcesPath)) {
			for (const fileName of this.$fs.readDirectory(resourcesPath)) {
				const filePath = path.join(resourcesPath, fileName);

				project.addResourceFile(filePath);
			}
		}
		this.savePbxProj(project, projectData);
	}
	private async prepareFrameworks(pluginPlatformsFolderPath: string, pluginData: IPluginData, projectData: IProjectData): Promise<void> {
		for (const fileName of this.getAllLibsForPluginWithFileExtension(pluginData, ".framework")) {
			await this.addFramework(path.join(pluginPlatformsFolderPath, fileName), projectData);
		}
	}

	private async prepareStaticLibs(pluginPlatformsFolderPath: string, pluginData: IPluginData, projectData: IProjectData): Promise<void> {
		for (const fileName of this.getAllLibsForPluginWithFileExtension(pluginData, ".a")) {
			await this.addStaticLibrary(path.join(pluginPlatformsFolderPath, fileName), projectData);
		}
	}

	private removeNativeSourceCode(pluginPlatformsFolderPath: string, pluginData: IPluginData, projectData: IProjectData): void {
		const project = this.createPbxProj(projectData);
		const group = this.getRootGroup(pluginData.name, pluginPlatformsFolderPath);
		project.removePbxGroup(group.name, group.path);
		project.removeFromHeaderSearchPaths(group.path);
		this.savePbxProj(project, projectData);
	}

	private removeFrameworks(pluginPlatformsFolderPath: string, pluginData: IPluginData, projectData: IProjectData): void {
		const project = this.createPbxProj(projectData);
		_.each(this.getAllLibsForPluginWithFileExtension(pluginData, ".framework"), fileName => {
			const relativeFrameworkPath = this.getLibSubpathRelativeToProjectPath(fileName, projectData);
			project.removeFramework(relativeFrameworkPath, { customFramework: true, embed: true });
		});

		this.savePbxProj(project, projectData);
	}

	private removeStaticLibs(pluginPlatformsFolderPath: string, pluginData: IPluginData, projectData: IProjectData): void {
		const project = this.createPbxProj(projectData);

		_.each(this.getAllLibsForPluginWithFileExtension(pluginData, ".a"), fileName => {
			const staticLibPath = path.join(pluginPlatformsFolderPath, fileName);
			const relativeStaticLibPath = this.getLibSubpathRelativeToProjectPath(path.basename(staticLibPath), projectData);
			project.removeFramework(relativeStaticLibPath);

			const headersSubpath = path.join("include", path.basename(staticLibPath, ".a"));
			const relativeHeaderSearchPath = path.join(this.getLibSubpathRelativeToProjectPath(headersSubpath, projectData));
			project.removeFromHeaderSearchPaths({ relativePath: relativeHeaderSearchPath });
		});

		this.savePbxProj(project, projectData);
	}

	private generateModulemap(headersFolderPath: string, libraryName: string): void {
		const headersFilter = (fileName: string, containingFolderPath: string) => (path.extname(fileName) === ".h" && this.$fs.getFsStats(path.join(containingFolderPath, fileName)).isFile());
		const headersFolderContents = this.$fs.readDirectory(headersFolderPath);
		let headers = _(headersFolderContents).filter(item => headersFilter(item, headersFolderPath)).value();

		if (!headers.length) {
			this.$fs.deleteFile(path.join(headersFolderPath, "module.modulemap"));
			return;
		}

		headers = _.map(headers, value => `header "${value}"`);

		const modulemap = `module ${libraryName} { explicit module ${libraryName} { ${headers.join(" ")} } }`;
		this.$fs.writeFile(path.join(headersFolderPath, "module.modulemap"), modulemap);
	}

	private async mergeProjectXcconfigFiles(projectData: IProjectData, opts: IRelease): Promise<void> {
		const platformData = this.getPlatformData(projectData);
		const pluginsXcconfigFilePath = this.$xcconfigService.getPluginsXcconfigFilePath(platformData.projectRoot, opts);
		this.$fs.deleteFile(pluginsXcconfigFilePath);

		const pluginsService = <IPluginsService>this.$injector.resolve("pluginsService");
		const allPlugins: IPluginData[] = await pluginsService.getAllInstalledPlugins(projectData);
		for (const plugin of allPlugins) {
			const pluginPlatformsFolderPath = plugin.pluginPlatformsFolderPath(IOSProjectService.IOS_PLATFORM_NAME);
			const pluginXcconfigFilePath = path.join(pluginPlatformsFolderPath, BUILD_XCCONFIG_FILE_NAME);
			if (this.$fs.exists(pluginXcconfigFilePath)) {
				await this.$xcconfigService.mergeFiles(pluginXcconfigFilePath, pluginsXcconfigFilePath);
			}
		}

		const appResourcesXcconfigPath = path.join(projectData.appResourcesDirectoryPath, this.getPlatformData(projectData).normalizedPlatformName, BUILD_XCCONFIG_FILE_NAME);
		if (this.$fs.exists(appResourcesXcconfigPath)) {
			await this.$xcconfigService.mergeFiles(appResourcesXcconfigPath, pluginsXcconfigFilePath);
		}

		if (!this.$fs.exists(pluginsXcconfigFilePath)) {
			// We need the pluginsXcconfig file to exist in platforms dir as it is required in the native template:
			// https://github.com/NativeScript/ios-runtime/blob/9c2b7b5f70b9bee8452b7a24aa6b646214c7d2be/build/project-template/__PROJECT_NAME__/build-debug.xcconfig#L3
			// From Xcode 10 in case the file is missing, this include fails and the build itself fails (was a warning in previous Xcode versions).
			this.$fs.writeFile(pluginsXcconfigFilePath, "");
		}

		// Set Entitlements Property to point to default file if not set explicitly by the user.
		const entitlementsPropertyValue = this.$xcconfigService.readPropertyValue(pluginsXcconfigFilePath, constants.CODE_SIGN_ENTITLEMENTS);
		if (entitlementsPropertyValue === null && this.$fs.exists(this.$iOSEntitlementsService.getPlatformsEntitlementsPath(projectData))) {
			temp.track();
			const tempEntitlementsDir = temp.mkdirSync("entitlements");
			const tempEntitlementsFilePath = path.join(tempEntitlementsDir, "set-entitlements.xcconfig");
			const entitlementsRelativePath = this.$iOSEntitlementsService.getPlatformsEntitlementsRelativePath(projectData);
			this.$fs.writeFile(tempEntitlementsFilePath, `CODE_SIGN_ENTITLEMENTS = ${entitlementsRelativePath}${EOL}`);

			await this.$xcconfigService.mergeFiles(tempEntitlementsFilePath, pluginsXcconfigFilePath);
		}
	}

	private async getXcodeVersion(): Promise<string> {
		let xcodeBuildVersion = "";

		try {
			xcodeBuildVersion = await this.$sysInfo.getXcodeVersion();
		} catch (error) {
			this.$errors.fail("xcodebuild execution failed. Make sure that you have latest Xcode and tools installed.");
		}

		const splitedXcodeBuildVersion = xcodeBuildVersion.split(".");
		xcodeBuildVersion = `${splitedXcodeBuildVersion[0] || 0}.${splitedXcodeBuildVersion[1] || 0}`;

		return xcodeBuildVersion;
	}

	private getBuildXCConfigFilePath(projectData: IProjectData): string {
		const buildXCConfig = path.join(projectData.appResourcesDirectoryPath,
			this.getPlatformData(projectData).normalizedPlatformName, BUILD_XCCONFIG_FILE_NAME);
		return buildXCConfig;
	}

	private readTeamId(projectData: IProjectData): string {
		let teamId = this.$xcconfigService.readPropertyValue(this.getBuildXCConfigFilePath(projectData), "DEVELOPMENT_TEAM");

		const fileName = path.join(this.getPlatformData(projectData).projectRoot, "teamid");
		if (this.$fs.exists(fileName)) {
			teamId = this.$fs.readText(fileName);
		}

		return teamId;
	}

	private readXCConfigProvisioningProfile(projectData: IProjectData): string {
		return this.$xcconfigService.readPropertyValue(this.getBuildXCConfigFilePath(projectData), "PROVISIONING_PROFILE");
	}

	private readXCConfigProvisioningProfileForIPhoneOs(projectData: IProjectData): string {
		return this.$xcconfigService.readPropertyValue(this.getBuildXCConfigFilePath(projectData), "PROVISIONING_PROFILE[sdk=iphoneos*]");
	}

	private readXCConfigProvisioningProfileSpecifier(projectData: IProjectData): string {
		return this.$xcconfigService.readPropertyValue(this.getBuildXCConfigFilePath(projectData), "PROVISIONING_PROFILE_SPECIFIER");
	}

	private readXCConfigProvisioningProfileSpecifierForIPhoneOs(projectData: IProjectData): string {
		return this.$xcconfigService.readPropertyValue(this.getBuildXCConfigFilePath(projectData), "PROVISIONING_PROFILE_SPECIFIER[sdk=iphoneos*]");
	}

	private async getDevelopmentTeam(projectData: IProjectData, teamId?: string): Promise<string> {
		teamId = teamId || this.readTeamId(projectData);

		if (!teamId) {
			const teams = await this.$iOSProvisionService.getDevelopmentTeams();
			this.$logger.warn("Xcode requires a team id to be specified when building for device.");
			this.$logger.warn("You can specify the team id by setting the DEVELOPMENT_TEAM setting in build.xcconfig file located in App_Resources folder of your app, or by using the --teamId option when calling run, debug or livesync commands.");
			if (teams.length === 1) {
				teamId = teams[0].id;
				this.$logger.warn("Found and using the following development team installed on your system: " + teams[0].name + " (" + teams[0].id + ")");
			} else if (teams.length > 0) {
				if (!helpers.isInteractive()) {
					this.$errors.failWithoutHelp(`Unable to determine default development team. Available development teams are: ${_.map(teams, team => team.id)}. Specify team in app/App_Resources/iOS/build.xcconfig file in the following way: DEVELOPMENT_TEAM = <team id>`);
				}

				const choices: string[] = [];
				for (const team of teams) {
					choices.push(team.name + " (" + team.id + ")");
				}
				const choice = await this.$prompter.promptForChoice('Found multiple development teams, select one:', choices);
				teamId = teams[choices.indexOf(choice)].id;

				const choicesPersist = [
					"Yes, set the DEVELOPMENT_TEAM setting in build.xcconfig file.",
					"Yes, persist the team id in platforms folder.",
					"No, don't persist this setting."
				];
				const choicePersist = await this.$prompter.promptForChoice("Do you want to make teamId: " + teamId + " a persistent choice for your app?", choicesPersist);
				switch (choicesPersist.indexOf(choicePersist)) {
					case 0:
						const xcconfigFile = path.join(projectData.appResourcesDirectoryPath, this.getPlatformData(projectData).normalizedPlatformName, BUILD_XCCONFIG_FILE_NAME);
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

		this.$logger.trace(`Selected teamId is '${teamId}'.`);

		return teamId;
	}

	private validateApplicationIdentifier(projectData: IProjectData): void {
		const infoPlistPath = path.join(projectData.appResourcesDirectoryPath, this.getPlatformData(projectData).normalizedPlatformName, this.getPlatformData(projectData).configurationFileName);
		const mergedPlistPath = this.getPlatformData(projectData).configurationFilePath;

		if (!this.$fs.exists(infoPlistPath) || !this.$fs.exists(mergedPlistPath)) {
			return;
		}

		const infoPlist = plist.parse(this.$fs.readText(infoPlistPath));
		const mergedPlist = plist.parse(this.$fs.readText(mergedPlistPath));

		if (infoPlist.CFBundleIdentifier && infoPlist.CFBundleIdentifier !== mergedPlist.CFBundleIdentifier) {
			this.$logger.warnWithLabel("The CFBundleIdentifier key inside the 'Info.plist' will be overriden by the 'id' inside 'package.json'.");
		}
	}

	private getExportOptionsMethod(projectData: IProjectData, archivePath: string): string {
		const embeddedMobileProvisionPath = path.join(archivePath, 'Products', 'Applications', `${projectData.projectName}.app`, "embedded.mobileprovision");
		const provision = mobileProvisionFinder.provision.readFromFile(embeddedMobileProvisionPath);

		return {
			"Development": "development",
			"AdHoc": "ad-hoc",
			"Distribution": "app-store",
			"Enterprise": "enterprise"
		}[provision.Type];
	}

	private hasWatchApp(projectData: IProjectData) {
		const platformData = this.getPlatformData(projectData);
		const watchAppPath = path.join(
			projectData.getAppResourcesDirectoryPath(),
			platformData.normalizedPlatformName,
			constants.IOS_WATCHAPP_FOLDER
		);

		return this.$fs.exists(watchAppPath);
	}
}

$injector.register("iOSProjectService", IOSProjectService);
