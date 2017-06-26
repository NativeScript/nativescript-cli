import { Promise } from 'es6-promise';
import { isDefined } from 'kinvey-js-sdk/dist/utils';
import { KinveyError } from 'kinvey-js-sdk/dist/errors';
import { Push as PushCommon } from './push.common';
let PushPlugin;

try {
  PushPlugin = require('nativescript-push-notifications');
} catch (e) {
  // Just catch the error
}

export class Push extends PushCommon {
  protected _registerWithPushPlugin(options = <any>{}): Promise<string> {
    const config = options.android || {};

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

  protected _unregisterWithPushPlugin(options = <any>{}): Promise<null> {
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
