import { EventEmitter } from "events";
import { ATTACH_REQUEST_EVENT_NAME } from "../../common/constants";

export class IOSNotification extends EventEmitter implements IiOSNotification {
	private static WAIT_FOR_DEBUG_NOTIFICATION_NAME = "WaitForDebugger";
	private static ATTACH_REQUEST_NOTIFICATION_NAME = "AttachRequest";
	private static APP_LAUNCHING_NOTIFICATION_NAME = "AppLaunching";
	private static READY_FOR_ATTACH_NOTIFICATION_NAME = "ReadyForAttach";
	private static ATTACH_AVAILABILITY_QUERY_NOTIFICATION_NAME = "AttachAvailabilityQuery";
	private static ALREADY_CONNECTED_NOTIFICATION_NAME = "AlreadyConnected";
	private static ATTACH_AVAILABLE_NOTIFICATION_NAME = "AttachAvailable";

	public getWaitForDebug(projectId: string) {
		return this.formatNotification(IOSNotification.WAIT_FOR_DEBUG_NOTIFICATION_NAME, projectId);
	}

	public getAttachRequest(appId: string, deviceId: string): string {
		// It could be too early to emit this event, but we rely that if you construct attach request,
		// you will execute it immediately.
		this.emit(ATTACH_REQUEST_EVENT_NAME, { deviceId, appId });
		return this.formatNotification(IOSNotification.ATTACH_REQUEST_NOTIFICATION_NAME, appId);
	}

	public getAppLaunching(projectId: string): string {
		return this.formatNotification(IOSNotification.APP_LAUNCHING_NOTIFICATION_NAME, projectId);
	}

	public getReadyForAttach(projectId: string): string {
		return this.formatNotification(IOSNotification.READY_FOR_ATTACH_NOTIFICATION_NAME, projectId);
	}

	public getAttachAvailabilityQuery(projectId: string) {
		return this.formatNotification(IOSNotification.ATTACH_AVAILABILITY_QUERY_NOTIFICATION_NAME, projectId);
	}

	public getAlreadyConnected(projectId: string) {
		return this.formatNotification(IOSNotification.ALREADY_CONNECTED_NOTIFICATION_NAME, projectId);
	}

	public getAttachAvailable(projectId: string) {
		return this.formatNotification(IOSNotification.ATTACH_AVAILABLE_NOTIFICATION_NAME, projectId);
	}

	private formatNotification(notification: string, projectId: string) {
		return `${projectId}:NativeScript.Debug.${notification}`;
	}
}
$injector.register("iOSNotification", IOSNotification);
