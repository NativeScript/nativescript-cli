import { CacheRack } from 'kinvey-js-sdk/dist/export';
import Kinvey from 'kinvey-html5-sdk';
import { CacheMiddleware } from './middleware';
import User from './user';

// Setup racks
CacheRack.useCacheMiddleware(new CacheMiddleware());

// Replace the User class
Kinvey.User = User;

// Export
module.exports = Kinvey;
module.exports.Kinvey = Kinvey;
