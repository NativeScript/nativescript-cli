import { CacheRack } from 'kinvey-js-sdk/dist/export';
import Kinvey from 'kinvey-html5-sdk';
import { CacheMiddleware } from './middleware';

// Setup racks
CacheRack.useCacheMiddleware(new CacheMiddleware());

// Export
module.exports = Kinvey;
module.exports.Kinvey = Kinvey;
