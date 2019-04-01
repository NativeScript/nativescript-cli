import * as app from 'tns-core-modules/application';
import { getDataFromPackageJson } from '../utils';
import { loginWithRedirectUri as loginWithRedirectUriCommon } from 'kinvey-js-sdk/src/user/loginWithRedirectUri';

declare const NSBundle: any;

function getAppIdentifier() {
  if (app.android) {
    return app.android.packageName;
  } else if (app.ios) {
    return NSBundle.mainBundle.bundleIdentifier;
  }
  return null;
}

function isInsidePreviewApp() {
  return getAppIdentifier() === 'org.nativescript.preview';
}

export function loginWithRedirectUri(providedRedirectUri: string, options: any) {
  const redirectUri = isInsidePreviewApp() ? 'nsplayresume://' : providedRedirectUri;
  const config = getDataFromPackageJson();
  return loginWithRedirectUriCommon(redirectUri || config.redirectUri, options);
}
