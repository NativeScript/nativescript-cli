import * as net from "net";

export abstract class IOSDeviceBase implements Mobile.IiOSDevice {
	private cachedSockets: IDictionary<net.Socket> = {};
	protected abstract $errors: IErrors;
	protected abstract $iOSDebuggerPortService: IIOSDebuggerPortService;
	protected abstract $processService: IProcessService;
	abstract deviceInfo: Mobile.IDeviceInfo;
	abstract applicationManager: Mobile.IDeviceApplicationManager;
	abstract fileSystem: Mobile.IDeviceFileSystem;
	abstract isEmulator: boolean;
	abstract openDeviceLogStream(): Promise<void>;

	public getApplicationInfo(applicationIdentifier: string): Promise<Mobile.IApplicationInfo> {
		return this.applicationManager.getApplicationInfo(applicationIdentifier);
	}

	public async getLiveSyncSocket(appId: string): Promise<net.Socket> {
		return this.getSocket(appId);
	}

	public async getDebugSocket(appId: string): Promise<net.Socket> {
		return this.getSocket(appId);
	}

	public async getSocket(appId: string): Promise<net.Socket> {
		if (this.cachedSockets[appId]) {
			return this.cachedSockets[appId];
		}

		this.cachedSockets[appId] = await this.getSocketCore(appId);

		if (this.cachedSockets[appId]) {
			this.cachedSockets[appId].on("close", () => {
				this.destroySocket(appId);
			});

			this.$processService.attachToProcessExitSignals(this, () => this.destroySocket(appId));
		}

		return this.cachedSockets[appId];
	}

	public destroyLiveSyncSocket(appId: string) {
		this.destroySocket(appId);
	}

	public destroyDebugSocket(appId: string) {
		this.destroySocket(appId);
	}

	protected abstract async getSocketCore(appId: string): Promise<net.Socket>;

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

	private destroySocket(appId: string) {
		this.destroySocketSafe(this.cachedSockets[appId]);
		this.cachedSockets[appId] = null;
	}

	private destroySocketSafe(socket: net.Socket) {
		if (socket && !socket.destroyed) {
			socket.destroy();
		}
	}
}
