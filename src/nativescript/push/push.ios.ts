import { Promise } from 'es6-promise';
import { isDefined } from '../../core/utils';
import { KinveyError } from '../../core/errors';
import { PushCommon } from './common';
import { PushConfig, IOSPushConfig } from './';
// tslint:disable-next-line:variable-name
let PushPlugin;

try {
  PushPlugin = require('nativescript-push-notifications');
} catch (e) {
  // Just catch the error
}

class IOSPush extends PushCommon {
  protected _registerWithPushPlugin(options = <PushConfig>{}): Promise<string> {
    const config = options.ios || <IOSPushConfig>{};

    return new Promise((resolve, reject) => {
      if (isDefined(PushPlugin) === false) {
        return reject(new KinveyError('NativeScript Push Plugin is not installed.',
          'Please refer to http://devcenter.kinvey.com/nativescript/guides/push#ProjectSetUp for help with'
          + ' setting up your project.'));
      }

      config.notificationCallbackIOS = (data: any) => {
        (this as any).emit('notification', data);
      };

      PushPlugin.register(config, (token) => {
        if (isDefined(config.interactiveSettings)) {
          PushPlugin.registerUserNotificationSettings(() => {
            resolve(token);
          }, (error) => {
            // do something with error
            resolve(token);
          });
        } else {
          resolve(token);
        }
      }, reject);
    });
  }

  protected _unregisterWithPushPlugin(options = <PushConfig>{}): Promise<null> {
    return new Promise((resolve, reject) => {
      if (isDefined(PushPlugin) === false) {
        return reject(new KinveyError('NativeScript Push Plugin is not installed.',
          'Please refer to http://devcenter.kinvey.com/nativescript/guides/push#ProjectSetUp for help with'
          + ' setting up your project.'));
      }

      PushPlugin.unregister(resolve, reject, options);
    });
  }
}

// tslint:disable-next-line:variable-name
const Push = new IOSPush();
export { Push };
