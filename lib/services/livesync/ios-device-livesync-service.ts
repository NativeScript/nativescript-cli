import * as helpers from "../../common/helpers";
import * as constants from "../../constants";
import * as minimatch from "minimatch";
import * as net from "net";
import Future = require("fibers/future");

let currentPageReloadId = 0;

class IOSLiveSyncService implements IDeviceLiveSyncService {
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
		private $childProcess: IChildProcess,
		private $fs: IFileSystem,
		private $liveSyncProvider: ILiveSyncProvider,
		private $processService: IProcessService) {
		this.device = <Mobile.IiOSDevice>(_device);
	}

	public get debugService(): IDebugService {
		return this.$iOSDebugService;
	}

	public afterInstallApplicationAction(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): IFuture<boolean> {
 		return (() => {
 			return this.$options.watch;
 		}).future<boolean>()();
 	}

	private setupSocketIfNeeded(): IFuture<boolean> {
		return (() => {
			if (this.socket) {
				return true;
			}

			if (this.device.isEmulator) {
				this.$iOSEmulatorServices.postDarwinNotification(this.$iOSNotification.attachRequest).wait();
				try {
					this.socket = helpers.connectEventuallyUntilTimeout(() => net.connect(IOSLiveSyncService.BACKEND_PORT), 5000).wait();
				} catch (e) {
					this.$logger.debug(e);
					return false;
				}
			} else {
				let timeout = 9000;
				this.$iOSSocketRequestExecutor.executeAttachRequest(this.device, timeout).wait();
				this.socket = this.device.connectToPort(IOSLiveSyncService.BACKEND_PORT);
			}

			this.attachEventHandlers();

			return true;
 		}).future<boolean>()();
	}

	public removeFiles(appIdentifier: string, localToDevicePaths: Mobile.ILocalToDevicePathData[]): IFuture<void> {
		return (() => {
			_.each(localToDevicePaths, localToDevicePathData => this.device.fileSystem.deleteFile(localToDevicePathData.getDevicePath(), appIdentifier));
		}).future<void>()();
	}

	public refreshApplication(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], forceExecuteFullSync: boolean): IFuture<void> {
		return (() => {
			if (forceExecuteFullSync) {
				this.restartApplication(deviceAppData).wait();
				return;
			}
			let scriptRelatedFiles: Mobile.ILocalToDevicePathData[] = [];
			let scriptFiles = _.filter(localToDevicePaths, localToDevicePath => _.endsWith(localToDevicePath.getDevicePath(), ".js"));
			constants.LIVESYNC_EXCLUDED_FILE_PATTERNS.forEach(pattern => scriptRelatedFiles = _.concat(scriptRelatedFiles, localToDevicePaths.filter(file => minimatch(file.getDevicePath(), pattern, { nocase: true }))));

			let otherFiles = _.difference(localToDevicePaths, _.concat(scriptFiles, scriptRelatedFiles));
			let shouldRestart = _.some(otherFiles, (localToDevicePath: Mobile.ILocalToDevicePathData) => !this.$liveSyncProvider.canExecuteFastSync(localToDevicePath.getLocalPath(), deviceAppData.platform));

			if (shouldRestart || (!this.$options.liveEdit && scriptFiles.length)) {
				this.restartApplication(deviceAppData).wait();
				return;
			}

			if (this.setupSocketIfNeeded().wait()) {
				this.liveEdit(scriptFiles);
				this.reloadPage(deviceAppData, otherFiles).wait();
			} else {
				this.restartApplication(deviceAppData).wait();
			}
		}).future<void>()();
	}

	private restartApplication(deviceAppData: Mobile.IDeviceAppData): IFuture<void> {
		let projectData: IProjectData = this.$injector.resolve("projectData");
		return this.device.applicationManager.restartApplication(deviceAppData.appIdentifier, projectData.projectName);
	}

	private reloadPage(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): IFuture<void> {
		return (() => {
			if (localToDevicePaths.length) {
				let message = JSON.stringify({
					method: "Page.reload",
					params: {
						ignoreCache: false
					},
					id: ++currentPageReloadId
				});

				this.sendMessage(message).wait();
			}
		}).future<void>()();
	}

	private liveEdit(localToDevicePaths: Mobile.ILocalToDevicePathData[]): IFuture<void> {
		return (() => {
			_.each(localToDevicePaths, localToDevicePath => {
				let content = this.$fs.readText(localToDevicePath.getLocalPath());
				let message = JSON.stringify({
					method: "Debugger.setScriptSource",
					params: {
						scriptUrl: localToDevicePath.getRelativeToProjectBasePath(),
						scriptSource: content
					},
					id: ++currentPageReloadId
				});

				this.sendMessage(message).wait();
			});
		}).future<void>()();
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

		this.socket.on("data", (data: NodeBuffer|string) => {
			this.$logger.trace(`Socket sent data: ${data.toString()}`);
		});
	}

	private sendMessage(message: string): IFuture<void> {
		return (() => {
			let socketWriteFuture = new Future<void>();
			try {
				let length = Buffer.byteLength(message, "utf16le");
				let payload = new Buffer(length + 4);
				payload.writeInt32BE(length, 0);
				payload.write(message, 4, length, "utf16le");

				this.socket.once("error", (error: Error) => {
					if (!socketWriteFuture.isResolved()) {
						socketWriteFuture.throw(error);
					}
				});

				this.socket.write(payload, "utf16le", () => {
					this.socket.removeAllListeners("error");

					if (!socketWriteFuture.isResolved()) {
						socketWriteFuture.return();
					}
				});

				socketWriteFuture.wait();
			} catch(error) {
				this.$logger.trace("Error while sending message:", error);
				this.destroySocket();
			}
		}).future<void>()();
	}

	private destroySocket(): void {
		if(this.socket) {
			this.socket.destroy();
			this.socket = null;
		}
	}
}
$injector.register("iosLiveSyncServiceLocator", {factory: IOSLiveSyncService});
