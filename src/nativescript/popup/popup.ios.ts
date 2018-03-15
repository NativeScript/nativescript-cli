/// <reference path="../../../node_modules/tns-platform-declarations/ios.d.ts" />

import * as utils from "tns-core-modules/utils/utils";

import { PopupCommon } from './popup.common';
import * as frameModule from 'tns-core-modules/ui/frame';

export class Popup extends PopupCommon {
  close() {
    if (this._open) {
      const app = utils.ios.getter(UIApplication, UIApplication.sharedApplication);
      app.keyWindow.rootViewController.dismissViewControllerAnimatedCompletion(true, null);
    }

    return this;
  }
}

