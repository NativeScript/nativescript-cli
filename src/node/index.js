import { NetworkRack } from '../core/request';
import { HttpMiddleware } from './middleware';

// Setup racks
NetworkRack.useHttpMiddleware(new HttpMiddleware());

// Export
export * from '../core/kinvey';
export * from '../core/aggregation';
export * from '../core/datastore';
export * from '../core/entity';
export * from '../core/errors';
export { AuthorizationGrant } from '../core/identity';
export * from '../core/live';
export { Log } from '../core/utils';
export * from '../core/endpoint';
export * from '../core/query';
