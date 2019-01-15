import * as net from "net";
import { performanceLog } from "../../decorators";

export abstract class IOSDeviceBase implements Mobile.IiOSDevice {
	private cachedSockets: IDictionary<net.Socket> = {};
	protected abstract $errors: IErrors;
	protected abstract $deviceLogProvider: Mobile.IDeviceLogProvider;
	protected abstract $iOSDebuggerPortService: IIOSDebuggerPortService;
	protected abstract $processService: IProcessService;
	protected abstract $lockService: ILockService;
	abstract deviceInfo: Mobile.IDeviceInfo;
	abstract applicationManager: Mobile.IDeviceApplicationManager;
	abstract fileSystem: Mobile.IDeviceFileSystem;
	abstract isEmulator: boolean;
	abstract openDeviceLogStream(options?: Mobile.IiOSLogStreamOptions): Promise<void>;

	public getApplicationInfo(applicationIdentifier: string): Promise<Mobile.IApplicationInfo> {
		return this.applicationManager.getApplicationInfo(applicationIdentifier);
	}

	@performanceLog()
	public async getDebugSocket(appId: string, projectName: string): Promise<net.Socket> {
		return this.$lockService.executeActionWithLock(async () => {
			if (this.cachedSockets[appId]) {
				return this.cachedSockets[appId];
			}

			this.cachedSockets[appId] = await this.getDebugSocketCore(appId, projectName);

			if (this.cachedSockets[appId]) {
				this.cachedSockets[appId].on("close", () => {
					this.destroyDebugSocket(appId);
				});

				this.$processService.attachToProcessExitSignals(this, () => this.destroyDebugSocket(appId));
			}

			return this.cachedSockets[appId];
		}, "ios-debug-socket.lock");
	}

	protected abstract async getDebugSocketCore(appId: string, projectName: string): Promise<net.Socket>;

	protected async attachToDebuggerFoundEvent(projectName: string): Promise<void> {
		await this.startDeviceLogProcess(projectName);
		await this.$iOSDebuggerPortService.attachToDebuggerPortFoundEvent();
	}

	protected async getDebuggerPort(appId: string): Promise<number> {
		const port = await this.$iOSDebuggerPortService.getPort({ deviceId: this.deviceInfo.identifier, appId });
		if (!port) {
			this.$errors.failWithoutHelp("Device socket port cannot be found.");
		}

		return port;
	}

	public destroyAllSockets() {
		for (const appId in this.cachedSockets) {
			this.destroySocketSafe(this.cachedSockets[appId]);
		}

		this.cachedSockets = {};
	}

	public destroyDebugSocket(appId: string) {
		this.destroySocketSafe(this.cachedSockets[appId]);
		this.cachedSockets[appId] = null;
	}

	private destroySocketSafe(socket: net.Socket) {
		if (socket && !socket.destroyed) {
			socket.destroy();
		}
	}

	private async startDeviceLogProcess(projectName: string): Promise<void> {
		if (projectName) {
			this.$deviceLogProvider.setProjectNameForDevice(this.deviceInfo.identifier, projectName);
		}

		await this.openDeviceLogStream();
	}
}
