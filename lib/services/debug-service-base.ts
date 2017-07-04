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
				return device.deviceInfo.identifier === deviceIdentifier
				|| device.deviceInfo.identifier === this.$devicesService.getDeviceByDeviceOption().deviceInfo.identifier;
			} else {
				return true;
			}
		};
	}
}
