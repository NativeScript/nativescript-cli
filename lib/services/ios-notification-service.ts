export class IOSNotificationService implements IiOSNotificationService {
	public async awaitNotification(npc: Mobile.INotificationProxyClient, notification: string, timeout: number): Promise<string> {
		return new Promise<string>((resolve, reject) => {

			let timeoutToken = setTimeout(() => {
				detachObserver();
				reject(new Error(`Timeout receiving ${notification} notification.`));
			}, timeout);

			function notificationObserver(_notification: string) {
				clearTimeout(timeoutToken);
				detachObserver();
				resolve(_notification);
			}

			function detachObserver() {
				process.nextTick(() => npc.removeObserver(notification, notificationObserver));
			}

			npc.addObserver(notification, notificationObserver);

		});
	}
}
$injector.register("iOSNotificationService", IOSNotificationService);
