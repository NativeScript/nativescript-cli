import * as helpers from "../../common/helpers";
import * as iOSProxyServices from "../../common/mobile/ios/device/ios-proxy-services";

export class IOSSocketRequestExecutor implements IiOSSocketRequestExecutor {
	constructor(private $errors: IErrors,
		private $injector: IInjector,
		private $iOSNotification: IiOSNotification,
		private $iOSNotificationService: IiOSNotificationService,
		private $logger: ILogger,
		private $projectData: IProjectData) { }

	public executeAttachRequest(device: Mobile.IiOSDevice, timeout: number): IFuture<void> {
		return (() => {
			let npc = new iOSProxyServices.NotificationProxyClient(device, this.$injector);

			let data = [this.$iOSNotification.alreadyConnected, this.$iOSNotification.readyForAttach, this.$iOSNotification.attachAvailable]
				.map((notification) => this.$iOSNotificationService.awaitNotification(npc, notification, timeout)),
				alreadyConnected = data[0],
				readyForAttach = data[1],
				attachAvailable = data[2];

			npc.postNotificationAndAttachForData(this.$iOSNotification.attachAvailabilityQuery);

			let receivedNotification: IFuture<string>;
			try {
				receivedNotification = helpers.whenAny(alreadyConnected, readyForAttach, attachAvailable).wait();
			} catch (e) {
				this.$errors.failWithoutHelp(`The application ${this.$projectData.projectId} does not appear to be running on ${device.deviceInfo.displayName} or is not built with debugging enabled.`);
			}

			switch (receivedNotification) {
				case alreadyConnected:
					this.$errors.failWithoutHelp("A client is already connected.");
					break;
				case attachAvailable:
					this.executeAttachAvailable(npc, timeout).wait();
					break;
				case readyForAttach:
					break;
			}
		}).future<void>()();
	}

	public executeLaunchRequest(device: Mobile.IiOSDevice, timeout: number, readyForAttachTimeout: number, shouldBreak?: boolean): IFuture<void> {
		return (() => {
			let npc = new iOSProxyServices.NotificationProxyClient(device, this.$injector);

			try {
				this.$iOSNotificationService.awaitNotification(npc, this.$iOSNotification.appLaunching, timeout).wait();
				process.nextTick(() => {
					if(shouldBreak) {
						npc.postNotificationAndAttachForData(this.$iOSNotification.waitForDebug );
					}
					npc.postNotificationAndAttachForData(this.$iOSNotification.attachRequest);
				});

				this.$iOSNotificationService.awaitNotification(npc, this.$iOSNotification.readyForAttach, readyForAttachTimeout).wait();
			} catch(e) {
				this.$logger.trace(`Timeout error: ${e}`);
				this.$errors.failWithoutHelp("Timeout waiting for response from NativeScript runtime.");
			}
		}).future<void>()();
	}

	private executeAttachAvailable(npc: Mobile.INotificationProxyClient, timeout: number): IFuture<void> {
		return (() => {
			process.nextTick(() => npc.postNotificationAndAttachForData(this.$iOSNotification.attachRequest));
			try {
				this.$iOSNotificationService.awaitNotification(npc, this.$iOSNotification.readyForAttach, timeout).wait();
			} catch (e) {
				this.$errors.failWithoutHelp(`The application ${this.$projectData.projectId} timed out when performing the socket handshake.`);
			}
		}).future<void>()();
	}
}
$injector.register("iOSSocketRequestExecutor", IOSSocketRequestExecutor);
