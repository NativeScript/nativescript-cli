import { DeviceBase } from "../device-base";
import * as net from "net";

export abstract class IOSDeviceBase extends DeviceBase implements Mobile.IiOSDevice {
	protected abstract $iOSDebuggerPortService: IIOSDebuggerPortService;
	protected abstract $processService: IProcessService;
	protected abstract async getSocketCore(appId: string): Promise<net.Socket>;

	protected async getDebugSocketCore(appId: string): Promise<net.Socket> {
		return this.getSocketCore(appId);
	}
	protected async getLiveSyncSocketCore(appId: string): Promise<net.Socket> {
		return this.getSocketCore(appId);
	}

	protected async getDebuggerPort(appId: string): Promise<number> {
		const port = await this.$iOSDebuggerPortService.getPort({ deviceId: this.deviceInfo.identifier, appId });
		if (!port) {
			this.$errors.failWithoutHelp("Device socket port cannot be found.");
		}

		return port;
	}
}
