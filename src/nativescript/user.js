import { User as CoreUser } from '../core/user';
import { getDataFromPackageJson } from './utils';

export class User extends CoreUser {
  loginWithMIC(redirectUri, authorizationGrant, options) {
    const config = getDataFromPackageJson();
    return super.loginWithMIC(redirectUri || config.redirectUri, authorizationGrant, options);
  }
}
