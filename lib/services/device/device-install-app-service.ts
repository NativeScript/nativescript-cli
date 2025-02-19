import { TrackActionNames, HASHES_FILE_NAME } from "../../constants";
import * as path from "path";
import {
	IBuildArtifactsService,
	IBuildInfoFileService,
	IBuildData,
} from "../../definitions/build";
import { IProjectDataService } from "../../definitions/project";
import {
	IPlatformsDataService,
	IBuildInfo,
	IPlatformData,
} from "../../definitions/platform";
import { IAnalyticsService, IFileSystem } from "../../common/declarations";
import { injector } from "../../common/yok";

export class DeviceInstallAppService {
	constructor(
		private $analyticsService: IAnalyticsService,
		private $buildArtifactsService: IBuildArtifactsService,
		private $buildInfoFileService: IBuildInfoFileService,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $mobileHelper: Mobile.IMobileHelper,
		private $projectDataService: IProjectDataService,
		private $platformsDataService: IPlatformsDataService
	) {}

	public async installOnDevice(
		device: Mobile.IDevice,
		buildData: IBuildData
	): Promise<void> {
		this.$logger.info(
			`Installing on device ${device.deviceInfo.identifier}...`
		);

		const platform = device.deviceInfo.platform.toLowerCase();
		const projectData = this.$projectDataService.getProjectData(
			buildData.projectDir
		);
		const platformData = this.$platformsDataService.getPlatformData(
			platform,
			projectData
		);

		await this.$analyticsService.trackEventActionInGoogleAnalytics({
			action: TrackActionNames.Deploy,
			device,
			projectDir: projectData.projectDir,
		});
		const buildOutputOptions = platformData.getValidBuildOutputData(buildData);
		const outputPath = buildData.outputPath || platformData.getBuildOutputPath(buildData);
		const packages = await this.$buildArtifactsService.getAllAppPackages(
			outputPath,
			buildOutputOptions
		);
		let packageFile;
		if (packages.length === 1) {
			// will always be the case on iOS
			packageFile = packages[0].packageName;
		} else if (device.deviceInfo.abis) {
			device.deviceInfo.abis.every(abi=>{
				const index = packages.findIndex(p => p.packageName.indexOf(abi) !== -1);
				if (index !== -1) {
					packageFile = packages[index].packageName;
					return false;
				}
				return true;
			})
		} else {
			//we did not find corresponding abi let's try universal
			const index = packages.findIndex(p => p.packageName.indexOf('universal') !== -1);
			if (index !== -1) {
				packageFile = packages[index].packageName;
			}
		}

		if (!packageFile) {
			this.$logger.error(
				`Could not find a package corresponding to the device with identifier '${device.deviceInfo.identifier}'.`
			);
			return;
		}

		await platformData.platformProjectService.cleanDeviceTempFolder(
			device.deviceInfo.identifier,
			projectData
		);

		const appIdentifier = projectData.projectIdentifiers[platform];
		const outputFilePath =
			buildData.outputPath || platformData.getBuildOutputPath(buildData);

		await device.applicationManager.reinstallApplication(
			appIdentifier,
			packageFile,
			buildData
		);

		await this.updateHashesOnDevice({
			device,
			appIdentifier,
			outputFilePath,
			platformData,
		});

		if (!buildData.release) {
			await this.$buildInfoFileService.saveDeviceBuildInfo(
				device,
				projectData,
				outputFilePath
			);
		}

		this.$logger.info(
			`Successfully installed on device with identifier '${device.deviceInfo.identifier} using package ${packageFile}'.`
		);
	}

	public async installOnDeviceIfNeeded(
		device: Mobile.IDevice,
		buildData: IBuildData
	): Promise<void> {
		const shouldInstall = await this.shouldInstall(device, buildData);
		if (shouldInstall) {
			await this.installOnDevice(device, buildData);
		}
	}

	public async shouldInstall(
		device: Mobile.IDevice,
		buildData: IBuildData
	): Promise<boolean> {
		const projectData = this.$projectDataService.getProjectData(
			buildData.projectDir
		);
		const platformData = this.$platformsDataService.getPlatformData(
			device.deviceInfo.platform,
			projectData
		);
		const platform = device.deviceInfo.platform;
		if (
			!(await device.applicationManager.isApplicationInstalled(
				projectData.projectIdentifiers[platform.toLowerCase()]
			))
		) {
			return true;
		}

		const deviceBuildInfo: IBuildInfo = await this.$buildInfoFileService.getDeviceBuildInfo(
			device,
			projectData
		);
		const localBuildInfo = this.$buildInfoFileService.getLocalBuildInfo(
			platformData,
			{ ...buildData, buildForDevice: !device.isEmulator }
		);

		return (
			!localBuildInfo ||
			!deviceBuildInfo ||
			deviceBuildInfo.buildTime !== localBuildInfo.buildTime
		);
	}

	private async updateHashesOnDevice(data: {
		device: Mobile.IDevice;
		appIdentifier: string;
		outputFilePath: string;
		platformData: IPlatformData;
	}): Promise<void> {
		const { device, appIdentifier, platformData, outputFilePath } = data;

		if (
			!this.$mobileHelper.isAndroidPlatform(platformData.normalizedPlatformName)
		) {
			return;
		}

		let hashes = {};
		const hashesFilePath = path.join(outputFilePath, HASHES_FILE_NAME);
		if (this.$fs.exists(hashesFilePath)) {
			hashes = this.$fs.readJson(hashesFilePath);
		}

		await device.fileSystem.updateHashesOnDevice(hashes, appIdentifier);
	}
}
injector.register("deviceInstallAppService", DeviceInstallAppService);
