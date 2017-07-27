import { Kinvey } from 'kinvey-js-sdk/dist/kinvey';
import { CacheRack, NetworkRack } from 'kinvey-js-sdk/dist/request'
import { MobileIdentityConnect } from 'kinvey-js-sdk/dist/identity';
import { ActiveUserHelper } from 'kinvey-js-sdk/dist/entity/src/activeUserHelper';
import { CacheMiddleware } from './cache';
import { HttpMiddleware } from './http';
import { Popup } from './popup';
import { SecureStorage } from './secure';
import { NativeScriptFileStore } from './filestore';

// Setup racks
CacheRack.useCacheMiddleware(new CacheMiddleware());
NetworkRack.useHttpMiddleware(new HttpMiddleware());

// Setup Popup class
MobileIdentityConnect.usePopupClass(Popup);

// Setup Active User Storage class
ActiveUserHelper.useStorage(SecureStorage);

// Replace Files implementation
Kinvey.Files = new NativeScriptFileStore();

// Export
export { Kinvey };
