import { Kinvey } from 'kinvey-javascript-sdk-core';
import { NetworkRack } from 'kinvey-javascript-sdk-core/es5/rack/rack';
import { KinveyHttpMiddleware } from 'kinvey-javascript-sdk-core/es5/rack/middleware/http';
import { HttpMiddleware } from './http';
import { Push } from './push';

// Add Http middleware
const networkRack = NetworkRack.sharedInstance();
networkRack.swap(KinveyHttpMiddleware, new HttpMiddleware());

const prevInit = Kinvey.init;
Kinvey.init = (options) => {
  // Initialize Kinvey
  const client = prevInit(options);

  // Add Push module to Kinvey
  Kinvey.Push = new Push();

  // Return the client
  return client;
};

// Export
module.exports = Kinvey;
