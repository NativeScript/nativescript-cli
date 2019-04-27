import * as path from "path";
import * as shell from "shelljs";
import * as constants from "../constants";
import { Configurations } from "../common/constants";
import * as helpers from "../common/helpers";
import * as semver from "semver";
import { EventEmitter } from "events";
import { attachAwaitDetach } from "../common/helpers";
import * as temp from "temp";
import { performanceLog } from ".././common/decorators";
temp.track();

const buildInfoFileName = ".nsbuildinfo";

export class PlatformService extends EventEmitter implements IPlatformService {
	constructor(private $devicesService: Mobile.IDevicesService,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $platformsData: IPlatformsData,
		private $projectDataService: IProjectDataService,
		private $webpackCompilerService: IWebpackCompilerService,
		// private $platformJSService: IPreparePlatformService,
		private $platformNativeService: IPreparePlatformService,
		private $mobileHelper: Mobile.IMobileHelper,
		private $hostInfo: IHostInfo,
		private $devicePathProvider: IDevicePathProvider,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $projectChangesService: IProjectChangesService,
		private $analyticsService: IAnalyticsService,
		public $hooksService: IHooksService,
	) { super(); }

	public getCurrentPlatformVersion(platform: string, projectData: IProjectData): string {
		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		const currentPlatformData: any = this.$projectDataService.getNSValue(projectData.projectDir, platformData.frameworkPackageName);
		const version = currentPlatformData && currentPlatformData.version;

		return version;
	}

	@performanceLog()
	public async preparePlatform(platformData: IPlatformData, projectData: IProjectData, preparePlatformData: IPreparePlatformData): Promise<boolean> {
		this.$logger.out("Preparing project...");

		await this.$webpackCompilerService.compile(platformData, projectData, { watch: false, env: preparePlatformData.env });
		await this.$platformNativeService.preparePlatform(platformData, projectData, preparePlatformData);

		this.$projectChangesService.savePrepareInfo(platformData.platformNameLowerCase, projectData);

		this.$logger.out(`Project successfully prepared (${platformData.platformNameLowerCase})`);

		return true;
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
		// TODO: Refactor deploy platform command
		// await this.preparePlatform({
		// 	platform: deployInfo.platform,
		// 	appFilesUpdaterOptions: deployInfo.appFilesUpdaterOptions,
		// 	projectData: deployInfo.projectData,
		// 	config: deployInfo.config,
		// 	nativePrepare: deployInfo.nativePrepare,
		// 	env: deployInfo.env,
		// 	webpackCompilerConfig: {
		// 		watch: false,
		// 		env: deployInfo.env
		// 	}
		// });
		const options: Mobile.IDevicesServicesInitializationOptions = {
			platform: deployInfo.platform,
			deviceId: deployInfo.deployOptions.device,
			emulator: deployInfo.deployOptions.emulator
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

		if (!this.$platformsData.getPlatformData(platform, projectData)) {
			this.$errors.fail("Invalid platform %s. Valid platforms are %s.", platform, helpers.formatListOfNames(this.$platformsData.platformsNames));
		}
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
}

$injector.register("platformService", PlatformService);
