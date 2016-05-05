import { Kinvey } from 'kinvey-javascript-sdk-core';
import { NetworkRack } from 'kinvey-javascript-sdk-core/build/rack/rack';
import { SerializeMiddleware } from 'kinvey-javascript-sdk-core/build/rack/middleware/serialize';
import { HttpMiddleware } from './http';
import { Push } from 'kinvey-phonegap-sdk/build/push';
import Device from './device';

export class KinveyProvider {
  constructor() {
    // Use Http middleware after the Serialize middleware
    const networkRack = NetworkRack.sharedInstance();
    networkRack.useAfter(SerializeMiddleware, new HttpMiddleware());
  }

  init(options) {
    // Initialize Kinvey
    const client = Kinvey.init(options);

    // Add Push module to Kinvey
    if (Device.isiOS() || Device.isAndroid()) {
      Kinvey.Push = new Push();
    }

    // Return the client
    return client;
  }

  $get() {
    return Kinvey;
  }
}
