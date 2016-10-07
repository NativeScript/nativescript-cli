import HTML5Kinvey from 'kinvey-html5-sdk';
import Device from './device';
import Popup from './popup';
import Push from './push';
import assign from 'lodash/assign';

export default class Kinvey extends HTML5Kinvey {
  static init(options = {}) {
    options = assign({
      deviceClass: Device,
      popupClass: Popup
    }, options);

    // Initialize Kinvey
    const client = super.init(options);

    // // Add Push module to Kinvey
    this.Push = new Push({ client: client });

    // Return the client
    return client;
  }
}
