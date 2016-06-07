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

// Extend the Kinvey class
class PhoneGapKinvey extends Kinvey {
  static init(options) {
    if (PhoneGapDevice.isPhoneGap()) {
      const onDeviceReady = () => {
        document.removeEventListener('deviceready', onDeviceReady);

        if (!global.device) {
          throw new KinveyError('Cordova Device Plugin is not installed.',
            'Please refer to http://devcenter.kinvey.com/phonegap-v3.0/guides/push#ProjectSetUp for help with'
            + ' setting up your project.');
        }
      };

      document.addEventListener('deviceready', onDeviceReady, false);
    }

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
