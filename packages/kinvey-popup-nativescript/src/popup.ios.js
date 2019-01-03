import isFunction from 'lodash/isFunction';
import { EventEmitter } from 'events';
import { Color } from 'tns-core-modules/color';
import { ios } from 'tns-core-modules/utils/utils';
import { handleOpenURL } from 'nativescript-urlhandler';
import { register as _register } from 'kinvey-popup';

const LOADED_EVENT = 'loaded';
const CLOSED_EVENT = 'closed';
const ERROR_EVENT = 'error';

export interface PopupOptions {
  toolbarColor?: string;
  showTitle?: boolean;
}

class SFSafariViewControllerDelegateImpl extends NSObject {
  static initWithOwnerCallback(owner, callback) {
    let delegate = SFSafariViewControllerDelegateImpl.new();
    delegate.ObjCProtocols = [SFSafariViewControllerDelegate];
    delegate._owner = owner;
    delegate._callback = callback;
    return delegate;
  }

  safariViewControllerDidFinish(controller) {
    if (isFunction(this._callback)) {
        this._callback(true);
    }
  }
}

export class Popup extends EventEmitter {
  isClosed() {
    return this._open !== true;
  }

  onLoaded(listener) {
    return this.on(LOADED_EVENT, listener);
  }

  onClosed(listener) {
    return this.on(CLOSED_EVENT, listener);
  }

  onError(listener) {
    return this.on(ERROR_EVENT, listener);
  }

  open(url, options = {}) {
    // Handle redirect uri
    handleOpenURL((appURL) => {
      this.emit(LOADED_EVENT, { url: appURL.toString() });
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
        this.emit(CLOSED_EVENT);
      }
    });

    // Show the view controller
    const app = ios.getter(UIApplication, UIApplication.sharedApplication);
    this._viewController = app.keyWindow.rootViewController;

    // Get the topmost view controller
    while (this._viewController.presentedViewController) {
      this._viewController = this._viewController.presentedViewController;
    }

    this._viewController.presentViewControllerAnimatedCompletion(sfc, true, null);

    // Set open to true
    this._open = true;

    // Return this
    return this;
  }

  close() {
    if (this._open && this._viewController) {
      this._viewController.dismissViewControllerAnimatedCompletion(true, null);
      this._viewController = null;
      this._open = false;
    }

    this.emit(CLOSED_EVENT);
    return this;
  }
}

export function register() {
  _register(Popup);
}
