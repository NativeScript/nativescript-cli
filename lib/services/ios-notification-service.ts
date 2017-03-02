import * as constants from "../common/constants";

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

	public subscribeForNotification(deviceIdentifier: string, notification: string, timeout: number): Promise<Promise<string>> {
		return new Promise((resolve, reject) => {
			this.postNotification(deviceIdentifier, notification, constants.IOS_OBSERVE_NOTIFICATION_COMMAND_TYPE)
				.then((socket) => {
					resolve(this.awaitNotification(deviceIdentifier, +socket, timeout));
				});
		});
	}

	public async postNotification(deviceIdentifier: string, notification: string, commandType?: string): Promise<string> {
		commandType = commandType || constants.IOS_POST_NOTIFICATION_COMMAND_TYPE;
		const response = await this.$iosDeviceOperations.postNotification([{ deviceId: deviceIdentifier, commandType: commandType, notificationName: notification }]);
		return _.first(response[deviceIdentifier]).response;
	}
}

$injector.register("iOSNotificationService", IOSNotificationService);
