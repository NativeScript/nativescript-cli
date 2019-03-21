import * as app from 'tns-core-modules/application';
import { getDataFromPackageJson } from '../helpers';
import loginWithRedirectUriCommon from './loginWithRedirectUriCommon';

function isInsidePreviewApp() {
  return getAppIdentifier() === "org.nativescript.preview";
}

function getAppIdentifier() {
  if (app.android) {
    return app.android.packageName;
  } else if (app.ios) {
    return NSBundle.mainBundle.bundleIdentifier;
  }
}

export default function loginWithRedirectUri(providedRedirectUri: string, options: any) {
  const redirectUri = isInsidePreviewApp() ? "nsplayresume://" : providedRedirectUri;
  const config = getDataFromPackageJson();
  return loginWithRedirectUriCommon(redirectUri || config.redirectUri, options);
}
