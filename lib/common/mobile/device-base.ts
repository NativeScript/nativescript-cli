import * as net from "net";

export abstract class DeviceBase implements Mobile.IDevice {
	private cachedSockets: IDictionary<net.Socket> = {};
	protected abstract $errors: IErrors;
	protected abstract $processService: IProcessService;
	abstract applicationManager: Mobile.IDeviceApplicationManager;
	abstract deviceInfo: Mobile.IDeviceInfo;
	abstract fileSystem: Mobile.IDeviceFileSystem;
	abstract isEmulator: boolean;
	abstract openDeviceLogStream(): Promise<void>;

	public getApplicationInfo(applicationIdentifier: string): Promise<Mobile.IApplicationInfo> {
		return this.applicationManager.getApplicationInfo(applicationIdentifier);
	}

	public async getLiveSyncSocket(appId: string): Promise<net.Socket> {
		return this.getSocket(appId, (id) => this.getLiveSyncSocketCore(id));
	}

	public async getDebugSocket(appId: string): Promise<net.Socket> {
		return this.getSocket(appId, this.getDebugSocketCore.bind(this, appId));
	}

	private async getSocket(appId: string, getSocketCore: (appId: string) => Promise<net.Socket>): Promise<net.Socket> {
		if (this.cachedSockets[appId]) {
			return this.cachedSockets[appId];
		}

		this.cachedSockets[appId] = await getSocketCore(appId);

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

	protected abstract async getDebugSocketCore(appId: string): Promise<net.Socket>;
	protected abstract async getLiveSyncSocketCore(appId: string): Promise<net.Socket>;

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
