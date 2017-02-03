export class IOSSocketRequestExecutor implements IiOSSocketRequestExecutor {
	constructor(private $errors: IErrors,
		private $iOSNotification: IiOSNotification,
		private $iOSNotificationService: IiOSNotificationService,
		private $logger: ILogger) { }

	public async executeAttachRequest(device: Mobile.IiOSDevice, timeout: number, projectId: string): Promise<void> {

		let data = [this.$iOSNotification.getAlreadyConnected(projectId), this.$iOSNotification.getReadyForAttach(projectId), this.$iOSNotification.getAttachAvailable(projectId)]
			.map((notification) => this.$iOSNotificationService.awaitNotification(device.deviceInfo.identifier, notification, timeout)),
			alreadyConnected = data[0],
			readyForAttach = data[1],
			attachAvailable = data[2];

		await this.$iOSNotificationService.postNotification(device.deviceInfo.identifier, this.$iOSNotification.getAttachAvailabilityQuery(projectId));

		let receivedNotification: string;
		try {
			receivedNotification = await Promise.race([alreadyConnected, readyForAttach, attachAvailable]);
		} catch (e) {
			this.$errors.failWithoutHelp(`The application ${projectId} does not appear to be running on ${device.deviceInfo.displayName} or is not built with debugging enabled.`);
		}

		switch (receivedNotification) {
			case this.$iOSNotification.getAlreadyConnected(projectId):
				this.$errors.failWithoutHelp("A client is already connected.");
				break;
			case this.$iOSNotification.getAttachAvailable(projectId):
				await this.executeAttachAvailable(device.deviceInfo.identifier, timeout);
				break;
			case this.$iOSNotification.getReadyForAttach(projectId):
				break;
		}
	}

	public async executeLaunchRequest(deviceIdentifier: string, timeout: number, readyForAttachTimeout: number, shouldBreak?: boolean): Promise<void> {
		try {
			await this.$iOSNotificationService.awaitNotification(deviceIdentifier, this.$iOSNotification.appLaunching, timeout);
				if (shouldBreak) {
				await this.$iOSNotificationService.postNotification(deviceIdentifier, this.$iOSNotification.waitForDebug);
			}

			// We need to send the ObserveNotification ReadyForAttach before we post the AttachRequest.
			const readyForAttachPromise = this.$iOSNotificationService.awaitNotification(deviceIdentifier, this.$iOSNotification.readyForAttach, readyForAttachTimeout);

			await this.$iOSNotificationService.postNotification(deviceIdentifier, this.$iOSNotification.attachRequest);
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
			const readyForAttachPromise = this.$iOSNotificationService.awaitNotification(deviceIdentifier, this.$iOSNotification.readyForAttach, timeout);
			await this.$iOSNotificationService.postNotification(deviceIdentifier, this.$iOSNotification.attachRequest);
			await readyForAttachPromise;
		} catch (e) {
			this.$errors.failWithoutHelp(`The application ${projectId} timed out when performing the socket handshake.`);
		}
	}
}

$injector.register("iOSSocketRequestExecutor", IOSSocketRequestExecutor);
