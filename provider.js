import Kinvey from 'kinvey-javascript-sdk-core';
import { NetworkRack } from 'kinvey-javascript-sdk-core/es5/rack/rack';
import { HttpMiddleware } from 'kinvey-javascript-sdk-core/es5/rack/middleware/http';
import AngularHttpMiddleware from './http';
import Device from './device';
import Push from 'kinvey-phonegap-sdk/es5/push';

// Add the Http Middleware to the network rack
const networkRack = NetworkRack.sharedInstance();
networkRack.swap(HttpMiddleware, new AngularHttpMiddleware());

// Extend the Kinvey class
class AngularKinvey extends Kinvey {
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
    return AngularKinvey.init(options);
  }

  $get() {
    return AngularKinvey;
  }
}
