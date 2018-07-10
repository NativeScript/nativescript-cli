import isString from 'lodash/isString';

/**
 * Enum for Mobile Identity Connect authorization grants.
 * @property  {string}    AuthorizationCodeLoginPage   AuthorizationCodeLoginPage grant
 * @property  {string}    AuthorizationCodeAPI         AuthorizationCodeAPI grant
 */
export const AuthorizationGrant = {
  AuthorizationCodeLoginPage: 'AuthorizationCodeLoginPage',
  AuthorizationCodeAPI: 'AuthorizationCodeAPI'
};
Object.freeze(AuthorizationGrant);

/**
 * @private
 */
export function login(redirectUri, authorizationGrant = AuthorizationGrant.AuthorizationCodeLoginPage, options = {}) {
  if (!isString(redirectUri)) {
    return Promise.reject(new Error('A redirectUri is required and must be a string.'));
  }

  let clientId = this.client.appKey;

  if (isString(options.micId)) {
    clientId = `${clientId}.${options.micId}`;
  }
}
