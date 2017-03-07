import * as helpers from "../../common/helpers";
import * as constants from "../../constants";
import * as minimatch from "minimatch";
import * as net from "net";

let currentPageReloadId = 0;

class IOSLiveSyncService implements INativeScriptDeviceLiveSyncService {
	private static BACKEND_PORT = 18181;
	private socket: net.Socket;
	private device: Mobile.IiOSDevice;

	constructor(_device: Mobile.IDevice,
		private $iOSSocketRequestExecutor: IiOSSocketRequestExecutor,
		private $iOSNotification: IiOSNotification,
		private $iOSEmulatorServices: Mobile.IiOSSimulatorService,
		private $injector: IInjector,
		private $logger: ILogger,
		private $options: IOptions,
		private $iOSDebugService: IDebugService,
		private $fs: IFileSystem,
		private $liveSyncProvider: ILiveSyncProvider,
		private $processService: IProcessService) {

		this.device = <Mobile.IiOSDevice>(_device);
	}

	public get debugService(): IDebugService {
		return this.$iOSDebugService;
	}

	public async afterInstallApplicationAction(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): Promise<boolean> {
		return this.$options.watch;
	}

	private async setupSocketIfNeeded(projectId: string): Promise<boolean> {
		if (this.socket) {
			return true;
		}

		if (this.device.isEmulator) {
			await this.$iOSEmulatorServices.postDarwinNotification(this.$iOSNotification.getAttachRequest(projectId));
			try {
				this.socket = await helpers.connectEventuallyUntilTimeout(() => net.connect(IOSLiveSyncService.BACKEND_PORT), 5000);
			} catch (e) {
				this.$logger.debug(e);
				return false;
			}
		} else {
			let timeout = 9000;
			await this.$iOSSocketRequestExecutor.executeAttachRequest(this.device, timeout, projectId);
			this.socket = this.device.connectToPort(IOSLiveSyncService.BACKEND_PORT);
		}

		this.attachEventHandlers();

		return true;
	}

	public async removeFiles(appIdentifier: string, localToDevicePaths: Mobile.ILocalToDevicePathData[]): Promise<void> {
		await Promise.all(_.map(localToDevicePaths, localToDevicePathData => this.device.fileSystem.deleteFile(localToDevicePathData.getDevicePath(), appIdentifier)));
	}

	public async refreshApplication(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], forceExecuteFullSync: boolean, projectData: IProjectData): Promise<void> {
		if (forceExecuteFullSync) {
			await this.restartApplication(deviceAppData);
			return;
		}

		let scriptRelatedFiles: Mobile.ILocalToDevicePathData[] = [];
		let scriptFiles = _.filter(localToDevicePaths, localToDevicePath => _.endsWith(localToDevicePath.getDevicePath(), ".js"));
		constants.LIVESYNC_EXCLUDED_FILE_PATTERNS.forEach(pattern => scriptRelatedFiles = _.concat(scriptRelatedFiles, localToDevicePaths.filter(file => minimatch(file.getDevicePath(), pattern, { nocase: true }))));

		let otherFiles = _.difference(localToDevicePaths, _.concat(scriptFiles, scriptRelatedFiles));
		let shouldRestart = _.some(otherFiles, (localToDevicePath: Mobile.ILocalToDevicePathData) => !this.$liveSyncProvider.canExecuteFastSync(localToDevicePath.getLocalPath(), projectData, deviceAppData.platform));

		if (shouldRestart || (!this.$options.liveEdit && scriptFiles.length)) {
			await this.restartApplication(deviceAppData);
			return;
		}

		if (await this.setupSocketIfNeeded(projectData.projectId)) {
			this.liveEdit(scriptFiles);
			await this.reloadPage(deviceAppData, otherFiles);
		} else {
			await this.restartApplication(deviceAppData);
		}
	}

	private async restartApplication(deviceAppData: Mobile.IDeviceAppData): Promise<void> {
		let projectData: IProjectData = this.$injector.resolve("projectData");
		return this.device.applicationManager.restartApplication(deviceAppData.appIdentifier, projectData.projectName);
	}

	private async reloadPage(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): Promise<void> {
		if (localToDevicePaths.length) {
			let message = JSON.stringify({
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
		for (let localToDevicePath of localToDevicePaths) {
			let content = this.$fs.readText(localToDevicePath.getLocalPath());
			let message = JSON.stringify({
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
				let length = Buffer.byteLength(message, "utf16le");
				let payload = new Buffer(length + 4);
				payload.writeInt32BE(length, 0);
				payload.write(message, 4, length, "utf16le");

				this.socket.once("error", (error: Error) => {
					if (!isResolved) {
						isResolved = true;
						reject(error);
					}
				});

				this.socket.write(payload, "utf16le", () => {
					this.socket.removeAllListeners("error");

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
$injector.register("iosLiveSyncServiceLocator", { factory: IOSLiveSyncService });
