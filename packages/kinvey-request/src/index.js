const { CacheRequest } = require('./cache');
const { DeltaFetchRequest } = require('./deltafetch');
const { Headers } = require('./headers');
const { NetworkRequest, AuthType, KinveyRequest, Properties } = require('./network');
const { Request, RequestMethod } = require('./request');
const { Response, KinveyResponse, StatusCode } = require('./response');
const { Rack, CacheRack, NetworkRack } = require('./rack');
const {
  Middleware,
  CacheMiddleware,
  HttpMiddleware,
  MemoryAdapter,
  ParseMiddleware,
  SerializeMiddleware,
  Storage
} = require('./middleware');

module.exports = {
  AuthType: AuthType,
  CacheMiddleware: CacheMiddleware,
  CacheRack: CacheRack,
  CacheRequest: CacheRequest,
  DeltaFetchRequest: DeltaFetchRequest,
  Headers: Headers,
  HttpMiddleware: HttpMiddleware,
  KinveyRequest: KinveyRequest,
  KinveyResponse: KinveyResponse,
  MemoryAdapter: MemoryAdapter,
  Middleware: Middleware,
  NetworkRack: NetworkRack,
  NetworkRequest: NetworkRequest,
  ParseMiddleware: ParseMiddleware,
  Properties: Properties,
  Rack: Rack,
  Request: Request,
  RequestMethod: RequestMethod,
  Response: Response,
  SerializeMiddleware: SerializeMiddleware,
  StatusCode: StatusCode,
  Storage: Storage
};
