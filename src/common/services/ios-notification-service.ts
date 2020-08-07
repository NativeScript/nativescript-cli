import * as constants from "../constants";

export class IOSNotificationService implements IiOSNotificationService {
	constructor(private $iosDeviceOperations: IIOSDeviceOperations) { }

	public async awaitNotification(deviceIdentifier: string, socket: number, timeout: number): Promise<string> {
		const notificationResponse = await this.$iosDeviceOperations.awaitNotificationResponse([{
			deviceId: deviceIdentifier,
			socket: socket,
			timeout: timeout,
			responseCommandType: constants.IOS_RELAY_NOTIFICATION_COMMAND_TYPE,
			responsePropertyName: "Name"
		}]);

		return _.first(notificationResponse[deviceIdentifier]).response;
	}

	public async postNotification(deviceIdentifier: string, notification: string, commandType?: string): Promise<number> {
		commandType = commandType || constants.IOS_POST_NOTIFICATION_COMMAND_TYPE;
		const response = await this.$iosDeviceOperations.postNotification([{ deviceId: deviceIdentifier, commandType: commandType, notificationName: notification }]);
		return +_.first(response[deviceIdentifier]).response;
	}
}

$injector.register("iOSNotificationService", IOSNotificationService);
