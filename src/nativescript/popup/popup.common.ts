/// <reference path="../../../node_modules/@types/node/index.d.ts" />

import { EventEmitter } from 'events';
import { openAdvancedUrl, AdvancedWebViewOptions } from 'nativescript-advanced-webview';
import { handleOpenURL, AppURL } from 'nativescript-urlhandler';

export class PopupCommon extends EventEmitter {
  protected _open = false;

  open(url = '/') {
    // Open popup
    openAdvancedUrl({
      url: url,
      isClosed: (finish) => {
        if (finish) {
          this._open = false;

          // Emit the exit event
          this.emit('exit')
        }
      }
    });

    handleOpenURL((appURL: AppURL) => {
      this.emit('loadstop', { url: appURL.toString() });
    });

    this._open = true;

    // Return this
    return this;
  }

  close() {
    return this;
  }
}
