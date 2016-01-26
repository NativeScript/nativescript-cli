const AuthorizationGrant = {
  AuthorizationCodeLoginPage: 'AuthorizationCodeLoginPage',
  AuthorizationCodeAPI: 'AuthorizationCodeAPI'
};
Object.freeze(AuthorizationGrant);
export { AuthorizationGrant };

const CacheAdapter = {
  IndexedDB: 'IndexedDB',
  LocalStorage: 'LocalStorage',
  Memory: 'Memory',
  WebSQL: 'WebSQL'
};
Object.freeze(CacheAdapter);
export { CacheAdapter };

const ReadPolicy = {
  LocalOnly: 'LocalOnly',
  LocalFirst: 'LocalFirst',
  NetworkOnly: 'NetworkOnly',
  NetworkFirst: 'NetworkFirst',
};
Object.freeze(ReadPolicy);
export { ReadPolicy };

const HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PATCH: 'PATCH',
  PUT: 'PUT',
  DELETE: 'DELETE'
};
Object.freeze(HttpMethod);
export { HttpMethod };

const RackType = {
  Network: 'Network',
  Cache: 'Cache'
};
Object.freeze(RackType);
export { RackType };

const ResponseType = {
  Blob: 'blob',
  Document: 'document',
  DOMString: 'domstring',
  JSON: 'json',
  Text: 'text'
};
Object.freeze(ResponseType);
export { ResponseType };

const SocialIdentity = {
  Facebook: 'facebook',
  Google: 'google',
  LinkedIn: 'linkedin'
};
Object.freeze(SocialIdentity);
export { SocialIdentity };

const StatusCode = {
  Ok: 200,
  Created: 201,
  RedirectTemporarily: 301,
  RedirectPermanetly: 302,
  NotFound: 404,
  ServerError: 500
};
Object.freeze(StatusCode);
export { StatusCode };

const StoreType = {
  Local: 'Local',
  Network: 'Network',
  Default: 'Default'
};
Object.freeze(StoreType);
export { StoreType };

const WritePolicy = {
  LocalOnly: 'LocalOnly',
  LocalFirst: 'LocalFirst',
  NetworkOnly: 'NetworkOnly',
  NetworkFirst: 'NetworkFirst'
};
Object.freeze(WritePolicy);
export { WritePolicy };
