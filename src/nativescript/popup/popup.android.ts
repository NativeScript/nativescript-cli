import { PopupCommon } from './popup.common';
import * as frameModule from 'tns-core-modules/ui/frame';

export class Popup extends PopupCommon {
  close() {
    if (this._open) {
      frameModule.topmost().goBack();
      this._open = false;
    }

    return this;
  }
}
