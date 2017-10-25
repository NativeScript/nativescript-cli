import { Promise } from 'es6-promise';
import { isDefined } from '../../core/utils';
import { KinveyError } from '../../core/errors';
import { PushCommon } from './common';
import { PushConfig, AndroidPushConfig } from './';
// tslint:disable-next-line:variable-name
let PushPlugin;

try {
  PushPlugin = require('nativescript-push-notifications');
} catch (e) {
  // Just catch the error
}

class AndroidPush extends PushCommon {
  protected _registerWithPushPlugin(options = <PushConfig>{}): Promise<string> {
    const config = options.android || <AndroidPushConfig>{};

    return new Promise((resolve, reject) => {
      if (isDefined(PushPlugin) === false) {
        return reject(new KinveyError('NativeScript Push Plugin is not installed.',
          'Please refer to http://devcenter.kinvey.com/nativescript/guides/push#ProjectSetUp for help with'
          + ' setting up your project.'));
      }

      PushPlugin.register(config, resolve, reject);
      PushPlugin.onMessageReceived((data: any) => {
        (this as any).emit('notification', data);
      });
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
const Push = new AndroidPush();
export { Push };
