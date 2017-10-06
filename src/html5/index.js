import { CacheRack, NetworkRack } from 'kinvey-js-sdk/dist/export';
import { MobileIdentityConnect } from 'kinvey-js-sdk/dist/identity';
import { Kinvey } from './kinvey';
import { CacheMiddleware, HttpMiddleware } from './middleware';
import Popup from './popup';

// Setup racks
CacheRack.useCacheMiddleware(new CacheMiddleware());
NetworkRack.useHttpMiddleware(new HttpMiddleware());

// Setup popup
MobileIdentityConnect.usePopupClass(Popup);

// Export
module.exports = Kinvey;
