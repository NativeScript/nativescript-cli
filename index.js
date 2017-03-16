import Kinvey, { NetworkRack } from 'kinvey-js-sdk/dist/export';
import { HttpMiddleware } from './middleware';
import Push from './push';

// Setup racks
NetworkRack.useHttpMiddleware(new HttpMiddleware());

// Add Push module to Kinvey
Kinvey.Push = Push;

// Export
module.exports = Kinvey;
