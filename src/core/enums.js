/**
 * Enum for Mobile Identity Connect authorization grants.
 */
const AuthorizationGrant = {
  AuthorizationCodeLoginPage: 'AuthorizationCodeLoginPage',
  AuthorizationCodeAPI: 'AuthorizationCodeAPI'
};
Object.freeze(AuthorizationGrant);
export { AuthorizationGrant };

/**
 * @private
 * Enum for Cache Adapters.
 */
const CacheAdapter = {
  IndexedDB: 'IndexedDB',
  LocalStorage: 'LocalStorage',
  Memory: 'Memory',
  WebSQL: 'WebSQL'
};
Object.freeze(CacheAdapter);
export { CacheAdapter };

/**
 * Enum for Read Policies.
 */
const ReadPolicy = {
  LocalOnly: 'LocalOnly',
  LocalFirst: 'LocalFirst',
  NetworkOnly: 'NetworkOnly',
  NetworkFirst: 'NetworkFirst',
};
Object.freeze(ReadPolicy);
export { ReadPolicy };

/**
 * @private
 * Enum for Http Methods.
 */
const HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PATCH: 'PATCH',
  PUT: 'PUT',
  DELETE: 'DELETE'
};
Object.freeze(HttpMethod);
export { HttpMethod };

/**
 * @private
 * Enum for Rack types.
 */
const RackType = {
  Network: 'Network',
  Cache: 'Cache'
};
Object.freeze(RackType);
export { RackType };

/**
 * @private
 * Enum for Response types.
 */
const ResponseType = {
  Blob: 'blob',
  Document: 'document',
  DOMString: 'domstring',
  JSON: 'json',
  Text: 'text'
};
Object.freeze(ResponseType);
export { ResponseType };

/**
 * Enum for Social Identities.
 */
const SocialIdentity = {
  Facebook: 'facebook',
  Google: 'google',
  LinkedIn: 'linkedin'
};
Object.freeze(SocialIdentity);
export { SocialIdentity };

/**
 * @provate
 * Enum for Status Codes.
 */
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

/**
 * Enum for DataStore types.
 */
const StoreType = {
  Sync: 'Sync',
  Cache: 'Cache',
  Network: 'Network'
};
Object.freeze(StoreType);
export { StoreType };

/**
 * @private
 * Enum for Write Policies.
 */
const WritePolicy = {
  LocalOnly: 'LocalOnly',
  LocalFirst: 'LocalFirst',
  NetworkOnly: 'NetworkOnly',
  NetworkFirst: 'NetworkFirst'
};
Object.freeze(WritePolicy);
export { WritePolicy };
