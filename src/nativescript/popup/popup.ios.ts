/// <reference path="../../../node_modules/tns-platform-declarations/ios.d.ts" />

import { EventEmitter } from 'events';
import { Color } from 'tns-core-modules/color';
import { handleOpenURL, AppURL } from 'nativescript-urlhandler';
import * as utils from "tns-core-modules/utils/utils";

export interface PopupOptions {
  toolbarColor?: string;
  showTitle?: boolean;
}

class SFSafariViewControllerDelegateImpl extends NSObject implements SFSafariViewControllerDelegate {
  public static ObjCProtocols = [SFSafariViewControllerDelegate];
  private _owner: WeakRef<any>;
  private _callback: Function;

  public static initWithOwnerCallback(owner: WeakRef<any>, callback: Function): SFSafariViewControllerDelegateImpl {
    let delegate = <SFSafariViewControllerDelegateImpl>SFSafariViewControllerDelegateImpl.new();
    delegate._owner = owner;
    delegate._callback = callback;
    return delegate;
  }

  safariViewControllerDidFinish(controller: SFSafariViewController): void {
    if (this._callback && typeof this._callback === 'function') {
      this._callback(true);
    }
  }
}

export class Popup extends EventEmitter {
  private _open = false;

  open(url = '/', options: PopupOptions = {}) {
    // Handle redirect uri
    handleOpenURL((appURL: AppURL) => {
      this.emit('loadstop', { url: appURL.toString() });
    });

    // Create a SafariViewController
    const sfc = SFSafariViewController.alloc().initWithURL(NSURL.URLWithString(url));

    // Toolbar color
    if (options.toolbarColor) {
      sfc.preferredBarTintColor = new Color(options.toolbarColor).ios;
    }

    // Delegate
    sfc.delegate = SFSafariViewControllerDelegateImpl.initWithOwnerCallback(new WeakRef(this), (finish) => {
      if (finish) {
        // Set open to false
        this._open = false;

        // Emit the exit event
        this.emit('exit');
      }
    });

    // Show the view controller
    const app = utils.ios.getter(UIApplication, UIApplication.sharedApplication);
    app.keyWindow.rootViewController.presentViewControllerAnimatedCompletion(sfc, true, null);

    // Set open to true
    this._open = true;

    // Return this
    return this;
  }

  close() {
    if (this._open) {
      const app = utils.ios.getter(UIApplication, UIApplication.sharedApplication);
      app.keyWindow.rootViewController.dismissViewControllerAnimatedCompletion(true, null);
    }

    return this;
  }
}

