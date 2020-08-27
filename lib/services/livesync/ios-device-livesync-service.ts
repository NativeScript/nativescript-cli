import * as constants from "../../constants";
import * as minimatch from "minimatch";
import * as net from "net";
import * as _ from "lodash";
import { DeviceLiveSyncServiceBase } from "./device-livesync-service-base";
import { performanceLog } from "../../common/decorators";
import * as semver from "semver";
import {
	IiOSSocketRequestExecutor,
	IPlatformCommandHelper,
} from "../../declarations";
import { IPlatformsDataService } from "../../definitions/platform";
import { IProjectData } from "../../definitions/project";

let currentPageReloadId = 0;

export class IOSDeviceLiveSyncService
	extends DeviceLiveSyncServiceBase
	implements INativeScriptDeviceLiveSyncService {
	private static MIN_RUNTIME_VERSION_WITH_REFRESH_NOTIFICATION = "6.1.0";

	private socket: net.Socket;

	constructor(
		private $logger: ILogger,
		private $iOSSocketRequestExecutor: IiOSSocketRequestExecutor,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $lockService: ILockService,
		protected platformsDataService: IPlatformsDataService,
		private $platformCommandHelper: IPlatformCommandHelper,
		protected device: Mobile.IiOSDevice
	) {
		super(platformsDataService, device);
	}

	private canRefreshWithNotification(
		projectData: IProjectData,
		liveSyncInfo?: ILiveSyncResultInfo
	): boolean {
		if (liveSyncInfo && liveSyncInfo.forceRefreshWithSocket) {
			return false;
		}

		if (this.device.isEmulator) {
			return false;
		}

		const currentRuntimeVersion = this.$platformCommandHelper.getCurrentPlatformVersion(
			this.$devicePlatformsConstants.iOS,
			projectData
		);
		const canRefresh = semver.gte(
			semver.coerce(currentRuntimeVersion),
			IOSDeviceLiveSyncService.MIN_RUNTIME_VERSION_WITH_REFRESH_NOTIFICATION
		);

		return canRefresh;
	}

	private async setupSocketIfNeeded(
		projectData: IProjectData
	): Promise<boolean> {
		// TODO: persist the sockets per app in order to support LiveSync on multiple apps on the same device
		if (this.socket) {
			return true;
		}

		const appId = projectData.projectIdentifiers.ios;
		try {
			// TODO: temp workaround till we setup the sockets along with the app start
			const ensureAppStarted = true;
			this.socket = await this.device.getDebugSocket(
				appId,
				projectData.projectName,
				projectData.projectDir,
				ensureAppStarted
			);
		} catch (err) {
			this.$logger.trace(
				`Error while connecting to the debug socket. Error is:`,
				err
			);
		}

		if (!this.socket) {
			return false;
		}

		this.attachEventHandlers();

		return true;
	}

	@performanceLog()
	public async removeFiles(
		deviceAppData: Mobile.IDeviceAppData,
		localToDevicePaths: Mobile.ILocalToDevicePathData[]
	): Promise<void> {
		await Promise.all(
			_.map(localToDevicePaths, (localToDevicePathData) =>
				this.device.fileSystem.deleteFile(
					localToDevicePathData.getDevicePath(),
					deviceAppData.appIdentifier
				)
			)
		);
	}

	public async shouldRestart(
		projectData: IProjectData,
		liveSyncInfo: ILiveSyncResultInfo
	): Promise<boolean> {
		let shouldRestart = false;
		const deviceAppData = liveSyncInfo.deviceAppData;
		const localToDevicePaths = liveSyncInfo.modifiedFilesData;
		if (liveSyncInfo.isFullSync || liveSyncInfo.waitForDebugger) {
			shouldRestart = true;
		} else {
			const canExecuteFastSync = this.canExecuteFastSyncForPaths(
				liveSyncInfo,
				localToDevicePaths,
				projectData,
				deviceAppData.platform
			);
			const isRefreshConnectionSetup =
				this.canRefreshWithNotification(projectData, liveSyncInfo) ||
				(!this.device.isOnlyWiFiConnected && this.socket);
			if (!canExecuteFastSync || !isRefreshConnectionSetup) {
				shouldRestart = true;
			}
		}

		return shouldRestart;
	}

	public async tryRefreshApplication(
		projectData: IProjectData,
		liveSyncInfo: ILiveSyncResultInfo
	): Promise<boolean> {
		let didRefresh = true;
		const localToDevicePaths = liveSyncInfo.modifiedFilesData;

		let scriptRelatedFiles: Mobile.ILocalToDevicePathData[] = [];
		constants.LIVESYNC_EXCLUDED_FILE_PATTERNS.forEach(
			(pattern) =>
				(scriptRelatedFiles = _.concat(
					scriptRelatedFiles,
					localToDevicePaths.filter((file) =>
						minimatch(file.getDevicePath(), pattern, { nocase: true })
					)
				))
		);

		const scriptFiles = _.filter(localToDevicePaths, (localToDevicePath) =>
			_.endsWith(localToDevicePath.getDevicePath(), ".js")
		);
		const otherFiles = _.difference(
			localToDevicePaths,
			_.concat(scriptFiles, scriptRelatedFiles)
		);

		try {
			if (otherFiles.length) {
				didRefresh = await this.refreshApplicationCore(
					projectData,
					liveSyncInfo
				);
			}
		} catch (e) {
			didRefresh = false;
		}

		return didRefresh;
	}

	private async refreshApplicationCore(
		projectData: IProjectData,
		liveSyncInfo: ILiveSyncResultInfo
	) {
		let didRefresh = true;
		if (this.canRefreshWithNotification(projectData, liveSyncInfo)) {
			didRefresh = await this.refreshWithNotification(projectData);
		} else {
			if (await this.setupSocketIfNeeded(projectData)) {
				await this.reloadPage();
			} else {
				didRefresh = false;
			}
		}

		return didRefresh;
	}

	private async refreshWithNotification(projectData: IProjectData) {
		let didRefresh = false;
		await this.$lockService.executeActionWithLock(async () => {
			didRefresh = await this.$iOSSocketRequestExecutor.executeRefreshRequest(
				this.device,
				5,
				projectData.projectIdentifiers.ios
			);
		}, `ios-device-livesync-${this.device.deviceInfo.identifier}-${projectData.projectIdentifiers.ios}.lock`);

		return didRefresh;
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

		if (liveSyncInfo.useHotModuleReload) {
			// enable HOT updates
			await this.setupSocketIfNeeded(projectData);
		}
	}

	private async reloadPage(): Promise<void> {
		const message = JSON.stringify({
			method: "Page.reload",
			params: {
				ignoreCache: false,
			},
			id: ++currentPageReloadId,
		});

		await this.sendMessage(message);
	}

	private attachEventHandlers(): void {
		this.socket.on("close", (hadError: boolean) => {
			this.$logger.trace(`Socket closed, hadError is ${hadError}.`);
			this.socket = null;
		});

		this.socket.on("error", (error: any) => {
			this.$logger.trace(`Socket error received: ${error}`);
		});

		this.socket.on("data", (data: Buffer | string) => {
			this.$logger.trace(`Socket sent data: ${data.toString()}`);
		});
	}

	private async sendMessage(message: string): Promise<void> {
		try {
			await new Promise<void>((resolve, reject) => {
				let isResolved = false;
				const length = Buffer.byteLength(message, "utf16le");
				const payload = Buffer.allocUnsafe(length + 4);
				payload.writeInt32BE(length, 0);
				payload.write(message, 4, length, "utf16le");

				const errorCallback = (error: Error) => {
					if (!isResolved) {
						isResolved = true;
						reject(error);
					}
				};
				this.socket.once("error", errorCallback);

				this.socket.write(payload, "utf16le", () => {
					this.socket.removeListener("error", errorCallback);

					if (!isResolved) {
						isResolved = true;
						resolve();
					}
				});
			});
		} catch (error) {
			this.$logger.trace("Error while sending message:", error);
			await this.destroySocket();
		}
	}

	private async destroySocket(): Promise<void> {
		if (this.socket) {
			// we do not support LiveSync on multiple apps on the same device
			// in order to do that, we should cache the socket per app
			// and destroy just the current app socket when possible
			await this.device.destroyAllSockets();
			this.socket = null;
		}
	}
}
