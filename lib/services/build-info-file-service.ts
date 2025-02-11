import * as path from "path";
import * as helpers from "../common/helpers";
import { IPlatformData, IBuildInfo } from "../definitions/platform";
import { IBuildInfoFileService, IBuildData } from "../definitions/build";
import { IProjectData } from "../definitions/project";
import { IFileSystem } from "../common/declarations";
import { injector } from "../common/yok";

const buildInfoFileName = ".nsbuildinfo";

export class BuildInfoFileService implements IBuildInfoFileService {
	constructor(
		private $devicePathProvider: IDevicePathProvider,
		private $fs: IFileSystem,
		private $mobileHelper: Mobile.IMobileHelper,
		private $projectChangesService: IProjectChangesService
	) {}

	public getLocalBuildInfo(
		platformData: IPlatformData,
		buildData: IBuildData
	): IBuildInfo {
		const outputPath =
			buildData.outputPath || platformData.getBuildOutputPath(buildData);
		const buildInfoFile = path.join(outputPath, buildInfoFileName);
		if (this.$fs.exists(buildInfoFile)) {
			try {
				const buildInfo = this.$fs.readJson(buildInfoFile);
				return buildInfo;
			} catch (e) {
				return null;
			}
		}

		return null;
	}

	public async getDeviceBuildInfo(
		device: Mobile.IDevice,
		projectData: IProjectData
	): Promise<IBuildInfo> {
		const deviceFilePath = await this.getDeviceBuildInfoFilePath(
			device,
			projectData
		);
		try {
			const deviceFileContent = await this.$mobileHelper.getDeviceFileContent(
				device,
				deviceFilePath,
				projectData
			);
			return JSON.parse(deviceFileContent);
		} catch (e) {
			return null;
		}
	}

	public saveLocalBuildInfo(
		platformData: IPlatformData,
		buildInfoFileDirname: string
	): void {
		const buildInfoFile = path.join(buildInfoFileDirname, buildInfoFileName);

		const prepareInfo =
			this.$projectChangesService.getPrepareInfo(platformData);
		const buildInfo: IBuildInfo = {
			prepareTime: prepareInfo.changesRequireBuildTime,
			buildTime: new Date().toString()
		};

		this.$fs.writeJson(buildInfoFile, buildInfo);
	}

	public async saveDeviceBuildInfo(
		device: Mobile.IDevice,
		projectData: IProjectData,
		outputFilePath: string
	): Promise<void> {
		const deviceFilePath = await this.getDeviceBuildInfoFilePath(
			device,
			projectData
		);
		const appIdentifier =
			projectData.projectIdentifiers[device.deviceInfo.platform.toLowerCase()];

		await device.fileSystem.putFile(
			path.join(outputFilePath, buildInfoFileName),
			deviceFilePath,
			appIdentifier
		);
	}

	private async getDeviceBuildInfoFilePath(
		device: Mobile.IDevice,
		projectData: IProjectData
	): Promise<string> {
		const platform = device.deviceInfo.platform.toLowerCase();
		const deviceRootPath =
			await this.$devicePathProvider.getDeviceProjectRootPath(device, {
				appIdentifier: projectData.projectIdentifiers[platform],
				getDirname: true
			});
		const result = helpers.fromWindowsRelativePathToUnix(
			path.join(deviceRootPath, buildInfoFileName)
		);

		return result;
	}
}
injector.register("buildInfoFileService", BuildInfoFileService);
