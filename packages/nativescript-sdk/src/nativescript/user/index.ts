import { User as CoreUser, AuthorizationGrant } from 'kinvey-js-sdk';
import { loginWithMIC } from './loginWithMIC';
import { loginWithRedirectUri } from './loginWithRedirectUri';

export class User extends CoreUser {
  static loginWithMIC(redirectUri?: string, authorizationGrant?: AuthorizationGrant, options?: any) {
    return loginWithMIC(redirectUri, authorizationGrant, options);
  }

  static loginWithRedirectUri(redirectUri?: string, options?: any) {
    return loginWithRedirectUri(redirectUri, options);
  }
}
