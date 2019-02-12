import loginWithRedirectUri from './loginWithRedirectUri';

export default async function loginWithMIC(redirectUri, authorizationGrant, options) {
  return loginWithRedirectUri(redirectUri, options);
}
