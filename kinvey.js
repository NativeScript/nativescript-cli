import { Kinvey as Html5Kinvey } from 'kinvey-html5-sdk/dist/kinvey';
import { Push } from './push';

export class Kinvey extends Html5Kinvey {
  static init(options) {
    // Initialize Kinvey
    const client = super.init(options);

    // Add Push module to Kinvey
    this.Push = new Push();

    // Return the client
    return client;
  }
}
