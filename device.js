import PhoneGapDevice from 'kinvey-phonegap-sdk/es5/device';
import packageJSON from '../package.json';

/**
 * @private
 */
class Device extends PhoneGapDevice {
  static toJSON() {
    const json = super.toJSON();

    if (Device.isBrowser()) {
      json.platform.name = 'web browser';
    }

    // Add angular information
    json.library = {
      name: 'angular',
      version: global.angular.version.full
    };

    // Add sdk information
    json.kinveySDK = {
      name: packageJSON.name,
      version: packageJSON.version
    };

    return json;
  }
}

// Expose the device class globally
global.KinveyDevice = Device;
