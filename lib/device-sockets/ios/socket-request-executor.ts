import * as iOSProxyServices from "../../common/mobile/ios/device/ios-proxy-services";

export class IOSSocketRequestExecutor implements IiOSSocketRequestExecutor {
	constructor(private $errors: IErrors,
		private $injector: IInjector,
		private $iOSNotification: IiOSNotification,
		private $iOSNotificationService: IiOSNotificationService,
		private $logger: ILogger,
		private $projectData: IProjectData) { }

	public async executeAttachRequest(device: Mobile.IiOSDevice, timeout: number): Promise<void> {
		let npc = new iOSProxyServices.NotificationProxyClient(device, this.$injector);

		let data = [this.$iOSNotification.alreadyConnected, this.$iOSNotification.readyForAttach, this.$iOSNotification.attachAvailable]
			.map((notification) => this.$iOSNotificationService.awaitNotification(npc, notification, timeout)),
			alreadyConnected = data[0],
			readyForAttach = data[1],
			attachAvailable = data[2];

		npc.postNotificationAndAttachForData(this.$iOSNotification.attachAvailabilityQuery);

		let receivedNotification: string;
		try {
			receivedNotification = await Promise.race([alreadyConnected, readyForAttach, attachAvailable]);
		} catch (e) {
			this.$errors.failWithoutHelp(`The application ${this.$projectData.projectId} does not appear to be running on ${device.deviceInfo.displayName} or is not built with debugging enabled.`);
		}

		switch (receivedNotification) {
			case this.$iOSNotification.alreadyConnected:
				this.$errors.failWithoutHelp("A client is already connected.");
				break;
			case this.$iOSNotification.attachAvailable:
				await this.executeAttachAvailable(npc, timeout);
				break;
			case this.$iOSNotification.readyForAttach:
				break;
		}
	}

	public async executeLaunchRequest(device: Mobile.IiOSDevice, timeout: number, readyForAttachTimeout: number, shouldBreak?: boolean): Promise<void> {
		let npc = new iOSProxyServices.NotificationProxyClient(device, this.$injector);

		try {
			await this.$iOSNotificationService.awaitNotification(npc, this.$iOSNotification.appLaunching, timeout);
			process.nextTick(() => {
				if (shouldBreak) {
					npc.postNotificationAndAttachForData(this.$iOSNotification.waitForDebug);
				}

				npc.postNotificationAndAttachForData(this.$iOSNotification.attachRequest);
			});

			await this.$iOSNotificationService.awaitNotification(npc, this.$iOSNotification.readyForAttach, readyForAttachTimeout);
		} catch (e) {
			this.$logger.trace(`Timeout error: ${e}`);
			this.$errors.failWithoutHelp("Timeout waiting for response from NativeScript runtime.");
		}
	}

	private async executeAttachAvailable(npc: Mobile.INotificationProxyClient, timeout: number): Promise<void> {
		process.nextTick(() => npc.postNotificationAndAttachForData(this.$iOSNotification.attachRequest));
		try {
			await this.$iOSNotificationService.awaitNotification(npc, this.$iOSNotification.readyForAttach, timeout);
		} catch (e) {
			this.$errors.failWithoutHelp(`The application ${this.$projectData.projectId} timed out when performing the socket handshake.`);
		}
	}
}

$injector.register("iOSSocketRequestExecutor", IOSSocketRequestExecutor);
