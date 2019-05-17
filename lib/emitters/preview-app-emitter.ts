import { EventEmitter } from "events";
import { PreviewAppLiveSyncEvents } from "../services/livesync/playground/preview-app-constants";

export class PreviewAppEmitter extends EventEmitter {
	public emitPreviewAppLiveSyncError(data: IPreviewAppLiveSyncData, deviceId: string, error: Error, platform?: string) {
		this.emit(PreviewAppLiveSyncEvents.PREVIEW_APP_LIVE_SYNC_ERROR, {
			error,
			data,
			platform,
			deviceId
		});
	}
}
$injector.register("previewAppEmitter", PreviewAppEmitter);
