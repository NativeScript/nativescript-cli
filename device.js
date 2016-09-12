import { Device as PhoneGapDevice } from 'kinvey-phonegap-sdk';
import { Device as Html5Device } from 'kinvey-html5-sdk';
import angular from 'angular'; // eslint-disable-line import/no-unresolved
import packageJSON from '../package.json';

/**
 * @private
 */
export class Device extends PhoneGapDevice {
  static toJSON() {
    let json;

    // Get the correct device information
    if (Device.isPhoneGap()) {
      json = PhoneGapDevice.toJSON();
    } else {
      json = Html5Device.toJSON();
    }

    // Add angular information
    if (json.platform) {
      json.platform.name = 'angular';
      json.platform.version = angular.version.full;
    }

    // Add sdk information
    json.kinveySDK = {
      name: packageJSON.name,
      version: packageJSON.version
    };

    return json;
  }
}
