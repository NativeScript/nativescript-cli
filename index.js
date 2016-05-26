import Kinvey from 'kinvey-javascript-sdk-core';
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
    // Initialize Kinvey
    const client = super.init(options);

    // Add Push module to Kinvey
    if (PhoneGapDevice.isiOS() || PhoneGapDevice.isAndroid()) {
      this.Push = new PhoneGapPush();
    }

    // Return the client
    return client;
  }
}

// Expose some globals
global.KinveyDevice = PhoneGapDevice;
global.KinveyPopup = PhoneGapPopup;

// Export
module.exports = PhoneGapKinvey;
