import * as path from "path";
import * as shell from "shelljs";
import * as constants from "../constants";
import { Configurations } from "../common/constants";
import * as helpers from "../common/helpers";
import * as semver from "semver";
import { format } from "util";
import { EventEmitter } from "events";
import { AppFilesUpdater } from "./app-files-updater";
import { attachAwaitDetach } from "../common/helpers";
import * as temp from "temp";
import { performanceLog } from ".././common/decorators";
temp.track();

const buildInfoFileName = ".nsbuildinfo";

export class PlatformService extends EventEmitter implements IPlatformService {
	constructor(private $devicesService: Mobile.IDevicesService,
		private $preparePlatformNativeService: IPreparePlatformService,
		private $preparePlatformJSService: IPreparePlatformService,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $doctorService: IDoctorService,
		private $packageInstallationManager: IPackageInstallationManager,
		private $platformsData: IPlatformsData,
		private $projectDataService: IProjectDataService,
		private $pluginsService: IPluginsService,
		private $projectFilesManager: IProjectFilesManager,
		private $mobileHelper: Mobile.IMobileHelper,
		private $hostInfo: IHostInfo,
		private $devicePathProvider: IDevicePathProvider,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $projectChangesService: IProjectChangesService,
		private $analyticsService: IAnalyticsService,
		private $terminalSpinnerService: ITerminalSpinnerService,
		private $pacoteService: IPacoteService,
		private $usbLiveSyncService: any,
		public $hooksService: IHooksService,
		public $workflowService: IWorkflowService
	) {
		super();
	}

	public async cleanPlatforms(platforms: string[], platformTemplate: string, projectData: IProjectData, config: IPlatformOptions, framworkPath?: string): Promise<void> {
		for (const platform of platforms) {
			const version: string = this.getCurrentPlatformVersion(platform, projectData);

			let platformWithVersion: string = platform;
			if (version !== undefined) {
				platformWithVersion += "@" + version;
			}

			await this.removePlatforms([platform], projectData);
			await this.addPlatforms([platformWithVersion], platformTemplate, projectData, config);
		}
	}

	public async addPlatforms(platforms: string[], platformTemplate: string, projectData: IProjectData, config: IPlatformOptions, frameworkPath?: string): Promise<void> {
		const platformsDir = projectData.platformsDir;
		this.$fs.ensureDirectoryExists(platformsDir);

		for (const platform of platforms) {
			this.validatePlatform(platform, projectData);
			const platformPath = path.join(projectData.platformsDir, platform);

			const isPlatformAdded = this.isPlatformAdded(platform, platformPath, projectData);
			if (isPlatformAdded) {
				this.$errors.failWithoutHelp(`Platform ${platform} already added`);
			}

			await this.addPlatform(platform.toLowerCase(), platformTemplate, projectData, config, frameworkPath);
		}
	}

	public getCurrentPlatformVersion(platform: string, projectData: IProjectData): string {
		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		const currentPlatformData: any = this.$projectDataService.getNSValue(projectData.projectDir, platformData.frameworkPackageName);
		let version: string;
		if (currentPlatformData && currentPlatformData[constants.VERSION_STRING]) {
			version = currentPlatformData[constants.VERSION_STRING];
		}

		return version;
	}

	private async addPlatform(platformParam: string, platformTemplate: string, projectData: IProjectData, config: IPlatformOptions, frameworkPath?: string, nativePrepare?: INativePrepare): Promise<void> {
		const data = platformParam.split("@");
		const platform = data[0].toLowerCase();
		let version = data[1];

		const platformData = this.$platformsData.getPlatformData(platform, projectData);

		// Log the values for project
		this.$logger.trace("Creating NativeScript project for the %s platform", platform);
		this.$logger.trace("Path: %s", platformData.projectRoot);
		this.$logger.trace("Package: %s", projectData.projectIdentifiers[platform]);
		this.$logger.trace("Name: %s", projectData.projectName);

		this.$logger.out("Copying template files...");

		let packageToInstall = "";
		if (frameworkPath) {
			packageToInstall = path.resolve(frameworkPath);
			if (!this.$fs.exists(packageToInstall)) {
				const errorMessage = format(constants.AddPlaformErrors.InvalidFrameworkPathStringFormat, frameworkPath);
				this.$errors.fail(errorMessage);
			}
		} else {
			if (!version) {
				version = this.getCurrentPlatformVersion(platform, projectData) ||
					await this.$packageInstallationManager.getLatestCompatibleVersion(platformData.frameworkPackageName);
			}

			packageToInstall = `${platformData.frameworkPackageName}@${version}`;
		}

		const spinner = this.$terminalSpinnerService.createSpinner();
		const platformPath = path.join(projectData.platformsDir, platform);
		let installedPlatformVersion;

		try {
			spinner.start();
			const downloadedPackagePath = temp.mkdirSync("runtimeDir");
			temp.track();
			await this.$pacoteService.extractPackage(packageToInstall, downloadedPackagePath);
			let frameworkDir = path.join(downloadedPackagePath, constants.PROJECT_FRAMEWORK_FOLDER_NAME);
			frameworkDir = path.resolve(frameworkDir);
			installedPlatformVersion =
				await this.addPlatformCore(platformData, frameworkDir, platformTemplate, projectData, config, nativePrepare);
		} catch (err) {
			this.$fs.deleteDirectory(platformPath);
			throw err;
		} finally {
			spinner.stop();
		}

		this.$fs.ensureDirectoryExists(platformPath);
		this.$logger.out(`Platform ${platform} successfully added. v${installedPlatformVersion}`);
	}

	private async addPlatformCore(platformData: IPlatformData, frameworkDir: string, platformTemplate: string, projectData: IProjectData, config: IPlatformOptions, nativePrepare?: INativePrepare): Promise<string> {
		const coreModuleData = this.$fs.readJson(path.join(frameworkDir, "..", "package.json"));
		const installedVersion = coreModuleData.version;

		await this.$preparePlatformJSService.addPlatform({
			platformData,
			frameworkDir,
			installedVersion,
			projectData,
			config,
			platformTemplate
		});

		if (!nativePrepare || !nativePrepare.skipNativePrepare) {
			const platformDir = path.join(projectData.platformsDir, platformData.normalizedPlatformName.toLowerCase());
			this.$fs.deleteDirectory(platformDir);
			await this.$preparePlatformNativeService.addPlatform({
				platformData,
				frameworkDir,
				installedVersion,
				projectData,
				config
			});
		}

		return installedVersion;
	}

	public getInstalledPlatforms(projectData: IProjectData): string[] {
		if (!this.$fs.exists(projectData.platformsDir)) {
			return [];
		}

		const subDirs = this.$fs.readDirectory(projectData.platformsDir);
		return _.filter(subDirs, p => this.$platformsData.platformsNames.indexOf(p) > -1);
	}

	public getAvailablePlatforms(projectData: IProjectData): string[] {
		const installedPlatforms = this.getInstalledPlatforms(projectData);
		return _.filter(this.$platformsData.platformsNames, p => {
			return installedPlatforms.indexOf(p) < 0 && this.isPlatformSupportedForOS(p, projectData); // Only those not already installed
		});
	}

	public getPreparedPlatforms(projectData: IProjectData): string[] {
		return _.filter(this.$platformsData.platformsNames, p => { return this.isPlatformPrepared(p, projectData); });
	}

	@performanceLog()
	@helpers.hook('shouldPrepare')
	public async shouldPrepare(shouldPrepareInfo: IShouldPrepareInfo): Promise<boolean> {
		shouldPrepareInfo.changesInfo = shouldPrepareInfo.changesInfo || await this.getChangesInfo(shouldPrepareInfo.platformInfo);
		const requiresNativePrepare = (!shouldPrepareInfo.platformInfo.nativePrepare || !shouldPrepareInfo.platformInfo.nativePrepare.skipNativePrepare) && shouldPrepareInfo.changesInfo.nativePlatformStatus === constants.NativePlatformStatus.requiresPrepare;

		return shouldPrepareInfo.changesInfo.hasChanges || requiresNativePrepare;
	}

	private async getChangesInfo(preparePlatformInfo: IPreparePlatformInfo): Promise<IProjectChangesInfo> {
		await this.initialPrepare(preparePlatformInfo);

		const { platform, appFilesUpdaterOptions, projectData, config, nativePrepare } = preparePlatformInfo;
		const bundle = appFilesUpdaterOptions.bundle;
		const nativePlatformStatus = (nativePrepare && nativePrepare.skipNativePrepare) ? constants.NativePlatformStatus.requiresPlatformAdd : constants.NativePlatformStatus.requiresPrepare;
		const changesInfo = await this.$projectChangesService.checkForChanges({
			platform,
			projectData,
			projectChangesOptions: {
				bundle,
				release: appFilesUpdaterOptions.release,
				provision: config.provision,
				teamId: config.teamId,
				nativePlatformStatus,
				skipModulesNativeCheck: preparePlatformInfo.skipModulesNativeCheck,
				useHotModuleReload: appFilesUpdaterOptions.useHotModuleReload
			}
		});

		this.$logger.trace("Changes info in prepare platform:", changesInfo);
		return changesInfo;
	}

	@performanceLog()
	public async preparePlatform(platformInfo: IPreparePlatformInfo): Promise<boolean> {
		await this.$workflowService.handleLegacyWorkflow({ projectDir: platformInfo.projectData.projectDir, settings: platformInfo.appFilesUpdaterOptions });
		const changesInfo = await this.getChangesInfo(platformInfo);
		const shouldPrepare = await this.shouldPrepare({ platformInfo, changesInfo });

		if (shouldPrepare) {
			// Always clear up the app directory in platforms if `--bundle` value has changed in between builds or is passed in general
			// this is done as user has full control over what goes in platforms when `--bundle` is passed
			// and we may end up with duplicate symbols which would fail the build
			if (changesInfo.bundleChanged) {
				await this.cleanDestinationApp(platformInfo);
			}

			this.$doctorService.checkForDeprecatedShortImportsInAppDir(platformInfo.projectData.projectDir);

			await this.preparePlatformCore(
				platformInfo.platform,
				platformInfo.appFilesUpdaterOptions,
				platformInfo.projectData,
				platformInfo.config,
				platformInfo.env,
				changesInfo,
				platformInfo.filesToSync,
				platformInfo.filesToRemove,
				platformInfo.nativePrepare
			);
			this.$projectChangesService.savePrepareInfo(platformInfo.platform, platformInfo.projectData);
		} else {
			this.$logger.out("Skipping prepare.");
		}

		return true;
	}

	public async validateOptions(provision: true | string, teamId: true | string, projectData: IProjectData, platform?: string, aab?: boolean): Promise<boolean> {
		if (platform && !this.$mobileHelper.isAndroidPlatform(platform) && aab) {
			this.$errors.failWithoutHelp("The --aab option is supported only for the Android platform.");
		}

		if (platform) {
			platform = this.$mobileHelper.normalizePlatformName(platform);
			this.$logger.trace("Validate options for platform: " + platform);
			const platformData = this.$platformsData.getPlatformData(platform, projectData);

			const result = await platformData.platformProjectService.validateOptions(
				projectData.projectIdentifiers[platform.toLowerCase()],
				provision,
				teamId
			);

			return result;
		} else {
			let valid = true;
			for (const availablePlatform in this.$platformsData.availablePlatforms) {
				this.$logger.trace("Validate options for platform: " + availablePlatform);
				const platformData = this.$platformsData.getPlatformData(availablePlatform, projectData);
				valid = valid && await platformData.platformProjectService.validateOptions(
					projectData.projectIdentifiers[availablePlatform.toLowerCase()],
					provision,
					teamId
				);
			}

			return valid;
		}
	}

	private async initialPrepare(preparePlatformInfo: IPreparePlatformInfo) {
		const { platform, appFilesUpdaterOptions, platformTemplate, projectData, config, nativePrepare } = preparePlatformInfo;
		this.validatePlatform(platform, projectData);

		// We need dev-dependencies here, so before-prepare hooks will be executed correctly.
		try {
			await this.$pluginsService.ensureAllDependenciesAreInstalled(projectData);
		} catch (err) {
			this.$logger.trace(err);
			this.$errors.failWithoutHelp(`Unable to install dependencies. Make sure your package.json is valid and all dependencies are correct. Error is: ${err.message}`);
		}

		await this.ensurePlatformInstalled(platform, platformTemplate, projectData, config, appFilesUpdaterOptions, nativePrepare);
	}

	/* Hooks are expected to use "filesToSync" parameter, as to give plugin authors additional information about the sync process.*/
	@performanceLog()
	@helpers.hook('prepare')
	private async preparePlatformCore(platform: string,
		appFilesUpdaterOptions: IAppFilesUpdaterOptions,
		projectData: IProjectData,
		platformSpecificData: IPlatformSpecificData,
		env: Object,
		changesInfo?: IProjectChangesInfo,
		filesToSync?: string[],
		filesToRemove?: string[],
		nativePrepare?: INativePrepare): Promise<void> {

		this.$logger.out("Preparing project...");

		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		const projectFilesConfig = helpers.getProjectFilesConfig({ isReleaseBuild: appFilesUpdaterOptions.release });
		await this.$preparePlatformJSService.preparePlatform({
			platform,
			platformData,
			projectFilesConfig,
			appFilesUpdaterOptions,
			projectData,
			platformSpecificData,
			changesInfo,
			filesToSync,
			filesToRemove,
			env
		});

		if (!nativePrepare || !nativePrepare.skipNativePrepare) {
			await this.$preparePlatformNativeService.preparePlatform({
				platform,
				platformData,
				appFilesUpdaterOptions,
				projectData,
				platformSpecificData,
				changesInfo,
				filesToSync,
				filesToRemove,
				projectFilesConfig,
				env
			});
		}

		const directoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
		const excludedDirs = [constants.APP_RESOURCES_FOLDER_NAME];
		if (!changesInfo || !changesInfo.modulesChanged) {
			excludedDirs.push(constants.TNS_MODULES_FOLDER_NAME);
		}

		this.$projectFilesManager.processPlatformSpecificFiles(directoryPath, platform, projectFilesConfig, excludedDirs);

		this.$logger.out(`Project successfully prepared (${platform})`);
	}

	public async shouldBuild(platform: string, projectData: IProjectData, buildConfig: IBuildConfig, outputPath?: string): Promise<boolean> {
		if (buildConfig.release && this.$projectChangesService.currentChanges.hasChanges) {
			return true;
		}

		if (this.$projectChangesService.currentChanges.changesRequireBuild) {
			return true;
		}

		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		outputPath = outputPath || platformData.getBuildOutputPath(buildConfig);
		if (!this.$fs.exists(outputPath)) {
			return true;
		}

		const validBuildOutputData = platformData.getValidBuildOutputData(buildConfig);
		const packages = this.getApplicationPackages(outputPath, validBuildOutputData);
		if (packages.length === 0) {
			return true;
		}

		const prepareInfo = this.$projectChangesService.getPrepareInfo(platform, projectData);
		const buildInfo = this.getBuildInfo(platform, platformData, buildConfig, outputPath);
		if (!prepareInfo || !buildInfo) {
			return true;
		}

		if (buildConfig.clean) {
			return true;
		}

		if (prepareInfo.time === buildInfo.prepareTime) {
			return false;
		}

		return prepareInfo.changesRequireBuildTime !== buildInfo.prepareTime;
	}

	@performanceLog()
	public async buildPlatform(platform: string, buildConfig: IBuildConfig, projectData: IProjectData): Promise<string> {
		this.$logger.out("Building project...");

		const action = constants.TrackActionNames.Build;
		const isForDevice = this.$mobileHelper.isAndroidPlatform(platform) ? null : buildConfig && buildConfig.buildForDevice;

		await this.$analyticsService.trackEventActionInGoogleAnalytics({
			action,
			isForDevice,
			platform,
			projectDir: projectData.projectDir,
			additionalData: `${buildConfig.release ? Configurations.Release : Configurations.Debug}_${buildConfig.clean ? constants.BuildStates.Clean : constants.BuildStates.Incremental}`
		});

		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		if (buildConfig.clean) {
			await platformData.platformProjectService.cleanProject(platformData.projectRoot, projectData);
		}

		const handler = (data: any) => {
			this.emit(constants.BUILD_OUTPUT_EVENT_NAME, data);
			this.$logger.printInfoMessageOnSameLine(data.data.toString());
		};

		await attachAwaitDetach(constants.BUILD_OUTPUT_EVENT_NAME, platformData.platformProjectService, handler, platformData.platformProjectService.buildProject(platformData.projectRoot, projectData, buildConfig));

		const buildInfoFilePath = this.getBuildOutputPath(platform, platformData, buildConfig);
		this.saveBuildInfoFile(platform, projectData.projectDir, buildInfoFilePath);

		this.$logger.out("Project successfully built.");
		return this.lastOutputPath(platform, buildConfig, projectData);
	}

	public saveBuildInfoFile(platform: string, projectDir: string, buildInfoFileDirname: string): void {
		const buildInfoFile = path.join(buildInfoFileDirname, buildInfoFileName);
		const projectData = this.$projectDataService.getProjectData(projectDir);
		const platformData = this.$platformsData.getPlatformData(platform, projectData);

		const prepareInfo = this.$projectChangesService.getPrepareInfo(platform, projectData);
		const buildInfo: IBuildInfo = {
			prepareTime: prepareInfo.changesRequireBuildTime,
			buildTime: new Date().toString()
		};

		const deploymentTarget = platformData.platformProjectService.getDeploymentTarget(projectData);
		if (deploymentTarget) {
			buildInfo.deploymentTarget = deploymentTarget.version;
		}

		this.$fs.writeJson(buildInfoFile, buildInfo);
	}

	public async shouldInstall(device: Mobile.IDevice, projectData: IProjectData, release: IRelease, outputPath?: string): Promise<boolean> {
		const platform = device.deviceInfo.platform;
		if (!(await device.applicationManager.isApplicationInstalled(projectData.projectIdentifiers[platform.toLowerCase()]))) {
			return true;
		}

		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		const deviceBuildInfo: IBuildInfo = await this.getDeviceBuildInfo(device, projectData);
		const localBuildInfo = this.getBuildInfo(platform, platformData, { buildForDevice: !device.isEmulator, release: release.release }, outputPath);

		return !localBuildInfo || !deviceBuildInfo || deviceBuildInfo.buildTime !== localBuildInfo.buildTime;
	}

	public async validateInstall(device: Mobile.IDevice, projectData: IProjectData, release: IRelease, outputPath?: string): Promise<void> {
		const platform = device.deviceInfo.platform;
		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		const localBuildInfo = this.getBuildInfo(device.deviceInfo.platform, platformData, { buildForDevice: !device.isEmulator, release: release.release }, outputPath);
		if (localBuildInfo.deploymentTarget) {
			if (semver.lt(semver.coerce(device.deviceInfo.version), semver.coerce(localBuildInfo.deploymentTarget))) {
				this.$errors.fail(`Unable to install on device with version ${device.deviceInfo.version} as deployment target is ${localBuildInfo.deploymentTarget}`);
			}
		}
	}

	public async installApplication(device: Mobile.IDevice, buildConfig: IBuildConfig, projectData: IProjectData, packageFile?: string, outputFilePath?: string): Promise<void> {
		this.$logger.out(`Installing on device ${device.deviceInfo.identifier}...`);

		await this.$analyticsService.trackEventActionInGoogleAnalytics({
			action: constants.TrackActionNames.Deploy,
			device,
			projectDir: projectData.projectDir
		});

		const platformData = this.$platformsData.getPlatformData(device.deviceInfo.platform, projectData);
		if (!packageFile) {
			if (this.$devicesService.isiOSSimulator(device)) {
				packageFile = this.getLatestApplicationPackageForEmulator(platformData, buildConfig, outputFilePath).packageName;
			} else {
				packageFile = this.getLatestApplicationPackageForDevice(platformData, buildConfig, outputFilePath).packageName;
			}
		}

		await platformData.platformProjectService.cleanDeviceTempFolder(device.deviceInfo.identifier, projectData);

		const platform = device.deviceInfo.platform.toLowerCase();
		await device.applicationManager.reinstallApplication(projectData.projectIdentifiers[platform], packageFile);

		await this.updateHashesOnDevice({
			device,
			appIdentifier: projectData.projectIdentifiers[platform],
			outputFilePath,
			platformData
		});

		if (!buildConfig.release) {
			const deviceFilePath = await this.getDeviceBuildInfoFilePath(device, projectData);
			const options = buildConfig;
			options.buildForDevice = !device.isEmulator;
			const buildInfoFilePath = outputFilePath || this.getBuildOutputPath(device.deviceInfo.platform, platformData, buildConfig);
			const appIdentifier = projectData.projectIdentifiers[platform];

			await device.fileSystem.putFile(path.join(buildInfoFilePath, buildInfoFileName), deviceFilePath, appIdentifier);
		}

		this.$logger.out(`Successfully installed on device with identifier '${device.deviceInfo.identifier}'.`);
	}

	private async updateHashesOnDevice(data: { device: Mobile.IDevice, appIdentifier: string, outputFilePath: string, platformData: IPlatformData }): Promise<void> {
		const { device, appIdentifier, platformData, outputFilePath } = data;

		if (!this.$mobileHelper.isAndroidPlatform(platformData.normalizedPlatformName)) {
			return;
		}

		let hashes = {};
		const hashesFilePath = path.join(outputFilePath || platformData.getBuildOutputPath(null), constants.HASHES_FILE_NAME);
		if (this.$fs.exists(hashesFilePath)) {
			hashes = this.$fs.readJson(hashesFilePath);
		}

		await device.fileSystem.updateHashesOnDevice(hashes, appIdentifier);
	}

	public async deployPlatform(deployInfo: IDeployPlatformInfo): Promise<void> {
		await this.preparePlatform({
			platform: deployInfo.platform,
			appFilesUpdaterOptions: deployInfo.appFilesUpdaterOptions,
			platformTemplate: deployInfo.deployOptions.platformTemplate,
			projectData: deployInfo.projectData,
			config: deployInfo.config,
			nativePrepare: deployInfo.nativePrepare,
			env: deployInfo.env
		});
		const options: Mobile.IDevicesServicesInitializationOptions = {
			platform: deployInfo.platform, deviceId: deployInfo.deployOptions.device, emulator: deployInfo.deployOptions.emulator
		};
		await this.$devicesService.initialize(options);
		const action = async (device: Mobile.IDevice): Promise<void> => {
			const buildConfig: IBuildConfig = {
				buildForDevice: !this.$devicesService.isiOSSimulator(device),
				iCloudContainerEnvironment: null,
				projectDir: deployInfo.deployOptions.projectDir,
				release: deployInfo.deployOptions.release,
				device: deployInfo.deployOptions.device,
				provision: deployInfo.deployOptions.provision,
				teamId: deployInfo.deployOptions.teamId,
				keyStoreAlias: deployInfo.deployOptions.keyStoreAlias,
				keyStoreAliasPassword: deployInfo.deployOptions.keyStoreAliasPassword,
				keyStorePassword: deployInfo.deployOptions.keyStorePassword,
				keyStorePath: deployInfo.deployOptions.keyStorePath,
				clean: deployInfo.deployOptions.clean
			};

			let installPackageFile: string;
			const shouldBuild = await this.shouldBuild(deployInfo.platform, deployInfo.projectData, buildConfig, deployInfo.outputPath);
			if (shouldBuild) {
				installPackageFile = await deployInfo.buildPlatform(deployInfo.platform, buildConfig, deployInfo.projectData);
			} else {
				this.$logger.out("Skipping package build. No changes detected on the native side. This will be fast!");
			}

			if (deployInfo.deployOptions.forceInstall || shouldBuild || (await this.shouldInstall(device, deployInfo.projectData, buildConfig))) {
				await this.installApplication(device, buildConfig, deployInfo.projectData, installPackageFile, deployInfo.outputPath);
			} else {
				this.$logger.out("Skipping install.");
			}

		};

		if (deployInfo.deployOptions.device) {
			const device = await this.$devicesService.getDevice(deployInfo.deployOptions.device);
			deployInfo.deployOptions.device = device.deviceInfo.identifier;
		}

		await this.$devicesService.execute(action, this.getCanExecuteAction(deployInfo.platform, deployInfo.deployOptions));
	}

	public async startApplication(platform: string, runOptions: IRunPlatformOptions, appData: Mobile.IStartApplicationData): Promise<void> {
		this.$logger.out("Starting...");

		const action = async (device: Mobile.IDevice) => {
			await device.applicationManager.startApplication(appData);
			this.$logger.out(`Successfully started on device with identifier '${device.deviceInfo.identifier}'.`);
		};

		await this.$devicesService.initialize({ platform: platform, deviceId: runOptions.device });

		if (runOptions.device) {
			const device = await this.$devicesService.getDevice(runOptions.device);
			runOptions.device = device.deviceInfo.identifier;
		}

		await this.$devicesService.execute(action, this.getCanExecuteAction(platform, runOptions));
	}

	private getBuildOutputPath(platform: string, platformData: IPlatformData, options: IBuildOutputOptions): string {
		if (options.androidBundle) {
			return platformData.bundleBuildOutputPath;
		}

		if (platform.toLowerCase() === this.$devicePlatformsConstants.iOS.toLowerCase()) {
			return platformData.getBuildOutputPath(options);
		}

		return platformData.getBuildOutputPath(options);
	}

	private async getDeviceBuildInfoFilePath(device: Mobile.IDevice, projectData: IProjectData): Promise<string> {
		const platform = device.deviceInfo.platform.toLowerCase();
		const deviceRootPath = await this.$devicePathProvider.getDeviceProjectRootPath(device, {
			appIdentifier: projectData.projectIdentifiers[platform],
			getDirname: true
		});
		return helpers.fromWindowsRelativePathToUnix(path.join(deviceRootPath, buildInfoFileName));
	}

	private async getDeviceBuildInfo(device: Mobile.IDevice, projectData: IProjectData): Promise<IBuildInfo> {
		const deviceFilePath = await this.getDeviceBuildInfoFilePath(device, projectData);
		try {
			return JSON.parse(await this.readFile(device, deviceFilePath, projectData));
		} catch (e) {
			return null;
		}
	}

	private getBuildInfo(platform: string, platformData: IPlatformData, options: IBuildOutputOptions, buildOutputPath?: string): IBuildInfo {
		buildOutputPath = buildOutputPath || this.getBuildOutputPath(platform, platformData, options);
		const buildInfoFile = path.join(buildOutputPath, buildInfoFileName);
		if (this.$fs.exists(buildInfoFile)) {
			try {
				const buildInfoTime = this.$fs.readJson(buildInfoFile);
				return buildInfoTime;
			} catch (e) {
				return null;
			}
		}

		return null;
	}

	@helpers.hook('cleanApp')
	public async cleanDestinationApp(platformInfo: IPreparePlatformInfo): Promise<void> {
		await this.ensurePlatformInstalled(platformInfo.platform, platformInfo.platformTemplate, platformInfo.projectData, platformInfo.config, platformInfo.appFilesUpdaterOptions, platformInfo.nativePrepare);

		const platformData = this.$platformsData.getPlatformData(platformInfo.platform, platformInfo.projectData);
		const appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
		const appUpdater = new AppFilesUpdater(platformInfo.projectData.appDirectoryPath, appDestinationDirectoryPath, platformInfo.appFilesUpdaterOptions, this.$fs);
		appUpdater.cleanDestinationApp();
	}

	public lastOutputPath(platform: string, buildConfig: IBuildConfig, projectData: IProjectData, outputPath?: string): string {
		let packageFile: string;
		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		if (buildConfig.buildForDevice) {
			packageFile = this.getLatestApplicationPackageForDevice(platformData, buildConfig, outputPath).packageName;
		} else {
			packageFile = this.getLatestApplicationPackageForEmulator(platformData, buildConfig, outputPath).packageName;
		}
		if (!packageFile || !this.$fs.exists(packageFile)) {
			this.$errors.failWithoutHelp("Unable to find built application. Try 'tns build %s'.", platform);
		}
		return packageFile;
	}

	public copyLastOutput(platform: string, targetPath: string, buildConfig: IBuildConfig, projectData: IProjectData): void {
		platform = platform.toLowerCase();
		targetPath = path.resolve(targetPath);

		const packageFile = this.lastOutputPath(platform, buildConfig, projectData);

		this.$fs.ensureDirectoryExists(path.dirname(targetPath));

		if (this.$fs.exists(targetPath) && this.$fs.getFsStats(targetPath).isDirectory()) {
			const sourceFileName = path.basename(packageFile);
			this.$logger.trace(`Specified target path: '${targetPath}' is directory. Same filename will be used: '${sourceFileName}'.`);
			targetPath = path.join(targetPath, sourceFileName);
		}
		this.$fs.copyFile(packageFile, targetPath);
		this.$logger.info(`Copied file '${packageFile}' to '${targetPath}'.`);
	}

	public async removePlatforms(platforms: string[], projectData: IProjectData): Promise<void> {
		for (const platform of platforms) {
			this.validatePlatformInstalled(platform, projectData);
			const platformData = this.$platformsData.getPlatformData(platform, projectData);
			let gradleErrorMessage;

			try {
				await platformData.platformProjectService.stopServices(platformData.projectRoot);
			} catch (err) {
				gradleErrorMessage = err.message;
			}

			try {
				const platformDir = path.join(projectData.platformsDir, platform.toLowerCase());
				this.$fs.deleteDirectory(platformDir);
				this.$projectDataService.removeNSProperty(projectData.projectDir, platformData.frameworkPackageName);

				this.$logger.out(`Platform ${platform} successfully removed.`);
			} catch (err) {
				this.$logger.error(`Failed to remove ${platform} platform with errors:`);
				if (gradleErrorMessage) {
					this.$logger.error(gradleErrorMessage);
				}
				this.$errors.failWithoutHelp(err.message);
			}
		}
	}

	public async updatePlatforms(platforms: string[], platformTemplate: string, projectData: IProjectData, config: IPlatformOptions): Promise<void> {
		for (const platformParam of platforms) {
			const data = platformParam.split("@"),
				platform = data[0],
				version = data[1];

			if (this.hasPlatformDirectory(platform, projectData)) {
				await this.updatePlatform(platform, version, platformTemplate, projectData, config);
			} else {
				await this.addPlatform(platformParam, platformTemplate, projectData, config);
			}
		}
	}

	private getCanExecuteAction(platform: string, options: IDeviceEmulator): any {
		const canExecute = (currentDevice: Mobile.IDevice): boolean => {
			if (options.device && currentDevice && currentDevice.deviceInfo) {
				return currentDevice.deviceInfo.identifier === options.device;
			}

			if (this.$mobileHelper.isiOSPlatform(platform) && this.$hostInfo.isDarwin) {
				if (this.$devicesService.isOnlyiOSSimultorRunning() || options.emulator || this.$devicesService.isiOSSimulator(currentDevice)) {
					return true;
				}

				return this.$devicesService.isiOSDevice(currentDevice);
			}

			return true;
		};

		return canExecute;
	}

	public validatePlatform(platform: string, projectData: IProjectData): void {
		if (!platform) {
			this.$errors.fail("No platform specified.");
		}

		platform = platform.split("@")[0].toLowerCase();

		if (!this.isValidPlatform(platform, projectData)) {
			this.$errors.fail("Invalid platform %s. Valid platforms are %s.", platform, helpers.formatListOfNames(this.$platformsData.platformsNames));
		}
	}

	public validatePlatformInstalled(platform: string, projectData: IProjectData): void {
		this.validatePlatform(platform, projectData);

		if (!this.hasPlatformDirectory(platform, projectData)) {
			this.$errors.fail("The platform %s is not added to this project. Please use 'tns platform add <platform>'", platform);
		}
	}

	public async ensurePlatformInstalled(platform: string, platformTemplate: string, projectData: IProjectData, config: IPlatformOptions, appFilesUpdaterOptions: IAppFilesUpdaterOptions, nativePrepare?: INativePrepare): Promise<void> {
		let requiresNativePlatformAdd = false;

		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		const prepareInfo = this.$projectChangesService.getPrepareInfo(platform, projectData);

		// In case when no platform is added and webpack plugin is started it produces files in platforms folder.
		// In this case {N} CLI needs to add platform and keeps the already produced files from webpack
		const shouldPersistWebpackFiles = this.shouldPersistWebpackFiles(platform, projectData, prepareInfo, appFilesUpdaterOptions, nativePrepare);
		if (shouldPersistWebpackFiles) {
			await this.persistWebpackFiles(platform, platformTemplate, projectData, config, platformData, nativePrepare);
			return;
		}

		const hasPlatformDirectory = this.hasPlatformDirectory(platform, projectData);
		if (hasPlatformDirectory) {
			const shouldAddNativePlatform = !nativePrepare || !nativePrepare.skipNativePrepare;
			// In case there's no prepare info, it means only platform add had been executed. So we've come from CLI and we do not need to prepare natively.
			requiresNativePlatformAdd = prepareInfo && prepareInfo.nativePlatformStatus === constants.NativePlatformStatus.requiresPlatformAdd;
			if (requiresNativePlatformAdd && shouldAddNativePlatform) {
				await this.addPlatform(platform, platformTemplate, projectData, config, "", nativePrepare);
			}
		} else {
			await this.addPlatform(platform, platformTemplate, projectData, config, "", nativePrepare);
		}
	}

	private shouldPersistWebpackFiles(platform: string, projectData: IProjectData, prepareInfo: IPrepareInfo, appFilesUpdaterOptions: IAppFilesUpdaterOptions, nativePrepare: INativePrepare): boolean {
		const hasPlatformDirectory = this.hasPlatformDirectory(platform, projectData);
		const isWebpackWatcherStarted = this.$usbLiveSyncService.isInitialized;
		const hasNativePlatformStatus = prepareInfo && prepareInfo.nativePlatformStatus;
		const requiresPlatformAdd = prepareInfo && prepareInfo.nativePlatformStatus === constants.NativePlatformStatus.requiresPlatformAdd;
		const shouldAddNativePlatform = !nativePrepare || !nativePrepare.skipNativePrepare;
		const shouldAddPlatform = !hasNativePlatformStatus || (requiresPlatformAdd && shouldAddNativePlatform);
		const result = appFilesUpdaterOptions.bundle && isWebpackWatcherStarted && hasPlatformDirectory && shouldAddPlatform;
		return result;
	}

	private async persistWebpackFiles(platform: string, platformTemplate: string, projectData: IProjectData, config: IPlatformOptions, platformData: IPlatformData, nativePrepare?: INativePrepare): Promise<void> {
		const tmpDirectoryPath = path.join(projectData.projectDir, "platforms", `tmp-${platform}`);
		this.$fs.deleteDirectory(tmpDirectoryPath);
		this.$fs.ensureDirectoryExists(tmpDirectoryPath);
		this.$fs.copyFile(path.join(platformData.appDestinationDirectoryPath, "*"), tmpDirectoryPath);
		await this.addPlatform(platform, platformTemplate, projectData, config, "", nativePrepare);
		this.$fs.copyFile(path.join(tmpDirectoryPath, "*"), platformData.appDestinationDirectoryPath);
		this.$fs.deleteDirectory(tmpDirectoryPath);
	}

	private hasPlatformDirectory(platform: string, projectData: IProjectData): boolean {
		return this.$fs.exists(path.join(projectData.platformsDir, platform.toLowerCase()));
	}

	private isValidPlatform(platform: string, projectData: IProjectData) {
		return this.$platformsData.getPlatformData(platform, projectData);
	}

	public isPlatformSupportedForOS(platform: string, projectData: IProjectData): boolean {
		const targetedOS = this.$platformsData.getPlatformData(platform, projectData).targetedOS;
		const res = !targetedOS || targetedOS.indexOf("*") >= 0 || targetedOS.indexOf(process.platform) >= 0;
		return res;
	}

	private isPlatformPrepared(platform: string, projectData: IProjectData): boolean {
		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		return platformData.platformProjectService.isPlatformPrepared(platformData.projectRoot, projectData);
	}

	private getApplicationPackages(buildOutputPath: string, validBuildOutputData: IValidBuildOutputData): IApplicationPackage[] {
		// Get latest package` that is produced from build
		let result = this.getApplicationPackagesCore(this.$fs.readDirectory(buildOutputPath).map(filename => path.join(buildOutputPath, filename)), validBuildOutputData.packageNames);
		if (result) {
			return result;
		}

		const candidates = this.$fs.enumerateFilesInDirectorySync(buildOutputPath);
		result = this.getApplicationPackagesCore(candidates, validBuildOutputData.packageNames);
		if (result) {
			return result;
		}

		if (validBuildOutputData.regexes && validBuildOutputData.regexes.length) {
			return this.createApplicationPackages(candidates.filter(filepath => _.some(validBuildOutputData.regexes, regex => regex.test(path.basename(filepath)))));
		}

		return [];
	}

	private getApplicationPackagesCore(candidates: string[], validPackageNames: string[]): IApplicationPackage[] {
		const packages = candidates.filter(filePath => _.includes(validPackageNames, path.basename(filePath)));
		if (packages.length > 0) {
			return this.createApplicationPackages(packages);
		}

		return null;
	}

	private createApplicationPackages(packages: string[]): IApplicationPackage[] {
		return packages.map(filepath => this.createApplicationPackage(filepath));
	}

	private createApplicationPackage(packageName: string): IApplicationPackage {
		return {
			packageName,
			time: this.$fs.getFsStats(packageName).mtime
		};
	}

	private getLatestApplicationPackage(buildOutputPath: string, validBuildOutputData: IValidBuildOutputData): IApplicationPackage {
		let packages = this.getApplicationPackages(buildOutputPath, validBuildOutputData);
		const packageExtName = path.extname(validBuildOutputData.packageNames[0]);
		if (packages.length === 0) {
			this.$errors.fail(`No ${packageExtName} found in ${buildOutputPath} directory.`);
		}

		if (packages.length > 1) {
			this.$logger.warn(`More than one ${packageExtName} found in ${buildOutputPath} directory. Using the last one produced from build.`);
		}

		packages = _.sortBy(packages, pkg => pkg.time).reverse(); // We need to reverse because sortBy always sorts in ascending order

		return packages[0];
	}

	public getLatestApplicationPackageForDevice(platformData: IPlatformData, buildConfig: IBuildConfig, outputPath?: string): IApplicationPackage {
		return this.getLatestApplicationPackage(outputPath || platformData.getBuildOutputPath(buildConfig), platformData.getValidBuildOutputData({ buildForDevice: true, release: buildConfig.release, androidBundle: buildConfig.androidBundle }));
	}

	public getLatestApplicationPackageForEmulator(platformData: IPlatformData, buildConfig: IBuildConfig, outputPath?: string): IApplicationPackage {
		outputPath = outputPath || this.getBuildOutputPath(platformData.normalizedPlatformName.toLowerCase(), platformData, buildConfig);
		const buildOutputOptions: IBuildOutputOptions = { buildForDevice: false, release: buildConfig.release, androidBundle: buildConfig.androidBundle };
		return this.getLatestApplicationPackage(outputPath || platformData.getBuildOutputPath(buildConfig), platformData.getValidBuildOutputData(buildOutputOptions));
	}

	private async updatePlatform(platform: string, version: string, platformTemplate: string, projectData: IProjectData, config: IPlatformOptions): Promise<void> {
		const platformData = this.$platformsData.getPlatformData(platform, projectData);

		const data = this.$projectDataService.getNSValue(projectData.projectDir, platformData.frameworkPackageName);
		const currentVersion = data && data.version ? data.version : "0.2.0";

		const installedModuleDir = temp.mkdirSync("runtime-to-update");
		let newVersion = version === constants.PackageVersion.NEXT ?
			await this.$packageInstallationManager.getNextVersion(platformData.frameworkPackageName) :
			version || await this.$packageInstallationManager.getLatestCompatibleVersion(platformData.frameworkPackageName);
		await this.$pacoteService.extractPackage(`${platformData.frameworkPackageName}@${newVersion}`, installedModuleDir);
		const cachedPackageData = this.$fs.readJson(path.join(installedModuleDir, "package.json"));
		newVersion = (cachedPackageData && cachedPackageData.version) || newVersion;

		const canUpdate = platformData.platformProjectService.canUpdatePlatform(installedModuleDir, projectData);
		if (canUpdate) {
			if (!semver.valid(newVersion)) {
				this.$errors.fail("The version %s is not valid. The version should consists from 3 parts separated by dot.", newVersion);
			}

			if (!semver.gt(currentVersion, newVersion)) {
				await this.updatePlatformCore(platformData, { currentVersion, newVersion, canUpdate, platformTemplate }, projectData, config);
			} else if (semver.eq(currentVersion, newVersion)) {
				this.$errors.fail("Current and new version are the same.");
			} else {
				this.$errors.fail(`Your current version: ${currentVersion} is higher than the one you're trying to install ${newVersion}.`);
			}
		} else {
			this.$errors.failWithoutHelp("Native Platform cannot be updated.");
		}
	}

	private async updatePlatformCore(platformData: IPlatformData, updateOptions: IUpdatePlatformOptions, projectData: IProjectData, config: IPlatformOptions): Promise<void> {
		let packageName = platformData.normalizedPlatformName.toLowerCase();
		await this.removePlatforms([packageName], projectData);
		packageName = updateOptions.newVersion ? `${packageName}@${updateOptions.newVersion}` : packageName;
		await this.addPlatform(packageName, updateOptions.platformTemplate, projectData, config);
		this.$logger.out("Successfully updated to version ", updateOptions.newVersion);
	}

	// TODO: Remove this method from here. It has nothing to do with platform
	public async readFile(device: Mobile.IDevice, deviceFilePath: string, projectData: IProjectData): Promise<string> {
		temp.track();
		const uniqueFilePath = temp.path({ suffix: ".tmp" });
		const platform = device.deviceInfo.platform.toLowerCase();
		try {
			await device.fileSystem.getFile(deviceFilePath, projectData.projectIdentifiers[platform], uniqueFilePath);
		} catch (e) {
			return null;
		}

		if (this.$fs.exists(uniqueFilePath)) {
			const text = this.$fs.readText(uniqueFilePath);
			shell.rm(uniqueFilePath);
			return text;
		}

		return null;
	}

	private isPlatformAdded(platform: string, platformPath: string, projectData: IProjectData): boolean {
		if (!this.$fs.exists(platformPath)) {
			return false;
		}

		const prepareInfo = this.$projectChangesService.getPrepareInfo(platform, projectData);
		if (!prepareInfo) {
			return true;
		}

		return prepareInfo.nativePlatformStatus !== constants.NativePlatformStatus.requiresPlatformAdd;
	}
}

$injector.register("platformService", PlatformService);
