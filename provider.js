import { Kinvey } from 'kinvey-javascript-sdk-core';
import { NetworkRack } from 'kinvey-javascript-sdk-core/build/rack/rack';
import { SerializeMiddleware } from 'kinvey-javascript-sdk-core/build/rack/middleware/serialize';
import { HttpMiddleware } from './http';

export class KinveyProvider {
  constructor() {
    // Use Http middleware after the Serialize middleware
    const networkRack = NetworkRack.sharedInstance();
    networkRack.useAfter(SerializeMiddleware, new HttpMiddleware());
  }

  init(options) {
    // Initialize Kinvey
    return Kinvey.init(options);
  }

  $get() {
    return Kinvey;
  }
}
