import CacheRequest from './src/cacherequest';
import DeltaFetchRequest from './src/deltafetchrequest';
import Headers from './src/headers';
import KinveyRequest, { AuthType, Properties } from './src/kinveyrequest';
import KinveyResponse from './src/kinveyresponse';
import NetworkRequest from './src/networkrequest';
import Request, { RequestMethod } from './src/request';
import Response, { StatusCode } from './src/response';

// Export
export {
  AuthType,
  CacheRequest,
  DeltaFetchRequest,
  Headers,
  KinveyRequest,
  KinveyResponse,
  NetworkRequest,
  Properties,
  RequestMethod,
  Response,
  StatusCode
};

// Export default
export default Request;
