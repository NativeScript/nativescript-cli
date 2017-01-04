import LocalRequest from './src/local';
import DeltaFetchRequest from './src/deltafetch';
import Headers from './src/headers';
import NetworkRequest, { AuthType, KinveyRequest, Properties } from './src/network';
import Request, { RequestMethod } from './src/request';
import Response, { KinveyResponse, StatusCode } from './src/response';

// Export
export {
  AuthType,
  DeltaFetchRequest,
  Headers,
  KinveyRequest,
  KinveyResponse,
  LocalRequest,
  LocalRequest as CacheRequest,
  NetworkRequest,
  Properties,
  RequestMethod,
  Response,
  StatusCode
};

// Export default
export default Request;
