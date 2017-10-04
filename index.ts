import { CacheRack, NetworkRack } from 'kinvey-js-sdk/dist/request';
import { MobileIdentityConnect } from 'kinvey-js-sdk/dist/identity';
import { Kinvey } from './kinvey';
import { CacheMiddleware } from './cache';
import { HttpMiddleware } from './http';
import { Popup } from './popup';
import { FileStore } from './filestore';

// Setup racks
CacheRack.useCacheMiddleware(new CacheMiddleware());
NetworkRack.useHttpMiddleware(new HttpMiddleware());

// Setup Popup class
MobileIdentityConnect.usePopupClass(Popup);

// Replace Files implementation
(Kinvey as any).Files = new FileStore();

// Export
export { Kinvey };
