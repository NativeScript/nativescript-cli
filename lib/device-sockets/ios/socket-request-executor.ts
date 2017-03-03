import * as iOSProxyServices from "../../common/mobile/ios/device/ios-proxy-services";

export class IOSSocketRequestExecutor implements IiOSSocketRequestExecutor {
	constructor(private $errors: IErrors,
		private $injector: IInjector,
		private $iOSNotification: IiOSNotification,
		private $iOSNotificationService: IiOSNotificationService,
		private $logger: ILogger) { }

	public async executeAttachRequest(device: Mobile.IiOSDevice, timeout: number, projectId: string): Promise<void> {
		let npc = new iOSProxyServices.NotificationProxyClient(device, this.$injector);

		let data = [this.$iOSNotification.getAlreadyConnected(projectId), this.$iOSNotification.getReadyForAttach(projectId), this.$iOSNotification.getAttachAvailable(projectId)]
			.map((notification) => this.$iOSNotificationService.awaitNotification(npc, notification, timeout)),
			alreadyConnected = data[0],
			readyForAttach = data[1],
			attachAvailable = data[2];

		npc.postNotificationAndAttachForData(this.$iOSNotification.getAttachAvailabilityQuery(projectId));

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
				await this.executeAttachAvailable(npc, timeout, projectId);
				break;
			case this.$iOSNotification.getReadyForAttach(projectId):
				break;
		}
	}

	public async executeLaunchRequest(device: Mobile.IiOSDevice, timeout: number, readyForAttachTimeout: number, projectId: string, shouldBreak?: boolean): Promise<void> {
		let npc = new iOSProxyServices.NotificationProxyClient(device, this.$injector);

		try {
			await this.$iOSNotificationService.awaitNotification(npc, this.$iOSNotification.getAppLaunching(projectId), timeout);
			process.nextTick(() => {
				if (shouldBreak) {
					npc.postNotificationAndAttachForData(this.$iOSNotification.getWaitForDebug(projectId));
				}

				npc.postNotificationAndAttachForData(this.$iOSNotification.getAttachRequest(projectId));
			});

			await this.$iOSNotificationService.awaitNotification(npc, this.$iOSNotification.getReadyForAttach(projectId), readyForAttachTimeout);
		} catch (e) {
			this.$logger.trace(`Timeout error: ${e}`);
			this.$errors.failWithoutHelp("Timeout waiting for response from NativeScript runtime.");
		}
	}

	private async executeAttachAvailable(npc: Mobile.INotificationProxyClient, timeout: number, projectId: string): Promise<void> {
		process.nextTick(() => npc.postNotificationAndAttachForData(this.$iOSNotification.getAttachRequest(projectId)));
		try {
			await this.$iOSNotificationService.awaitNotification(npc, this.$iOSNotification.getReadyForAttach(projectId), timeout);
		} catch (e) {
			this.$errors.failWithoutHelp(`The application ${projectId} timed out when performing the socket handshake.`);
		}
	}
}

$injector.register("iOSSocketRequestExecutor", IOSSocketRequestExecutor);
