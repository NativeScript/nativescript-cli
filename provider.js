import Kinvey from 'kinvey-javascript-sdk-core';
import { AngularPush } from './push';

// Extend the Kinvey class
class AngularKinvey extends Kinvey {
  static init(options) {
    // Initialize Kinvey
    const client = super.init(options);

    // Add Push module to Kinvey
    this.Push = new AngularPush();

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
