import { loginWithRedirectUri } from './loginWithRedirectUri';

export async function loginWithMIC(redirectUri?: string, authorizationGrant?: any, options?: any) {
  return loginWithRedirectUri(redirectUri, options);
}
