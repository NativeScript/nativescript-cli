/* global UIApplication */

import { EventEmitter } from 'events';
import { openAdvancedUrl as openUrl } from 'nativescript-advanced-webview'; // eslint-disable-line import/no-unresolved, import/extensions, import/no-extraneous-dependencies
import * as utils from 'utils/utils'; // eslint-disable-line import/no-unresolved, import/extensions, import/no-extraneous-dependencies
const application = require('application'); // eslint-disable-line import/no-unresolved, import/extensions, import/no-extraneous-dependencies

export class Popup extends EventEmitter {
  open(url = '/') {
    // Open the url
    openUrl({ url: url });

    // Listen for MICSuccessNotification
    application.on('MICRedirectNotification', (args) => {
      // Remove listeners
      application.off('MICRedirectNotification');

      // Emit loadstop event
      this.emit('loadstop', args);
    });

    return this;
  }

  close() {
    const uiApplication = utils.ios.getter(UIApplication, UIApplication.sharedApplication);
    uiApplication.keyWindow.rootViewController.dismissViewControllerAnimatedCompletion(true, null);
    return this;
  }
}
