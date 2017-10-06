import CacheRequest from './src/cache';
import DeltaFetchRequest from './src/deltafetch';
import Headers from './src/headers';
import NetworkRequest, { AuthType, KinveyRequest, Properties } from './src/network';
import Request, { RequestMethod } from './src/request';
import Response, { KinveyResponse, StatusCode } from './src/response';
import Rack, { CacheRack, NetworkRack } from './src/rack';
import Middleware, {
  CacheMiddleware,
  HttpMiddleware,
  MemoryAdapter,
  ParseMiddleware,
  SerializeMiddleware,
  Storage
} from './src/middleware';

// Export
export {
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
};

// Export default
export default Request;
