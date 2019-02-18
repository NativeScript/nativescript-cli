import { messaging, Message } from 'nativescript-plugin-firebase/messaging';
import { device } from 'tns-core-modules/platform';
import { formatKinveyUrl } from '../http/utils';
import { KinveyRequest, RequestMethod } from '../http/request';
import { Auth } from '../http/auth';
import { get as getConfig } from '../kinvey/config';

const PUSH_NAMESPACE = 'push';

export async function register(callback: (message: Message) => void, options: any = {}) {
  // Register for push notifications
  const {
    // Whether you want this plugin to automatically display the notifications or just notify the callback. Currently used on iOS only. Default true.
    showNotifications = true,
    // Whether you want this plugin to always handle the notifications when the app is in foreground. Currently used on iOS only. Default false.
    showNotificationsWhenInForeground = true
  } = options;
  await messaging.registerForPushNotifications({ showNotifications, showNotificationsWhenInForeground });

  // Add the callback
  await messaging.addOnMessageReceivedCallback(callback);

  // Get the device token
  const token = await messaging.getCurrentPushToken();

  // Register device with Kinvey
  const { timeout } = options;
  const { appKey, apiProtocol, apiHost } = getConfig();
  const request = new KinveyRequest({
    method: RequestMethod.POST,
    auth: Auth.Session,
    url: formatKinveyUrl(apiProtocol, apiHost, `/${PUSH_NAMESPACE}/${appKey}/register-device`),
    body: {
      platform: device.os.toLowerCase(),
      framework: 'nativescript',
      deviceId: token
    },
    timeout
  });
  await request.execute();

  // Return the token
  return token;
}

export async function unregister(options: any = {}) {
  // Get the deivce token
  const token = await messaging.getCurrentPushToken();

  // Unregister for push notifications
  await messaging.unregisterForPushNotifications();

  // Unregister the device on Kinvey
  const { timeout } = options;
  const { appKey, apiProtocol, apiHost } = getConfig();
  const request = new KinveyRequest({
    method: RequestMethod.POST,
    auth: Auth.Session,
    url: formatKinveyUrl(apiProtocol, apiHost, `/${PUSH_NAMESPACE}/${appKey}/unregister-device`),
    data: {
      platform: device.os.toLowerCase(),
      framework: 'nativescript',
      deviceId: token
    },
    timeout
  });
  const response = await request.execute();
  return response.data;
}
