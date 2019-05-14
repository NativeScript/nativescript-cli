import { TrackActionNames, HASHES_FILE_NAME } from "../../constants";
import { BuildArtefactsService } from "../build-artefacts-service";
import { BuildInfoFileService } from "../build-info-file-service";
import { MobileHelper } from "../../common/mobile/mobile-helper";
import * as helpers from "../../common/helpers";
import * as path from "path";
import { BuildData } from "../../data/build-data";

const buildInfoFileName = ".nsbuildinfo";

export class DeviceInstallAppService {
	constructor(
		private $analyticsService: IAnalyticsService,
		private $buildArtefactsService: BuildArtefactsService,
		private $devicePathProvider: IDevicePathProvider,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $mobileHelper: MobileHelper,
		private $buildInfoFileService: BuildInfoFileService,
		private $projectDataService: IProjectDataService,
		private $platformsData: IPlatformsData
	) { }

	public async installOnDevice(device: Mobile.IDevice, buildData: BuildData, packageFile?: string): Promise<void> {
		this.$logger.out(`Installing on device ${device.deviceInfo.identifier}...`);

		const projectData = this.$projectDataService.getProjectData(buildData.projectDir);
		const platformData = this.$platformsData.getPlatformData(device.deviceInfo.platform, projectData);

		await this.$analyticsService.trackEventActionInGoogleAnalytics({
			action: TrackActionNames.Deploy,
			device,
			projectDir: projectData.projectDir
		});

		if (!packageFile) {
			packageFile = await this.$buildArtefactsService.getLatestApplicationPackagePath(platformData, buildData);
		}

		await platformData.platformProjectService.cleanDeviceTempFolder(device.deviceInfo.identifier, projectData);

		const platform = device.deviceInfo.platform.toLowerCase();
		await device.applicationManager.reinstallApplication(projectData.projectIdentifiers[platform], packageFile);

		const outputFilePath = buildData.outputPath;

		await this.updateHashesOnDevice({
			device,
			appIdentifier: projectData.projectIdentifiers[platform],
			outputFilePath,
			platformData
		});

		if (!buildData.release) {
			const deviceFilePath = await this.getDeviceBuildInfoFilePath(device, projectData);
			const options = buildData;
			options.buildForDevice = !device.isEmulator;
			const buildInfoFilePath = outputFilePath || platformData.getBuildOutputPath(buildData);
			const appIdentifier = projectData.projectIdentifiers[platform];

			await device.fileSystem.putFile(path.join(buildInfoFilePath, buildInfoFileName), deviceFilePath, appIdentifier);
		}

		this.$logger.out(`Successfully installed on device with identifier '${device.deviceInfo.identifier}'.`);
	}

	public async installOnDeviceIfNeeded(device: Mobile.IDevice, buildData: BuildData, packageFile?: string): Promise<void> {
		const shouldInstall = await this.shouldInstall(device, buildData);
		if (shouldInstall) {
			await this.installOnDevice(device, buildData, packageFile);
		}
	}

	public async getDeviceBuildInfoFilePath(device: Mobile.IDevice, projectData: IProjectData): Promise<string> {
		const platform = device.deviceInfo.platform.toLowerCase();
		const deviceRootPath = await this.$devicePathProvider.getDeviceProjectRootPath(device, {
			appIdentifier: projectData.projectIdentifiers[platform],
			getDirname: true
		});
		return helpers.fromWindowsRelativePathToUnix(path.join(deviceRootPath, buildInfoFileName));
	}

	private async updateHashesOnDevice(data: { device: Mobile.IDevice, appIdentifier: string, outputFilePath: string, platformData: IPlatformData }): Promise<void> {
		const { device, appIdentifier, platformData, outputFilePath } = data;

		if (!this.$mobileHelper.isAndroidPlatform(platformData.normalizedPlatformName)) {
			return;
		}

		let hashes = {};
		const hashesFilePath = path.join(outputFilePath || platformData.getBuildOutputPath(null), HASHES_FILE_NAME);
		if (this.$fs.exists(hashesFilePath)) {
			hashes = this.$fs.readJson(hashesFilePath);
		}

		await device.fileSystem.updateHashesOnDevice(hashes, appIdentifier);
	}

	private async shouldInstall(device: Mobile.IDevice, buildData: BuildData, outputPath?: string): Promise<boolean> {
		const projectData = this.$projectDataService.getProjectData(buildData.projectDir);
		const platformData = this.$platformsData.getPlatformData(device.deviceInfo.platform, projectData);
		const platform = device.deviceInfo.platform;
		if (!(await device.applicationManager.isApplicationInstalled(projectData.projectIdentifiers[platform.toLowerCase()]))) {
			return true;
		}

		const deviceBuildInfo: IBuildInfo = await this.getDeviceBuildInfo(device, projectData);
		const localBuildInfo = this.$buildInfoFileService.getBuildInfoFromFile(platformData, <any>{ buildForDevice: !device.isEmulator, release: buildData.release }, outputPath);

		return !localBuildInfo || !deviceBuildInfo || deviceBuildInfo.buildTime !== localBuildInfo.buildTime;
	}

	private async getDeviceBuildInfo(device: Mobile.IDevice, projectData: IProjectData): Promise<IBuildInfo> {
		const deviceFilePath = await this.getDeviceBuildInfoFilePath(device, projectData);
		try {
			const deviceFileContent = await this.$mobileHelper.getDeviceFileContent(device, deviceFilePath, projectData);
			return JSON.parse(deviceFileContent);
		} catch (e) {
			return null;
		}
	}
}
$injector.register("deviceInstallAppService", DeviceInstallAppService);
