import { Push as CorePush } from 'kinvey-javascript-sdk-core/build/push';
import { KinveyError } from 'kinvey-javascript-sdk-core/build/errors';
import { isiOS, isAndroid } from './utils';
import assign from 'lodash/assign';
const notificationEvent = process.env.KINVEY_NOTIFICATION_EVENT || 'notification';

export class Push extends CorePush {
  getDeviceId(options = {}) {
    if (!Push.isSupported()) {
      return Promise.reject(new KinveyError('Kinvey currently only supports ' +
        'push notifications on iOS and Android platforms.'));
    }

    options = assign({
      android: {
        senderID: undefined
      },
      ios: {
        alert: true,
        badge: true,
        sound: true
      }
    }, options);

    const promise = new Promise((resolve, reject) => {
      if (typeof global.PushNotification === 'undefined') {
        return reject(new KinveyError('PhoneGap Push Notification Plugin is not installed.',
          'Please refer to http://devcenter.kinvey.com/phonegap/guides/push#ProjectSetUp for ' +
          'setting up your project.'));
      }

      const push = global.PushNotification.init(options);

      push.on('registration', data => {
        resolve(data);
      });

      push.on('notification', data => {
        this.emit(notificationEvent, data);
      });

      push.on('error', error => {
        reject(new KinveyError('An error occurred registering this device for push notifications.', error));
      });

      return push;
    });

    return promise;
  }

  static isSupported() {
    return isiOS() || isAndroid();
  }
}
