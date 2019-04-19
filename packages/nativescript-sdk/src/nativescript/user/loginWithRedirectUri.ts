import * as app from 'tns-core-modules/application';
import { loginWithRedirectUri as loginWithRedirectUriCommon } from 'kinvey-js-sdk/lib/user/loginWithRedirectUri';
import { getDataFromPackageJson } from '../utils';

declare const NSBundle: any;

function getAppIdentifier(): string | null {
  if (app.android) {
    return app.android.packageName;
  } else if (app.ios) {
    return NSBundle.mainBundle.bundleIdentifier;
  }
  return null;
}

function getRedirectUri(redirectUri?: string) {
  const appIdentifier = getAppIdentifier();

  if (appIdentifier) {
    if (appIdentifier === 'org.nativescript.preview') {
      return 'nsplayresume://';
    } else if (appIdentifier === 'com.kinvey.preview') {
      return 'kspreviewresume://';
    }
  }

  return redirectUri;
}

export function loginWithRedirectUri(providedRedirectUri?: string, options?: any) {
  const redirectUri = getRedirectUri(providedRedirectUri);
  const config = getDataFromPackageJson();
  return loginWithRedirectUriCommon(redirectUri || config.redirectUri, options);
}
