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
 * Enum for DataStore types.
 */
const DataStoreType = {
  Sync: 'Sync',
  Cache: 'Cache',
  Network: 'Network'
};
Object.freeze(DataStoreType);
export { DataStoreType };

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
