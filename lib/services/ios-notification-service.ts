import Future = require("fibers/future");

export class IOSNotificationService implements IiOSNotificationService {
	public awaitNotification(npc: Mobile.INotificationProxyClient, notification: string, timeout: number): IFuture<string> {
		let future = new Future<string>();

		let timeoutToken = setTimeout(() => {
			detachObserver();
			future.throw(new Error(`Timeout receiving ${notification} notification.`));
		}, timeout);

		function notificationObserver(_notification: string) {
			clearTimeout(timeoutToken);
			detachObserver();
			future.return(_notification);
		}

		function detachObserver() {
			process.nextTick(() => npc.removeObserver(notification, notificationObserver));
		}

		npc.addObserver(notification, notificationObserver);

		return future;
	}
}
$injector.register("iOSNotificationService", IOSNotificationService);
