import DataStore, { DataStoreType, FileStore, SyncOperation } from './datastore';
import { Acl, Metadata, User } from './entity';
import { AuthorizationGrant, SocialIdentity } from './identity';
import Request, {
  AuthType,
  CacheMiddleware,
  CacheRack,
  CacheRequest,
  DeltaFetchRequest,
  Headers,
  HttpMiddleware,
  KinveyRequest,
  KinveyResponse,
  MemoryAdapter,
  Middleware,
  NetworkRack,
  NetworkRequest,
  ParseMiddleware,
  Properties,
  Rack,
  RequestMethod,
  Response,
  SerializeMiddleware,
  StatusCode,
  Storage
} from './request';
import Aggregation from './aggregation';
import Client from './client';
import CustomEndpoint from './endpoint';
import { Kinvey } from './kinvey';
import Query from './query';

const Files = new FileStore();

// Export modules
export {
  Acl,
  Aggregation,
  Aggregation as Group,
  AuthorizationGrant,
  AuthType,
  CacheMiddleware,
  CacheRack,
  CacheRequest,
  Client,
  CustomEndpoint,
  DataStore,
  DataStoreType,
  DeltaFetchRequest,
  Files,
  Headers,
  HttpMiddleware,
  Kinvey,
  KinveyRequest,
  KinveyResponse,
  MemoryAdapter,
  Metadata,
  Middleware,
  NetworkRack,
  NetworkRequest,
  ParseMiddleware,
  Properties,
  Query,
  Rack,
  Request,
  RequestMethod,
  Response,
  SerializeMiddleware,
  SocialIdentity,
  StatusCode,
  Storage,
  SyncOperation,
  User
};

// Export errors
export * from './errors';

// Export utils
export * from './utils';

// Export default
export default Kinvey;
