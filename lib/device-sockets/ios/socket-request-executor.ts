import * as constants from "../../common/constants";

export class IOSSocketRequestExecutor implements IiOSSocketRequestExecutor {
	constructor(private $errors: IErrors,
		private $iOSNotification: IiOSNotification,
		private $iOSNotificationService: IiOSNotificationService,
		private $logger: ILogger,
		private $iosDeviceOperations: IIOSDeviceOperations) {
		this.$iosDeviceOperations.setShouldDispose(false);
	}

	public async executeAttachRequest(device: Mobile.IiOSDevice, timeout: number, projectId: string): Promise<void> {
		const deviceIdentifier = device.deviceInfo.identifier;

		const observeNotificationSockets = [
			await this.$iOSNotificationService.postNotification(deviceIdentifier, this.$iOSNotification.getAlreadyConnected(projectId), constants.IOS_OBSERVE_NOTIFICATION_COMMAND_TYPE),
			await this.$iOSNotificationService.postNotification(deviceIdentifier, this.$iOSNotification.getReadyForAttach(projectId), constants.IOS_OBSERVE_NOTIFICATION_COMMAND_TYPE),
			await this.$iOSNotificationService.postNotification(deviceIdentifier, this.$iOSNotification.getAttachAvailable(projectId), constants.IOS_OBSERVE_NOTIFICATION_COMMAND_TYPE)
		];

		const observeNotificationPromises = _(observeNotificationSockets)
			.uniq()
			.map(s => {
				return this.$iOSNotificationService.awaitNotification(deviceIdentifier, +s, timeout);
			})
			.value();

		// Trigger the notifications update.
		await this.$iOSNotificationService.postNotification(deviceIdentifier, this.$iOSNotification.getAttachAvailabilityQuery(projectId));

		let receivedNotification: string;
		try {
			receivedNotification = await Promise.race(observeNotificationPromises);
		} catch (e) {
			this.$errors.failWithoutHelp(`The application ${projectId} does not appear to be running on ${device.deviceInfo.displayName} or is not built with debugging enabled.`);
		}

		switch (receivedNotification) {
			case this.$iOSNotification.getAlreadyConnected(projectId):
				this.$errors.failWithoutHelp("A client is already connected.");
				break;
			case this.$iOSNotification.getAttachAvailable(projectId):
				await this.executeAttachAvailable(deviceIdentifier, projectId, timeout);
				break;
			case this.$iOSNotification.getReadyForAttach(projectId):
				break;
			default:
				this.$logger.trace("Response from attach availability query:");
				this.$logger.trace(receivedNotification);
				this.$errors.failWithoutHelp("No notification received while executing attach request.");
		}
	}

	public async executeLaunchRequest(deviceIdentifier: string, timeout: number, readyForAttachTimeout: number, projectId: string, shouldBreak?: boolean): Promise<void> {
		try {
			const appLaunchingSocket = await this.$iOSNotificationService.postNotification(deviceIdentifier, this.$iOSNotification.getAppLaunching(projectId), constants.IOS_OBSERVE_NOTIFICATION_COMMAND_TYPE);
			await this.$iOSNotificationService.awaitNotification(deviceIdentifier, +appLaunchingSocket, timeout);

			if (shouldBreak) {
				await this.$iOSNotificationService.postNotification(deviceIdentifier, this.$iOSNotification.getWaitForDebug(projectId));
			}

			// We need to send the ObserveNotification ReadyForAttach before we post the AttachRequest.
			const readyForAttachSocket = await this.$iOSNotificationService.postNotification(deviceIdentifier, this.$iOSNotification.getReadyForAttach(projectId), constants.IOS_OBSERVE_NOTIFICATION_COMMAND_TYPE);
			const readyForAttachPromise = this.$iOSNotificationService.awaitNotification(deviceIdentifier, +readyForAttachSocket, readyForAttachTimeout);

			await this.$iOSNotificationService.postNotification(deviceIdentifier, this.$iOSNotification.getAttachRequest(projectId));
			await readyForAttachPromise;
		} catch (e) {
			this.$logger.trace("Launch request error:");
			this.$logger.trace(e);
			this.$errors.failWithoutHelp("Error while waiting for response from NativeScript runtime.");
		}
	}

	private async executeAttachAvailable(deviceIdentifier: string, projectId: string, timeout: number): Promise<void> {
		try {
			// We should create this promise here because we need to send the ObserveNotification on the device
			// before we send the PostNotification.
			const readyForAttachSocket = await this.$iOSNotificationService.postNotification(deviceIdentifier, this.$iOSNotification.getReadyForAttach(projectId), constants.IOS_OBSERVE_NOTIFICATION_COMMAND_TYPE);
			const readyForAttachPromise = this.$iOSNotificationService.awaitNotification(deviceIdentifier, +readyForAttachSocket, timeout);
			await this.$iOSNotificationService.postNotification(deviceIdentifier, this.$iOSNotification.getAttachRequest(projectId));
			await readyForAttachPromise;
		} catch (e) {
			this.$errors.failWithoutHelp(`The application ${projectId} timed out when performing the socket handshake.`);
		}
	}
}

$injector.register("iOSSocketRequestExecutor", IOSSocketRequestExecutor);
