import { Popup as PhoneGapPopup } from 'kinvey-phonegap-sdk/dist/popup';
import { Popup as Html5Popup } from 'kinvey-html5-sdk/dist/popup';
import { Device } from './device';

/**
 * @private
 */
export class Popup {
  constructor() {
    // Create a popup proxy
    if (Device.isPhoneGap()) {
      return new PhoneGapPopup();
    }

    return new Html5Popup();
  }
}
