import { User as CoreUser } from 'kinvey-js-sdk';
import { loginWithMIC } from './loginWithMIC';
import { loginWithRedirectUri } from './loginWithRedirectUri';

export class User extends CoreUser {
  static loginWithMIC(redirectUri?: string, authorizationGrant?: any, options?: any) {
    return loginWithMIC(redirectUri, authorizationGrant, options);
  }

  static loginWithRedirectUri(redirectUri?: string, options?: any) {
    return loginWithRedirectUri(redirectUri, options);
  }
}
