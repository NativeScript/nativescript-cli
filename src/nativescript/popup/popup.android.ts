/// <reference path="../../../node_modules/tns-platform-declarations/android.d.ts" />
/// <reference path="../../../node_modules/@types/node/index.d.ts" />

import { EventEmitter } from 'events';
import { openAdvancedUrl, AdvancedWebViewOptions } from 'nativescript-advanced-webview';
import * as frameModule from 'tns-core-modules/ui/frame';

export class Popup extends EventEmitter {
  private _open = false;

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

    this._open = true;

    // Return this
    return this;
  }

  close() {
    if (this._open) {
      frameModule.topmost().goBack();
      this._open = false;
    }

    return this;
  }
}
