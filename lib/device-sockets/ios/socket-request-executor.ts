import * as constants from "../../common/constants";

export class IOSSocketRequestExecutor implements IiOSSocketRequestExecutor {
	constructor(private $errors: IErrors,
		private $iOSNotification: IiOSNotification,
		private $iOSNotificationService: IiOSNotificationService) { }

	public async executeAttachRequest(device: Mobile.IiOSDevice, timeout: number, appId: string): Promise<void> {
		const deviceIdentifier = device.deviceInfo.identifier;
		try {
			// We should create this promise here because we need to send the ObserveNotification on the device
			// before we send the PostNotification.
			const readyForAttachSocket = await this.$iOSNotificationService.postNotification(deviceIdentifier, this.$iOSNotification.getReadyForAttach(appId), constants.IOS_OBSERVE_NOTIFICATION_COMMAND_TYPE);
			const readyForAttachPromise = this.$iOSNotificationService.awaitNotification(deviceIdentifier, +readyForAttachSocket, timeout);
			await this.$iOSNotificationService.postNotification(deviceIdentifier, this.$iOSNotification.getAttachRequest(appId, deviceIdentifier));
			await readyForAttachPromise;
		} catch (e) {
			this.$errors.fail(`The application ${appId} does not appear to be running on ${deviceIdentifier} or is not built with debugging enabled. Try starting the application manually.`);
		}
	}

	public async executeRefreshRequest(device: Mobile.IiOSDevice, appId: string): Promise<void> {
		await this.$iOSNotificationService.postNotification(
			device.deviceInfo.identifier, this.$iOSNotification.getRefreshRequest(appId));
	}
}

$injector.register("iOSSocketRequestExecutor", IOSSocketRequestExecutor);
