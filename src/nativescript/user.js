import { User as CoreUser } from '../core/user';
import { getDataFromPackageJson } from './utils';
import * as app from "application";

export class User extends CoreUser {
  loginWithMIC(redirectUri, authorizationGrant, options) {
    redirectUri = isInsidePreviewApp() ? "nsplayresume://" : redirectUri;
    const config = getDataFromPackageJson();
    return super.loginWithMIC(redirectUri || config.redirectUri, authorizationGrant, options);
  }

  static loginWithMIC(redirectUri, authorizationGrant, options) {
    const user = new User();
    return user.loginWithMIC(redirectUri, authorizationGrant, options);
  }
}

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
