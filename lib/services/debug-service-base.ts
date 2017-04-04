import { EventEmitter } from "events";

export abstract class DebugServiceBase extends EventEmitter implements IPlatformDebugService {
	public abstract get platform(): string;

	public abstract async debug(debugData: IDebugData, debugOptions: IDebugOptions): Promise<string[]>;

	public abstract async debugStart(debugData: IDebugData, debugOptions: IDebugOptions): Promise<void>;

	public abstract async debugStop(): Promise<void>;

	protected getCanExecuteAction(deviceIdentifier: string): (device: Mobile.IDevice) => boolean {
		return (device: Mobile.IDevice): boolean => {
			if (deviceIdentifier) {
				return device.deviceInfo.identifier === deviceIdentifier;
			} else {
				return true;
			}
		};
	}
}
