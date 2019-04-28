import * as constants from "../../constants";
import * as helpers from "../../common/helpers";
import * as path from "path";
import * as shell from "shelljs";
import * as temp from "temp";

// TODO: Extract it as common constant for this service and platform-build-service.ts
const buildInfoFileName = ".nsbuildinfo";

export class DeviceWorkflowService implements IDeviceWorkflowService {
	constructor(
		private $analyticsService: IAnalyticsService,
		private $devicePathProvider: IDevicePathProvider,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $mobileHelper: Mobile.IMobileHelper,
		private $platformBuildService: IPlatformBuildService
	) { }

	// TODO: Extract this method to device-installation-service
	public async installOnDevice(device: Mobile.IDevice, platformData: IPlatformData, projectData: IProjectData, buildConfig: IBuildConfig, packageFile?: string, outputFilePath?: string): Promise<void> {
		this.$logger.out(`Installing on device ${device.deviceInfo.identifier}...`);

		await this.$analyticsService.trackEventActionInGoogleAnalytics({
			action: constants.TrackActionNames.Deploy,
			device,
			projectDir: projectData.projectDir
		});

		// TODO: Get latest built applicationPackage when no applicationPackage is provided
		// const packageFile = applicationPackage.packageName;
		// const outputFilePath = applicationPackage.packagePath;

		// if (!packageFile) {
		// 	if (this.$devicesService.isiOSSimulator(device)) {
		// 		packageFile = this.getLatestApplicationPackageForEmulator(platformData, buildConfig, outputFilePath).packageName;
		// 	} else {
		// 		packageFile = this.getLatestApplicationPackageForDevice(platformData, buildConfig, outputFilePath).packageName;
		// 	}
		// }

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
			const buildInfoFilePath = outputFilePath || platformData.getBuildOutputPath(buildConfig);
			const appIdentifier = projectData.projectIdentifiers[platform];

			await device.fileSystem.putFile(path.join(buildInfoFilePath, buildInfoFileName), deviceFilePath, appIdentifier);
		}

		this.$logger.out(`Successfully installed on device with identifier '${device.deviceInfo.identifier}'.`);
	}

	public async installOnDeviceIfNeeded(device: Mobile.IDevice, platformData: IPlatformData, projectData: IProjectData, buildConfig: IBuildConfig, packageFile?: string, outputFilePath?: string): Promise<void> {
		const shouldInstall = await this.shouldInstall(device, platformData, projectData, buildConfig);
		if (shouldInstall) {
			await this.installOnDevice(device, platformData, projectData, buildConfig, packageFile, outputFilePath);
		}
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

	private async getDeviceBuildInfoFilePath(device: Mobile.IDevice, projectData: IProjectData): Promise<string> {
		const platform = device.deviceInfo.platform.toLowerCase();
		const deviceRootPath = await this.$devicePathProvider.getDeviceProjectRootPath(device, {
			appIdentifier: projectData.projectIdentifiers[platform],
			getDirname: true
		});
		return helpers.fromWindowsRelativePathToUnix(path.join(deviceRootPath, buildInfoFileName));
	}

	private async shouldInstall(device: Mobile.IDevice, platformData: IPlatformData, projectData: IProjectData, release: IRelease, outputPath?: string): Promise<boolean> {
		const platform = device.deviceInfo.platform;
		if (!(await device.applicationManager.isApplicationInstalled(projectData.projectIdentifiers[platform.toLowerCase()]))) {
			return true;
		}

		const deviceBuildInfo: IBuildInfo = await this.getDeviceBuildInfo(device, projectData);
		const localBuildInfo = this.$platformBuildService.getBuildInfoFromFile(platformData, <any>{ buildForDevice: !device.isEmulator, release: release.release }, outputPath);

		return !localBuildInfo || !deviceBuildInfo || deviceBuildInfo.buildTime !== localBuildInfo.buildTime;
	}

	private async getDeviceBuildInfo(device: Mobile.IDevice, projectData: IProjectData): Promise<IBuildInfo> {
		const deviceFilePath = await this.getDeviceBuildInfoFilePath(device, projectData);
		try {
			return JSON.parse(await this.readFile(device, deviceFilePath, projectData));
		} catch (e) {
			return null;
		}
	}

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
$injector.register("deviceWorkflowService", DeviceWorkflowService);
