import * as constants from "../../common/constants";
import {
	IiOSSocketRequestExecutor,
	IiOSNotification,
} from "../../declarations";
import { IiOSNotificationService, IErrors } from "../../common/declarations";
import { injector } from "../../common/yok";

export class IOSSocketRequestExecutor implements IiOSSocketRequestExecutor {
	constructor(
		private $errors: IErrors,
		private $iOSNotification: IiOSNotification,
		private $iOSNotificationService: IiOSNotificationService
	) {}

	public async executeAttachRequest(
		device: Mobile.IiOSDevice,
		timeout: number,
		appId: string
	): Promise<void> {
		const deviceId = device.deviceInfo.identifier;
		const mainRequestName = this.$iOSNotification.getAttachRequest(
			appId,
			deviceId
		);
		const readyRequestName = this.$iOSNotification.getReadyForAttach(appId);
		await this.executeRequest(
			mainRequestName,
			readyRequestName,
			appId,
			deviceId,
			timeout
		);
	}

	public async executeRefreshRequest(
		device: Mobile.IiOSDevice,
		timeout: number,
		appId: string
	): Promise<boolean> {
		const deviceId = device.deviceInfo.identifier;
		const mainRequestName = this.$iOSNotification.getRefreshRequest(appId);
		const refreshRequestStartedName = this.$iOSNotification.getAppRefreshStarted(
			appId
		);

		const result = await this.executeRequest(
			mainRequestName,
			refreshRequestStartedName,
			appId,
			deviceId,
			timeout
		);

		return result;
	}

	private async executeRequest(
		mainRequestName: string,
		successfulyExecutedNotificationName: string,
		appId: string,
		deviceId: string,
		timeout: number
	): Promise<boolean> {
		let isSuccessful = false;

		try {
			// We should create this promise here because we need to send the ObserveNotification on the device
			// before we send the PostNotification.
			const socket = await this.$iOSNotificationService.postNotification(
				deviceId,
				successfulyExecutedNotificationName,
				constants.IOS_OBSERVE_NOTIFICATION_COMMAND_TYPE
			);
			const notificationPromise = this.$iOSNotificationService.awaitNotification(
				deviceId,
				+socket,
				timeout
			);
			await this.$iOSNotificationService.postNotification(
				deviceId,
				mainRequestName
			);
			await notificationPromise;
			isSuccessful = true;
		} catch (e) {
			this.$errors.fail(
				`The application ${appId} does not appear to be running on ${deviceId} or is not built with debugging enabled. Try starting the application manually.`
			);
		}

		return isSuccessful;
	}
}

injector.register("iOSSocketRequestExecutor", IOSSocketRequestExecutor);
