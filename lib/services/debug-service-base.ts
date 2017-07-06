import { EventEmitter } from "events";

export abstract class DebugServiceBase extends EventEmitter implements IPlatformDebugService {
	constructor(protected $devicesService: Mobile.IDevicesService) { super(); }

	public abstract get platform(): string;

	public abstract async debug(debugData: IDebugData, debugOptions: IDebugOptions): Promise<string>;

	public abstract async debugStart(debugData: IDebugData, debugOptions: IDebugOptions): Promise<void>;

	public abstract async debugStop(): Promise<void>;

	protected getCanExecuteAction(deviceIdentifier: string): (device: Mobile.IDevice) => boolean {
		return (device: Mobile.IDevice): boolean => {
			if (deviceIdentifier) {
				let isSearchedDevice = device.deviceInfo.identifier === deviceIdentifier;
				if (!isSearchedDevice) {
					const deviceByDeviceOption = this.$devicesService.getDeviceByDeviceOption();
					isSearchedDevice = deviceByDeviceOption && device.deviceInfo.identifier === deviceByDeviceOption.deviceInfo.identifier;
				}

				return isSearchedDevice;
			} else {
				return true;
			}
		};
	}
}
