import Kinvey, { NetworkRack } from 'kinvey-js-sdk/dist/export';
import { HttpMiddleware } from './middleware';

// Setup racks
NetworkRack.useHttpMiddleware(new HttpMiddleware());

// Export
module.exports = Kinvey;
