import * as constants from "../../common/constants";

export class IOSSocketRequestExecutor implements IiOSSocketRequestExecutor {
	constructor(private $errors: IErrors,
		private $iOSNotification: IiOSNotification,
		private $iOSNotificationService: IiOSNotificationService) { }

	public async executeAttachRequest(device: Mobile.IiOSDevice, timeout: number, projectId: string): Promise<void> {
		const deviceIdentifier = device.deviceInfo.identifier;
		try {
			// We should create this promise here because we need to send the ObserveNotification on the device
			// before we send the PostNotification.
			const readyForAttachSocket = await this.$iOSNotificationService.postNotification(deviceIdentifier, this.$iOSNotification.getReadyForAttach(projectId), constants.IOS_OBSERVE_NOTIFICATION_COMMAND_TYPE);
			const readyForAttachPromise = this.$iOSNotificationService.awaitNotification(deviceIdentifier, +readyForAttachSocket, timeout);
			await this.$iOSNotificationService.postNotification(deviceIdentifier, this.$iOSNotification.getAttachRequest(projectId, deviceIdentifier));
			await readyForAttachPromise;
		} catch (e) {
			this.$errors.fail(`The application ${projectId} does not appear to be running on ${deviceIdentifier} or is not built with debugging enabled. Try starting the application manually.`);
		}
	}
}

$injector.register("iOSSocketRequestExecutor", IOSSocketRequestExecutor);
