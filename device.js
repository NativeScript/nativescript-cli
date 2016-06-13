import { PhoneGapDevice } from 'kinvey-phonegap-sdk/es5/device';
import { Html5Device } from 'kinvey-html5-sdk/es5/device';
import packageJSON from '../package.json';

/**
 * @private
 */
export class AngularDevice {
  static isPhoneGap() {
    return PhoneGapDevice.isPhoneGap();
  }

  static isBrowser() {
    return PhoneGapDevice.isBrowser();
  }

  static isiOS() {
    return PhoneGapDevice.isiOS();
  }

  static isAndroid() {
    return PhoneGapDevice.isAndroid();
  }
  static toJSON() {
    let json;

    // Get the correct device information
    if (PhoneGapDevice.isPhoneGap()) {
      json = PhoneGapDevice.toJSON();
    } else {
      json = Html5Device.toJSON();
    }

    // Add angular information
    if (json.platform) {
      json.platform.name = 'angular';
      json.platform.version = global.angular.version.full;
    }

    // Add sdk information
    json.kinveySDK = {
      name: packageJSON.name,
      version: packageJSON.version
    };

    return json;
  }
}
