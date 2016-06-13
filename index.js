import Kinvey from 'kinvey-javascript-sdk-core';
import { KinveyError } from 'kinvey-javascript-sdk-core/es5/errors';
import { NetworkRack } from 'kinvey-javascript-sdk-core/es5/rack/rack';
import { HttpMiddleware } from 'kinvey-javascript-sdk-core/es5/rack/middleware/http';
import { PhoneGapHttpMiddleware } from './http';
import { PhoneGapPush } from './push';
import { PhoneGapPopup } from './popup';
import { PhoneGapDevice } from './device';

// Add Http middleware
const networkRack = NetworkRack.sharedInstance();
networkRack.swap(HttpMiddleware, new PhoneGapHttpMiddleware());

// Check that the cordova device plugin is installed
if (PhoneGapDevice.isPhoneGap()) {
  const onDeviceReady = () => {
    document.removeEventListener('deviceready', onDeviceReady);

    if (typeof global.device === 'undefined') {
      throw new KinveyError('Cordova Device Plugin is not installed.'
        + ' Please refer to devcenter.kinvey.com/phonegap-v3.0/guides/getting-started for help with'
        + ' setting up your project.');
    }
  };

  document.addEventListener('deviceready', onDeviceReady, false);
}

// Extend the Kinvey class
class PhoneGapKinvey extends Kinvey {
  static init(options) {
    // Initialize Kinvey
    const client = super.init(options);

    // Add Push module to Kinvey
    this.Push = new PhoneGapPush();

    // Return the client
    return client;
  }
}

// Expose some globals
global.KinveyDevice = PhoneGapDevice;
global.KinveyPopup = PhoneGapPopup;

// Export
module.exports = PhoneGapKinvey;
