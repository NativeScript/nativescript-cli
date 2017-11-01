import { CacheRack, NetworkRack } from '../core/request';
import { MobileIdentityConnect } from '../core/identity';
import { CacheMiddleware } from './cache';
import { HttpMiddleware } from './http';
import { Popup } from './popup';
import { FileStore } from './filestore';

// Setup racks
CacheRack.useCacheMiddleware(new CacheMiddleware());
NetworkRack.useHttpMiddleware(new HttpMiddleware());

// Setup popup
MobileIdentityConnect.usePopupClass(Popup);

// Create a new instance of the FileStore
const Files = new FileStore();

// Export
export * from './kinvey';
export * from '../core/aggregation';
export * from '../core/datastore/src/datastore';
export { Files };
export { SyncOperation } from '../core/datastore/src/sync';
export * from '../core/entity';
export * from '../core/errors';
export { AuthorizationGrant } from '../core/identity';
export * from '../core/live';
export { Log } from '../core/utils';
export * from '../core/endpoint';
export * from '../core/query';
export * from './push';
