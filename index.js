import Kinvey from 'kinvey-javascript-sdk-core';
import { NetworkRack } from 'kinvey-javascript-sdk-core/es5/rack/rack';
import { HttpMiddleware } from 'kinvey-javascript-sdk-core/es5/rack/middleware/http';
import PhoneGapHttpMiddleware from './http';
import Push from './push';
import Device from './device';

// Add Http middleware
const networkRack = NetworkRack.sharedInstance();
networkRack.swap(HttpMiddleware, new PhoneGapHttpMiddleware());

// Extend the Kinvey class
class PhoneGapKinvey extends Kinvey {
  static init(options) {
    // Initialize Kinvey
    const client = super.init(options);

    // Add Push module to Kinvey
    if (Device.isiOS() || Device.isAndroid()) {
      this.Push = new Push();
    }

    // Return the client
    return client;
  }
}

// Export
module.exports = PhoneGapKinvey;
