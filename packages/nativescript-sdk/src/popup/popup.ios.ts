import { EventEmitter } from 'events';
import { Color } from 'tns-core-modules/color';
import { handleOpenURL, AppURL } from 'nativescript-urlhandler';
import { ios } from "tns-core-modules/utils/utils";

const LOADED_EVENT = 'loaded';
const CLOSED_EVENT = 'closed';
const ERROR_EVENT = 'error';

export interface PopupOptions {
  toolbarColor?: string;
  showTitle?: boolean;
}

class SFSafariViewControllerDelegateImpl extends NSObject implements SFSafariViewControllerDelegate {
  public static ObjCProtocols = [SFSafariViewControllerDelegate];
  private _owner: WeakRef<any>;
  private _callback: Function;

  static new(): SFSafariViewControllerDelegateImpl {
    return <SFSafariViewControllerDelegateImpl>super.new();
  }

  public static initWithOwnerCallback(owner: WeakRef<any>, callback: Function): SFSafariViewControllerDelegateImpl {
    let delegate = <SFSafariViewControllerDelegateImpl>SFSafariViewControllerDelegateImpl.new();
    delegate._owner = owner;
    delegate._callback = callback;
    return delegate;
  }

  safariViewControllerDidFinish(): void {
    if (this._callback && typeof this._callback === 'function') {
      this._callback(true);
    }
  }
}

export class Popup extends EventEmitter {
  private _open = false;
  private _viewController: UIViewController = null;

  isClosed() {
    return this._open !== true;
  }

  onLoaded(listener: any) {
    return this.on(LOADED_EVENT, listener);
  }

  onClosed(listener: any) {
    return this.on(CLOSED_EVENT, listener);
  }

  onError(listener: any) {
    return this.on(ERROR_EVENT, listener);
  }

  async open(url = '/', options: PopupOptions = {}) {
    // Handle redirect uri
    handleOpenURL((appURL: AppURL) => {
      this.emit(LOADED_EVENT, { url: appURL.toString() });
    });

    // Create a SafariViewController
    const sfc = SFSafariViewController.alloc().initWithURL(NSURL.URLWithString(url));

    // Toolbar color
    if (options.toolbarColor) {
      sfc.preferredBarTintColor = new Color(options.toolbarColor).ios;
    }

    // Delegate
    sfc.delegate = SFSafariViewControllerDelegateImpl.initWithOwnerCallback(new WeakRef(this), (finish: boolean) => {
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

  async close() {
    if (this._open && this._viewController) {
      this._viewController.dismissViewControllerAnimatedCompletion(true, null);
      this._viewController = null;
      this._open = false;
    }

    this.emit(CLOSED_EVENT);
    return this;
  }

  static open(url: string, options?: PopupOptions) {
    const popup = new Popup();
    return popup.open(url, options);
  }
}
