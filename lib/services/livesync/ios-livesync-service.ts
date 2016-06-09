import liveSyncServiceBaseLib = require("./livesync-service-base");
import * as helpers from "../../common/helpers";
import * as net from "net";

let currentPageReloadId = 0;

class IOSLiveSyncService extends liveSyncServiceBaseLib.LiveSyncServiceBase<Mobile.IiOSDevice> implements IPlatformLiveSyncService {
	private static BACKEND_PORT = 18181;
	private socket: net.Socket;

	constructor(_device: Mobile.IDevice,
		private $iOSSocketRequestExecutor: IiOSSocketRequestExecutor,
		private $iOSNotification: IiOSNotification,
		private $iOSEmulatorServices: Mobile.IiOSSimulatorService,
		private $injector: IInjector,
		private $logger: ILogger,
		private $options: IOptions) {
			super(_device);
		}

	public removeFiles(appIdentifier: string, localToDevicePaths: Mobile.ILocalToDevicePathData[]): IFuture<void> {
		return (() => {
			_.each(localToDevicePaths, localToDevicePathData => this.device.fileSystem.deleteFile(localToDevicePathData.getDevicePath(), appIdentifier));
		}).future<void>()();
	}

	protected restartApplication(deviceAppData: Mobile.IDeviceAppData): IFuture<void> {
		let projectData: IProjectData = this.$injector.resolve("projectData");
		return this.device.applicationManager.restartApplication(deviceAppData.appIdentifier, projectData.projectName);
	}

	protected reloadPage(deviceAppData: Mobile.IDeviceAppData): IFuture<void> {
		return (() => {
			let timeout = 9000;
			if (this.device.isEmulator) {
				if (!this.socket) {
					helpers.connectEventually(() => net.connect(IOSLiveSyncService.BACKEND_PORT), (socket: net.Socket) => {
						this.socket = socket;
						this.attachEventHandlersIfNecessary();
						this.sendPageReloadMessage();
					});
				} else {
					this.sendPageReloadMessage();
				}
			 	this.$iOSEmulatorServices.postDarwinNotification(this.$iOSNotification.attachRequest).wait();
			} else {
				if(!this.socket) {
					this.$iOSSocketRequestExecutor.executeAttachRequest(this.device, timeout).wait();
					this.socket = this.device.connectToPort(IOSLiveSyncService.BACKEND_PORT);
					this.attachEventHandlersIfNecessary();
				}
				this.sendPageReloadMessage();
			}
		}).future<void>()();
	}

	private attachEventHandlersIfNecessary(): void {
		if(this.$options.watch) {
			this.attachProcessExitHandlers();
			this.attachSocketCloseEvent();
		}
	}

	private attachSocketCloseEvent(): void {
		this.socket.on("close", (hadError: boolean) => {
			this.$logger.trace(`Socket closed, hadError is ${hadError}.`);
			this.socket = null;
		});
	}

	private sendPageReloadMessage(): void {
		try {
			this.sendPageReloadMessageCore();
			this.socket.on("data", (data: NodeBuffer|string) => {
				this.$logger.trace(`Socket sent data: ${data.toString()}`);
				this.destroySocketIfNecessary();
			});
		} catch(err) {
			this.$logger.trace("Error while sending page reload:", err);
			this.destroySocketIfNecessary();
		}
	}

	private sendPageReloadMessageCore(): void {
		let message = `{ "method":"Page.reload","params":{"ignoreCache":false},"id":${++currentPageReloadId} }`;
		let length = Buffer.byteLength(message, "utf16le");
		let payload = new Buffer(length + 4);
		payload.writeInt32BE(length, 0);
		payload.write(message, 4, length, "utf16le");
		this.socket.write(payload);
	}

	private attachProcessExitHandlers(): void {
		process.on("exit", (exitCode: number) => {
			this.destroySocket();
		});

		process.on("SIGTERM", () => {
			this.destroySocket();
		});

		process.on("SIGINT", () => {
			this.destroySocket();
		});
	}

	private destroySocketIfNecessary(): void {
		if(!this.$options.watch) {
			this.destroySocket();
		}
	}

	private destroySocket(): void {
		if(this.socket) {
			this.socket.destroy();
			this.socket = null;
		}
	}
}
$injector.register("iosLiveSyncServiceLocator", {factory: IOSLiveSyncService});
