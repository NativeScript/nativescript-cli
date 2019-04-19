import { messaging } from 'nativescript-plugin-firebase/messaging';
import { device } from 'tns-core-modules/platform';
import { formatKinveyBaasUrl, KinveyHttpRequest, HttpRequestMethod, KinveyHttpAuth, KinveyBaasNamespace } from 'kinvey-js-sdk/lib/http';

export async function register(callback: (message: any) => void, options: any = {}) {
  // Register for push notifications
  const {
    // Whether you want the firebase plugin to automatically display the notifications or just notify the callback. Currently used on iOS only. Default value for the plugin is true.
    showNotifications = true,
    // Whether you want the firebase plugin to always handle the notifications when the app is in foreground. Currently used on iOS only. Default value for the plugin is false.
    showNotificationsWhenInForeground = true
  } = options;
  await messaging.registerForPushNotifications({ showNotifications, showNotificationsWhenInForeground });

  // Add the callback
  await messaging.addOnMessageReceivedCallback(callback);

  // Get the device token
  const token = await messaging.getCurrentPushToken();

  // Register device with Kinvey
  const request = new KinveyHttpRequest({
    method: HttpRequestMethod.POST,
    auth: KinveyHttpAuth.Session,
    url: formatKinveyBaasUrl(KinveyBaasNamespace.Push, '/register-device'),
    body: {
      platform: device.os.toLowerCase(),
      framework: 'nativescript',
      deviceId: token,
      service: 'firebase'
    },
    timeout: options.timeout
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
  const request = new KinveyHttpRequest({
    method: HttpRequestMethod.POST,
    auth: KinveyHttpAuth.Session,
    url: formatKinveyBaasUrl(KinveyBaasNamespace.Push, '/unregister-device'),
    body: {
      platform: device.os.toLowerCase(),
      framework: 'nativescript',
      deviceId: token,
      service: 'firebase'
    },
    timeout: options.timeout
  });
  const response = await request.execute();
  return response.data;
}
