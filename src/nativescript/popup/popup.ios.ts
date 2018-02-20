/// <reference path="../../../node_modules/tns-platform-declarations/ios.d.ts" />
/// <reference path="../../../node_modules/@types/node/index.d.ts" />

import { EventEmitter } from 'events';
import { openAdvancedUrl, AdvancedWebViewOptions } from 'nativescript-advanced-webview';
import * as utils from "tns-core-modules/utils/utils";


export class Popup extends EventEmitter {
  open(url = '/') {
    // Get the default notification center
    const notificationCenter = utils.ios.getter(NSNotificationCenter, NSNotificationCenter.defaultCenter);

    // Create a callback for the notification
    const notificationCallback = (notification) => {
      // Remove the notification callback
      notificationCenter.removeObserver(notificationCallback);

      // Emit the exit event
      this.emit('loadstop', { url: notification.object });
    };

    // Register the callback for the notification
    const queue = utils.ios.getter(NSOperationQueue, NSOperationQueue.mainQueue);
    notificationCenter.addObserverForNameObjectQueueUsingBlock('KinveyMICRedirectURL', null, queue, notificationCallback);

    // Open popup
    openAdvancedUrl({
      url: url,
      isClosed: (finish) => {
        if (finish) {
          // Remove the notification callback
          notificationCenter.removeObserver(notificationCallback);

          // Emit the exit event
          this.emit('exit')
        }
      }
    });

    // Return this
    return this;
  }

  close() {
    const app = utils.ios.getter(UIApplication, UIApplication.sharedApplication);
    app.keyWindow.rootViewController.dismissViewControllerAnimatedCompletion(true, null);
    return this;
  }
}
