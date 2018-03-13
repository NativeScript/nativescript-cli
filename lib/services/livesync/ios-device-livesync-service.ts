import * as constants from "../../constants";
import * as minimatch from "minimatch";
import * as net from "net";
import { DeviceLiveSyncServiceBase } from "./device-livesync-service-base";

let currentPageReloadId = 0;

export class IOSDeviceLiveSyncService extends DeviceLiveSyncServiceBase implements INativeScriptDeviceLiveSyncService {
	private static BACKEND_PORT = 18181;
	private socket: net.Socket;
	private device: Mobile.IiOSDevice;

	constructor(_device: Mobile.IiOSDevice,
		private $iOSSocketRequestExecutor: IiOSSocketRequestExecutor,
		private $iOSNotification: IiOSNotification,
		private $iOSEmulatorServices: Mobile.IiOSSimulatorService,
		private $logger: ILogger,
		private $fs: IFileSystem,
		private $processService: IProcessService,
		protected $platformsData: IPlatformsData) {
		super($platformsData);
		this.device = _device;
	}

	private async setupSocketIfNeeded(projectId: string): Promise<boolean> {
		if (this.socket) {
			return true;
		}

		if (this.device.isEmulator) {
			await this.$iOSEmulatorServices.postDarwinNotification(this.$iOSNotification.getAttachRequest(projectId));
			this.socket = await this.$iOSEmulatorServices.connectToPort({ port: IOSDeviceLiveSyncService.BACKEND_PORT });
			if (!this.socket) {
				return false;
			}
		} else {
			await this.$iOSSocketRequestExecutor.executeAttachRequest(this.device, constants.AWAIT_NOTIFICATION_TIMEOUT_SECONDS, projectId);
			this.socket = await this.device.connectToPort(IOSDeviceLiveSyncService.BACKEND_PORT);
		}

		this.attachEventHandlers();

		return true;
	}

	public async removeFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): Promise<void> {
		await Promise.all(_.map(localToDevicePaths, localToDevicePathData => this.device.fileSystem.deleteFile(localToDevicePathData.getDevicePath(), deviceAppData.appIdentifier)));
	}

	public async refreshApplication(projectData: IProjectData, liveSyncInfo: ILiveSyncResultInfo): Promise<void> {
		const deviceAppData = liveSyncInfo.deviceAppData;
		const localToDevicePaths = liveSyncInfo.modifiedFilesData;
		if (liveSyncInfo.isFullSync) {
			await this.restartApplication(deviceAppData, projectData.projectName);
			return;
		}

		let scriptRelatedFiles: Mobile.ILocalToDevicePathData[] = [];
		const scriptFiles = _.filter(localToDevicePaths, localToDevicePath => _.endsWith(localToDevicePath.getDevicePath(), ".js"));
		constants.LIVESYNC_EXCLUDED_FILE_PATTERNS.forEach(pattern => scriptRelatedFiles = _.concat(scriptRelatedFiles, localToDevicePaths.filter(file => minimatch(file.getDevicePath(), pattern, { nocase: true }))));

		const otherFiles = _.difference(localToDevicePaths, _.concat(scriptFiles, scriptRelatedFiles));
		const shouldRestart = _.some(otherFiles, (localToDevicePath: Mobile.ILocalToDevicePathData) => !this.canExecuteFastSync(localToDevicePath.getLocalPath(), projectData, deviceAppData.platform));

		if (shouldRestart || (!liveSyncInfo.useLiveEdit && scriptFiles.length)) {
			await this.restartApplication(deviceAppData, projectData.projectName);
			return;
		}

		if (await this.setupSocketIfNeeded(projectData.projectId)) {
			await this.liveEdit(scriptFiles);
			await this.reloadPage(deviceAppData, otherFiles);
		} else {
			await this.restartApplication(deviceAppData, projectData.projectName);
		}
	}

	private async restartApplication(deviceAppData: Mobile.IDeviceAppData, projectName: string): Promise<void> {
		return this.device.applicationManager.restartApplication({ appId: deviceAppData.appIdentifier, projectName });
	}

	private async reloadPage(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): Promise<void> {
		if (localToDevicePaths.length) {
			const message = JSON.stringify({
				method: "Page.reload",
				params: {
					ignoreCache: false
				},
				id: ++currentPageReloadId
			});

			await this.sendMessage(message);
		}
	}

	private async liveEdit(localToDevicePaths: Mobile.ILocalToDevicePathData[]): Promise<void> {
		for (const localToDevicePath of localToDevicePaths) {
			const content = this.$fs.readText(localToDevicePath.getLocalPath());
			const message = JSON.stringify({
				method: "Debugger.setScriptSource",
				params: {
					scriptUrl: localToDevicePath.getRelativeToProjectBasePath(),
					scriptSource: content
				},
				id: ++currentPageReloadId
			});

			await this.sendMessage(message);
		}
	}

	private attachEventHandlers(): void {
		this.$processService.attachToProcessExitSignals(this, this.destroySocket);

		this.socket.on("close", (hadError: boolean) => {
			this.$logger.trace(`Socket closed, hadError is ${hadError}.`);
			this.socket = null;
		});

		this.socket.on("error", (error: any) => {
			this.$logger.trace(`Socket error received: ${error}`);
		});

		this.socket.on("data", (data: NodeBuffer | string) => {
			this.$logger.trace(`Socket sent data: ${data.toString()}`);
		});
	}

	private async sendMessage(message: string): Promise<void> {
		try {
			await new Promise<void>((resolve, reject) => {
				let isResolved = false;
				const length = Buffer.byteLength(message, "utf16le");
				const payload = new Buffer(length + 4);
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
			this.destroySocket();
		}
	}

	private destroySocket(): void {
		if (this.socket) {
			this.socket.destroy();
			this.socket = null;
		}
	}
}
