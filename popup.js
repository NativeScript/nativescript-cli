import { PhoneGapPopup } from 'kinvey-phonegap-sdk/es5/popup';
import { Html5Popup } from 'kinvey-html5-sdk/es5/popup';
import { AngularDevice } from './device';

/**
 * @private
 */
export class AngularPopup {
  constructor() {
    // Create a popup proxy
    if (AngularDevice.isPhoneGap()) {
      return new PhoneGapPopup();
    }

    return new Html5Popup();
  }
}
