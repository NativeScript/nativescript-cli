import { AndroidDeviceLiveSyncServiceBase } from "./android-device-livesync-service-base";
import { LiveSyncPaths } from "../../common/constants";
import { AndroidLivesyncTool } from "./android-livesync-tool";
import * as path from "path";
import * as semver from "semver";
import * as _ from "lodash";
import { IProjectData } from "../../definitions/project";
import { IPlatformsDataService } from "../../definitions/platform";
import { IOptions } from "../../declarations";
import { IFileSystem } from "../../common/declarations";
import { IFilesHashService } from "../../definitions/files-hash-service";
import { IInjector } from "../../common/definitions/yok";
import { ICleanupService } from "../../definitions/cleanup-service";
import { ISpawnCommandInfo } from "../../detached-processes/cleanup-process-definitions";
import { ITempService } from "../../definitions/temp-service";

export class AndroidDeviceSocketsLiveSyncService
	extends AndroidDeviceLiveSyncServiceBase
	implements
		IAndroidNativeScriptDeviceLiveSyncService,
		INativeScriptDeviceLiveSyncService
{
	private livesyncTool: IAndroidLivesyncTool;
	private static STATUS_UPDATE_INTERVAL = 10000;
	private static MINIMAL_VERSION_LONG_LIVING_CONNECTION = "0.2.0";

	constructor(
		private data: IProjectData,
		$injector: IInjector,
		protected platformsDataService: IPlatformsDataService,
		protected $staticConfig: Config.IStaticConfig,
		$logger: ILogger,
		protected device: Mobile.IAndroidDevice,
		private $options: IOptions,
		private $cleanupService: ICleanupService,
		private $fs: IFileSystem,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $tempService: ITempService,
		$filesHashService: IFilesHashService
	) {
		super($injector, platformsDataService, $filesHashService, $logger, device);
		this.livesyncTool = this.$injector.resolve(AndroidLivesyncTool);
	}

	public async beforeLiveSyncAction(
		deviceAppData: Mobile.IDeviceAppData
	): Promise<void> {
		if (!this.livesyncTool.hasConnection()) {
			try {
				const pathToLiveSyncFile = await this.$tempService.path({
					prefix: "livesync",
				});
				this.$fs.writeFile(pathToLiveSyncFile, "");
				await this.device.fileSystem.putFile(
					pathToLiveSyncFile,
					this.getPathToLiveSyncFileOnDevice(deviceAppData.appIdentifier),
					deviceAppData.appIdentifier
				);
				await this.device.applicationManager.startApplication({
					appId: deviceAppData.appIdentifier,
					projectName: this.data.projectName,
					justLaunch: true,
					waitForDebugger: false,
					projectDir: deviceAppData.projectDir,
				});
				await this.connectLivesyncTool(
					this.data.projectIdentifiers.android,
					deviceAppData.connectTimeout
				);
			} catch (err) {
				await this.device.fileSystem.deleteFile(
					this.getPathToLiveSyncFileOnDevice(deviceAppData.appIdentifier),
					deviceAppData.appIdentifier
				);
				throw err;
			}
		}
	}

	private getPathToLiveSyncFileOnDevice(appIdentifier: string): string {
		return `${LiveSyncPaths.ANDROID_TMP_DIR_NAME}/${appIdentifier}-livesync-in-progress`;
	}

	public async finalizeSync(
		liveSyncInfo: ILiveSyncResultInfo,
		projectData: IProjectData
	): Promise<IAndroidLivesyncSyncOperationResult> {
		try {
			const result = await this.doSync(liveSyncInfo, projectData);
			if (
				!semver.gte(
					this.livesyncTool.protocolVersion,
					AndroidDeviceSocketsLiveSyncService.MINIMAL_VERSION_LONG_LIVING_CONNECTION
				)
			) {
				this.livesyncTool.end();
			}
			return result;
		} catch (e) {
			this.livesyncTool.end();
			throw e;
		}
	}

	private async getCleanupCommand(
		appIdentifier: string
	): Promise<ISpawnCommandInfo> {
		return {
			command: await this.$staticConfig.getAdbFilePath(),
			args: [
				"-s",
				this.device.deviceInfo.identifier,
				"shell",
				"rm",
				"-rf",
				appIdentifier,
			],
		};
	}
	private async doSync(
		liveSyncInfo: ILiveSyncResultInfo,
		projectData: IProjectData
	): Promise<IAndroidLivesyncSyncOperationResult> {
		const operationId = this.livesyncTool.generateOperationIdentifier();

		let result = { operationId, didRefresh: true };

		if (liveSyncInfo.modifiedFilesData.length) {
			const canExecuteFastSync =
				!liveSyncInfo.isFullSync &&
				this.canExecuteFastSyncForPaths(
					liveSyncInfo,
					liveSyncInfo.modifiedFilesData,
					projectData,
					this.device.deviceInfo.platform
				);
			const doSyncPromise = this.livesyncTool.sendDoSyncOperation({
				doRefresh: canExecuteFastSync,
				operationId,
			});

			const syncInterval: NodeJS.Timeout = setInterval(() => {
				if (this.livesyncTool.isOperationInProgress(operationId)) {
					this.$logger.info("Sync operation in progress...");
				}
			}, AndroidDeviceSocketsLiveSyncService.STATUS_UPDATE_INTERVAL);

			const cleanupCommand = await this.getCleanupCommand(
				liveSyncInfo.deviceAppData.appIdentifier
			);
			const actionOnEnd = async () => {
				clearInterval(syncInterval);
				await this.device.fileSystem.deleteFile(
					this.getPathToLiveSyncFileOnDevice(
						liveSyncInfo.deviceAppData.appIdentifier
					),
					liveSyncInfo.deviceAppData.appIdentifier
				);
				await this.$cleanupService.removeCleanupCommand(cleanupCommand);
			};

			await this.$cleanupService.addCleanupCommand(cleanupCommand);
			// We need to clear resources when the action fails
			// But we also need the real result of the action.
			await doSyncPromise.then(actionOnEnd.bind(this), actionOnEnd.bind(this));

			result = await doSyncPromise;
		} else {
			await this.device.fileSystem.deleteFile(
				this.getPathToLiveSyncFileOnDevice(
					liveSyncInfo.deviceAppData.appIdentifier
				),
				liveSyncInfo.deviceAppData.appIdentifier
			);
		}

		return result;
	}

	public async restartApplication(
		projectData: IProjectData,
		liveSyncInfo: ILiveSyncResultInfo
	): Promise<void> {
		await this.device.applicationManager.restartApplication({
			appId: liveSyncInfo.deviceAppData.appIdentifier,
			projectName: projectData.projectName,
			waitForDebugger: liveSyncInfo.waitForDebugger,
			projectDir: projectData.projectDir,
		});
		if (
			!this.$options.justlaunch &&
			!liveSyncInfo.waitForDebugger &&
			this.livesyncTool.protocolVersion &&
			semver.gte(
				this.livesyncTool.protocolVersion,
				AndroidDeviceSocketsLiveSyncService.MINIMAL_VERSION_LONG_LIVING_CONNECTION
			)
		) {
			try {
				await this.connectLivesyncTool(
					liveSyncInfo.deviceAppData.appIdentifier
				);
			} catch (e) {
				this.$logger.trace("Failed to connect after app restart.");
			}
		}
	}

	public async shouldRestart(
		projectData: IProjectData,
		liveSyncInfo: IAndroidLiveSyncResultInfo
	): Promise<boolean> {
		let shouldRestart = false;
		const canExecuteFastSync =
			!liveSyncInfo.isFullSync &&
			this.canExecuteFastSyncForPaths(
				liveSyncInfo,
				liveSyncInfo.modifiedFilesData,
				projectData,
				this.device.deviceInfo.platform
			);
		if (
			!canExecuteFastSync ||
			!liveSyncInfo.didRefresh ||
			liveSyncInfo.waitForDebugger
		) {
			shouldRestart = true;
		}

		return shouldRestart;
	}

	public async tryRefreshApplication(
		projectData: IProjectData,
		liveSyncInfo: IAndroidLiveSyncResultInfo
	): Promise<boolean> {
		return true;
	}

	public async removeFiles(
		deviceAppData: Mobile.IDeviceAppData,
		localToDevicePaths: Mobile.ILocalToDevicePathData[],
		projectFilesPath: string
	): Promise<void> {
		await this.livesyncTool.removeFiles(
			_.map(localToDevicePaths, (element: any) => element.filePath)
		);
		const deviceHashService = this.device.fileSystem.getDeviceHashService(
			deviceAppData.appIdentifier
		);
		await deviceHashService.removeHashes(localToDevicePaths);
	}

	public async transferFilesOnDevice(
		deviceAppData: Mobile.IDeviceAppData,
		localToDevicePaths: Mobile.ILocalToDevicePathData[]
	): Promise<void> {
		const files = _.map(localToDevicePaths, (localToDevicePath) =>
			localToDevicePath.getLocalPath()
		);
		await this.livesyncTool.sendFiles(files);
	}

	public async transferDirectoryOnDevice(
		deviceAppData: Mobile.IDeviceAppData,
		localToDevicePaths: Mobile.ILocalToDevicePathData[],
		projectFilesPath: string
	): Promise<void> {
		await this.livesyncTool.sendDirectory(projectFilesPath);
	}

	private async connectLivesyncTool(
		appIdentifier: string,
		connectTimeout?: number
	) {
		const platformData = this.platformsDataService.getPlatformData(
			this.$devicePlatformsConstants.Android,
			this.data
		);
		const projectFilesPath = path.join(
			platformData.appDestinationDirectoryPath,
			this.$options.hostProjectModuleName
		);
		if (!this.livesyncTool.hasConnection()) {
			await this.livesyncTool.connect({
				appIdentifier,
				deviceIdentifier: this.device.deviceInfo.identifier,
				appPlatformsPath: projectFilesPath,
				connectTimeout,
			});
		}
	}
}
