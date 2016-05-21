import { Kinvey } from 'kinvey-phonegap-sdk';
import { NetworkRack } from 'kinvey-javascript-sdk-core/es5/rack/rack';
import { HttpMiddleware as KinveyHttpMiddleware } from 'kinvey-javascript-sdk-core/es5/rack/middleware/http';
import { HttpMiddleware } from './http';

// Add the Http Middleware to the network rack
const networkRack = NetworkRack.sharedInstance();
networkRack.swap(KinveyHttpMiddleware, new HttpMiddleware());

// ngKinveyProvider class
export default class KinveyProvider {
  init(options) {
    return Kinvey.init(options);
  }

  $get() {
    return Kinvey;
  }
}
