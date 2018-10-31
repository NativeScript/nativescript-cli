import { Promise } from 'es6-promise';
import * as application from "tns-core-modules/application";
import { KinveyError } from './kinvey-nativescript-sdk';
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

  private notificationCallback: (message: any) => void;

  constructor() {
    super();

    const callback = (args: application.ApplicationEventData) => {
      if (args.android && typeof this.notificationCallback === 'function') {
        const activity = args.android;
        const intent = activity.getIntent();
        const extras = intent.getExtras();

        const message = {
          foreground: false
        };

        if (extras) {
          const iterator = extras.keySet().iterator();
          while (iterator.hasNext()) {
            const key = iterator.next();
            // exclude a few properties FCM adds
            if (key !== "from" && key !== "collapse_key" && !key.startsWith("google.")) {
              message[key] = extras.get(key);
            }
          }
        }

        this.notificationCallback(message);
      }
    };

    // let's make sure the callback isn't registered more than once
    application.off(application.resumeEvent, callback);
    application.on(application.resumeEvent, callback);
  }

  // private
  protected _registerWithPushPlugin(options = <PushConfig>{}): Promise<string> {
    const config = options.android || <AndroidPushConfig>{};

    return new Promise((resolve, reject) => {
      if (!PushPlugin) {
        return reject(new KinveyError('NativeScript Push Plugin is not installed.',
          'Please refer to http://devcenter.kinvey.com/nativescript/guides/push#ProjectSetUp for help with'
          + ' setting up your project.'));
      }

      this.notificationCallback = options.notificationCallback;
      const usersNotificationCallback = config.notificationCallbackAndroid;
      config.notificationCallbackAndroid = (jsonDataString: string, fcmNotification) => {
        if (typeof usersNotificationCallback === 'function') {
          usersNotificationCallback(jsonDataString, fcmNotification);
        }

        if (typeof options.notificationCallback === 'function') {
          const message = JSON.parse(jsonDataString); // note: this also includes the "foreground" boolean property
          message.title = fcmNotification.getTitle();
          message.body = fcmNotification.getBody();
          options.notificationCallback(message);
        }

        (this as any).emit('notification', JSON.parse(jsonDataString));
      };

      PushPlugin.register(config, resolve, reject);
    });
  }

  protected _unregisterWithPushPlugin(options = <PushConfig>{}): Promise<null> {
    const config = options.android || <AndroidPushConfig>{};

    return new Promise((resolve, reject) => {
      if (!PushPlugin) {
        return reject(new KinveyError('NativeScript Push Plugin is not installed.',
          'Please refer to http://devcenter.kinvey.com/nativescript/guides/push#ProjectSetUp for help with'
          + ' setting up your project.'));
      }

      PushPlugin.unregister(resolve, reject, config);
    });
  }
}

// tslint:disable-next-line:variable-name
const Push = new AndroidPush();
export { Push };
