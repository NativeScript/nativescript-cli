const CacheAdapter = {
  IndexedDB: 'IndexedDB',
  LocalStorage: 'LocalStorage',
  Memory: 'Memory',
  WebSQL: 'WebSQL'
};
Object.freeze(CacheAdapter);

const DataPolicy = {
  ForceLocal: 'LocalOnly',
  LocalOnly: 'LocalOnly',
  PreferLocal: 'PreferLocal',
  LocalFirst: 'PreferLocal',
  ForceNetwork: 'NetworkOnly',
  NetworkOnly: 'NetworkOnly',
  PreferNetwork: 'PreferNetwork',
  NetworkFirst: 'PreferNetwork'
};
Object.freeze(DataPolicy);

const HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PATCH: 'PATCH',
  PUT: 'PUT',
  DELETE: 'DELETE'
};
Object.freeze(HttpMethod);

const RackType = {
  Network: 'Network',
  Cache: 'Cache'
};
Object.freeze(RackType);

const ResponseType = {
  Blob: 'blob',
  Document: 'document',
  DOMString: 'domstring',
  JSON: 'json',
  Text: 'text'
};
Object.freeze(ResponseType);

const SocialAdapter = {
  Facebook: 'Facebook',
  Google: 'Google',
  LinkedIn: 'LinkedIn',
  Twitter: 'Twitter'
};
Object.freeze(SocialAdapter);

const StatusCode = {
  Ok: 200,
  Created: 201,
  RedirectTemporarily: 301,
  RedirectPermanetly: 302,
  NotFound: 404,
  ServerError: 500
};
Object.freeze(StatusCode);

const WritePolicy = {
  Local: 'Local',
  Network: 'Network'
};
Object.freeze(WritePolicy);

module.exports = {
  DataPolicy: DataPolicy,
  HttpMethod: HttpMethod,
  RackType: RackType,
  ResponseType: ResponseType,
  SocialAdapter: SocialAdapter,
  StatusCode: StatusCode,
  CacheAdapter: CacheAdapter,
  WritePolicy: WritePolicy
};
