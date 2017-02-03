import * as constants from "../common/constants";

export class IOSNotificationService implements IiOSNotificationService {
	constructor(private $iosDeviceOperations: IIOSDeviceOperations) { }

	public async awaitNotification(deviceIdentifier: string, notification: string, timeout: number): Promise<string> {
		const notificationResponse = await this.$iosDeviceOperations.notify([{
			deviceId: deviceIdentifier,
			commandType: constants.IOS_OBSERVE_NOTIFICATION_COMMAND_TYPE,
			notificationName: notification,
			shouldWaitForResponse: true,
			timeout: timeout,
			responseCommandType: constants.IOS_RELAY_NOTIFICATION_COMMAND_TYPE,
			responsePropertyName: "Name"
		}]);

		return _.first(notificationResponse[deviceIdentifier]).response;
	}

	public async postNotification(deviceIdentifier: string, notification: string): Promise<void> {
		await this.$iosDeviceOperations.notify([{ deviceId: deviceIdentifier, commandType: constants.IOS_POST_NOTIFICATION_COMMAND_TYPE, notificationName: notification, shouldWaitForResponse: false }]);
	}
}

$injector.register("iOSNotificationService", IOSNotificationService);
