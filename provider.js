import { Kinvey as CoreKinvey } from 'kinvey-javascript-sdk-core';
import { NetworkRack } from 'kinvey-javascript-sdk-core/es5/rack/rack';
import { KinveyHttpMiddleware } from 'kinvey-javascript-sdk-core/es5/rack/middleware/http';
import { HttpMiddleware } from './http';
import { Push } from 'kinvey-phonegap-sdk/es5/push';
import Device from './device';

// Add the Http Middleware to the network rack
const networkRack = NetworkRack.sharedInstance();
networkRack.swap(KinveyHttpMiddleware, new HttpMiddleware());

// Extend the Core Kinvey class
class Kinvey extends CoreKinvey {
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

// ngKinveyProvider class
export default class KinveyProvider {
  init(options) {
    return Kinvey.init(options);
  }

  $get() {
    return Kinvey;
  }
}
