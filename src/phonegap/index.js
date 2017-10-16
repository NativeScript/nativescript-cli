import { CacheRack, NetworkRack } from '../core/request';
import { MobileIdentityConnect } from '../core/identity';
import { CacheMiddleware, HttpMiddleware } from './middleware';
import { Popup } from './popup';

// Setup racks
CacheRack.useCacheMiddleware(new CacheMiddleware());
NetworkRack.useHttpMiddleware(new HttpMiddleware());

// Setup popup
MobileIdentityConnect.usePopupClass(Popup);

// Export
export * from './kinvey';
export * from '../core/aggregation';
export * from '../core/datastore';
export * from '../core/entity';
export * from '../core/errors';
export { AuthorizationGrant } from '../core/identity';
export * from '../core/live';
export { Log } from '../core/utils';
export * from '../core/endpoint';
export * from '../core/query';
export * from './push';
