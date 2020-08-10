import { EventEmitter } from "events";
import { DEVICE_LOG_EVENT_NAME } from "../../../common/constants";
import { injector } from "../../../common/yok";

export class PreviewAppLogProvider extends EventEmitter implements IPreviewAppLogProvider {
	public logData(log: string, deviceName: string, deviceId: string): void {
		const message = `LOG from device ${deviceName}: ${log}`;
		this.emit(DEVICE_LOG_EVENT_NAME, deviceId, message);
	}
}
injector.register("previewAppLogProvider", PreviewAppLogProvider);
