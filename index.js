import { Kinvey } from 'kinvey-javascript-sdk-core';
import { NetworkRack } from 'kinvey-javascript-sdk-core/build/rack/rack';
import { SerializeMiddleware } from 'kinvey-javascript-sdk-core/build/rack/middleware/serialize';
import { HttpMiddleware } from './http';
import { Push } from './push';

// Add Http middleware
const networkRack = NetworkRack.sharedInstance();
networkRack.useAfter(SerializeMiddleware, new HttpMiddleware());

// Add Push module
Kinvey.Push = Push;

const _init = Kinvey.init;
Kinvey.init = (options) => {
  // Initialize Kinvey
  const client = _init(options);

  // Add Push module to Kinvey
  Kinvey.Push = new Push();

  // Return the client
  return client;
};

// Export
module.exports = Kinvey;
