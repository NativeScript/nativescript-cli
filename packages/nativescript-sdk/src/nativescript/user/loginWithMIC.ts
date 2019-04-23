import { AuthorizationGrant } from 'kinvey-js-sdk';
import { loginWithRedirectUri } from './loginWithRedirectUri';

export async function loginWithMIC(redirectUri?: string, authorizationGrant?: AuthorizationGrant, options?: any) {
  return loginWithRedirectUri(redirectUri, options);
}
