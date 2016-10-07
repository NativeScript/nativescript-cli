import PhoneGapKinvey from 'kinvey-phonegap-sdk';
import Device from './device';
import assign from 'lodash/assign';

export default class Kinvey extends PhoneGapKinvey {
  static init(options = {}) {
    options = assign({
      deviceClass: Device
    }, options);

    // Initialize Kinvey
    return super.init(options);
  }
}
