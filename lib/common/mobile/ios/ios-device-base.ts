import * as net from "net";
import { performanceLog } from "../../decorators";

export abstract class IOSDeviceBase implements Mobile.IiOSDevice {
	private cachedSockets: IDictionary<net.Socket> = {};
	protected abstract $errors: IErrors;
	protected abstract $deviceLogProvider: Mobile.IDeviceLogProvider;
	protected abstract $iOSDebuggerPortService: IIOSDebuggerPortService;
	protected abstract $lockService: ILockService;
	protected abstract $logger: ILogger;
	abstract deviceInfo: Mobile.IDeviceInfo;
	abstract applicationManager: Mobile.IDeviceApplicationManager;
	abstract fileSystem: Mobile.IDeviceFileSystem;
	abstract isEmulator: boolean;
	abstract openDeviceLogStream(options?: Mobile.IiOSLogStreamOptions): Promise<void>;

	@performanceLog()
	public async getDebugSocket(appId: string, projectName: string, projectDir: string, ensureAppStarted: boolean = false): Promise<net.Socket> {
		return this.$lockService.executeActionWithLock(
			async () => {
				if (this.cachedSockets[appId]) {
					return this.cachedSockets[appId];
				}

				await this.attachToDebuggerFoundEvent(appId, projectName, projectDir);
				try {
					if (ensureAppStarted) {
						await this.applicationManager.startApplication({ appId, projectName, projectDir });
					}
				} catch (err) {
					this.$logger.trace(`Unable to start application ${appId} on device ${this.deviceInfo.identifier} in getDebugSocket method. Error is: ${err}`);
				}

				this.cachedSockets[appId] = await this.getDebugSocketCore(appId);

				if (this.cachedSockets[appId]) {
					this.cachedSockets[appId].on("close", async () => {
						await this.destroyDebugSocket(appId);
					});
				}

				return this.cachedSockets[appId];
			},
			`ios-debug-socket-${this.deviceInfo.identifier}-${appId}.lock`
		);
	}

	protected abstract async getDebugSocketCore(appId: string): Promise<net.Socket>;

	protected async attachToDebuggerFoundEvent(appId: string, projectName: string, projectDir: string): Promise<void> {
		await this.startDeviceLogProcess(projectName, projectDir);
		await this.$iOSDebuggerPortService.attachToDebuggerPortFoundEvent(appId);
	}

	protected async getDebuggerPort(appId: string): Promise<number> {
		const port = await this.$iOSDebuggerPortService.getPort({ deviceId: this.deviceInfo.identifier, appId });
		if (!port) {
			this.$errors.failWithoutHelp("Device socket port cannot be found.");
		}

		return port;
	}

	public async destroyAllSockets(): Promise<void> {
		for (const appId in this.cachedSockets) {
			await this.destroySocketSafe(this.cachedSockets[appId]);
		}

		this.cachedSockets = {};
	}

	public async destroyDebugSocket(appId: string): Promise<void> {
		await this.destroySocketSafe(this.cachedSockets[appId]);
		this.cachedSockets[appId] = null;
	}

	private async destroySocketSafe(socket: net.Socket): Promise<void> {
		if (socket && !socket.destroyed) {
			return new Promise<void>((resolve, reject) => {
				socket.on("close", resolve);
				socket.destroy();
			});
		}
	}

	private async startDeviceLogProcess(projectName: string, projectDir: string): Promise<void> {
		if (projectName) {
			this.$deviceLogProvider.setProjectNameForDevice(this.deviceInfo.identifier, projectName);
			this.$deviceLogProvider.setProjectDirForDevice(this.deviceInfo.identifier, projectDir);
		}

		await this.openDeviceLogStream();
	}
}
