import * as constants from "../../common/constants";

export class IOSSocketRequestExecutor implements IiOSSocketRequestExecutor {
	constructor(private $errors: IErrors,
		private $iOSNotification: IiOSNotification,
		private $iOSNotificationService: IiOSNotificationService,
		private $logger: ILogger) { }

	public async executeAttachRequest(device: Mobile.IiOSDevice, timeout: number, projectId: string): Promise<void> {
		const deviceIdentifier = device.deviceInfo.identifier;

		const observeNotificationPromises = [
			await this.$iOSNotificationService.subscribeForNotification(deviceIdentifier, this.$iOSNotification.alreadyConnected, timeout),
			await this.$iOSNotificationService.subscribeForNotification(deviceIdentifier, this.$iOSNotification.readyForAttach, timeout),
			await this.$iOSNotificationService.subscribeForNotification(deviceIdentifier, this.$iOSNotification.attachAvailable, timeout)
		];

		// Trigger the notifications update.
		await this.$iOSNotificationService.postNotification(deviceIdentifier, this.$iOSNotification.attachAvailabilityQuery, constants.IOS_POST_NOTIFICATION_COMMAND_TYPE);

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
				await this.executeAttachAvailable(deviceIdentifier, timeout);
				break;
			case this.$iOSNotification.getReadyForAttach(projectId):
				break;
			default:
				this.$logger.trace("Response from attach availability query:");
				this.$logger.trace(receivedNotification);
				this.$errors.failWithoutHelp("No notification received while executing attach request.");
		}
	}

	public async executeLaunchRequest(deviceIdentifier: string, timeout: number, readyForAttachTimeout: number, shouldBreak?: boolean): Promise<void> {
		try {
			const appLaunchingPromise = await this.$iOSNotificationService.subscribeForNotification(deviceIdentifier, this.$iOSNotification.appLaunching, timeout);
			await appLaunchingPromise;
				if (shouldBreak) {
				await this.$iOSNotificationService.postNotification(deviceIdentifier, this.$iOSNotification.waitForDebug, constants.IOS_POST_NOTIFICATION_COMMAND_TYPE);
			}

			// We need to send the ObserveNotification ReadyForAttach before we post the AttachRequest.
			const readyForAttachPromise = await this.$iOSNotificationService.subscribeForNotification(deviceIdentifier, this.$iOSNotification.readyForAttach, readyForAttachTimeout);

			await this.$iOSNotificationService.postNotification(deviceIdentifier, this.$iOSNotification.attachRequest, constants.IOS_POST_NOTIFICATION_COMMAND_TYPE);
			await readyForAttachPromise;
		} catch (e) {
			this.$logger.trace("Launch request error:");
			this.$logger.trace(e);
			this.$errors.failWithoutHelp("Error while waiting for response from NativeScript runtime.");
		}
	}

	private async executeAttachAvailable(deviceIdentifier: string, timeout: number): Promise<void> {
		try {
			// We should create this promise here because we need to send the ObserveNotification on the device
			// before we send the PostNotification.
			const readyForAttachPromise = await this.$iOSNotificationService.subscribeForNotification(deviceIdentifier, this.$iOSNotification.readyForAttach, timeout);
			await this.$iOSNotificationService.postNotification(deviceIdentifier, this.$iOSNotification.attachRequest);
			await readyForAttachPromise;
		} catch (e) {
			this.$errors.failWithoutHelp(`The application ${projectId} timed out when performing the socket handshake.`);
		}
	}
}

$injector.register("iOSSocketRequestExecutor", IOSSocketRequestExecutor);
