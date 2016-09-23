import { Kinvey as CoreKinvey } from 'kinvey-javascript-sdk-core';
import Push from './push';

export default class Kinvey extends CoreKinvey {
  static init(options) {
    // Initialize Kinvey
    const client = super.init(options);

    // Add Push module to Kinvey
    this.Push = new Push();

    // Return the client
    return client;
  }
}
