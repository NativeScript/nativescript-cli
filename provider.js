import { Kinvey as CoreKinvey } from 'kinvey-javascript-sdk-core/dist/kinvey';
import { Push } from './push';

// Extend the CoreKinvey class
class Kinvey extends CoreKinvey {
  static init(options) {
    // Initialize Kinvey
    const client = super.init(options);

    // Add Push module to Kinvey
    this.Push = new Push();

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
