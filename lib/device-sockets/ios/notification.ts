export class IOSNotification implements IiOSNotification {
	private static WAIT_FOR_DEBUG_NOTIFICATION_NAME = "WaitForDebugger";
	private static ATTACH_REQUEST_NOTIFICATION_NAME = "AttachRequest";
	private static APP_LAUNCHING_NOTIFICATION_NAME = "AppLaunching";
	private static READY_FOR_ATTACH_NOTIFICATION_NAME = "ReadyForAttach";
	private static ATTACH_AVAILABILITY_QUERY_NOTIFICATION_NAME = "AttachAvailabilityQuery";
	private static ALREADY_CONNECTED_NOTIFICATION_NAME = "AlreadyConnected";
	private static ATTACH_AVAILABLE_NOTIFICATION_NAME = "AttachAvailable";

	constructor(private $projectData: IProjectData) { }

	public get waitForDebug() {
		return this.formatNotification(IOSNotification.WAIT_FOR_DEBUG_NOTIFICATION_NAME);
	}

	public get attachRequest(): string {
		return this.formatNotification(IOSNotification.ATTACH_REQUEST_NOTIFICATION_NAME);
	}

	public get appLaunching(): string {
		return this.formatNotification(IOSNotification.APP_LAUNCHING_NOTIFICATION_NAME);
	}

	public get readyForAttach(): string {
		return this.formatNotification(IOSNotification.READY_FOR_ATTACH_NOTIFICATION_NAME);
	}

	public get attachAvailabilityQuery() {
		return this.formatNotification(IOSNotification.ATTACH_AVAILABILITY_QUERY_NOTIFICATION_NAME);
	}

	public get alreadyConnected() {
		return this.formatNotification(IOSNotification.ALREADY_CONNECTED_NOTIFICATION_NAME);
	}

	public get attachAvailable() {
		return this.formatNotification(IOSNotification.ATTACH_AVAILABLE_NOTIFICATION_NAME);
	}

	private formatNotification(notification: string) {
		return `${this.$projectData.projectId}:NativeScript.Debug.${notification}`;
	}
}
$injector.register("iOSNotification", IOSNotification);
