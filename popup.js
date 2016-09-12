import { Popup as PhoneGapPopup } from 'kinvey-phonegap-sdk';
import { Popup as Html5Popup } from 'kinvey-html5-sdk';
import { Device } from './device';

/**
 * @private
 */
export class Popup {
  constructor() {
    if (Device.isPhoneGap()) {
      return new PhoneGapPopup();
    }

    return new Html5Popup();
  }
}
