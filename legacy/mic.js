import { User as CoreUser } from '../src/user';
import { User } from './user';
import { AuthorizationGrant } from '../src/enums';

export class MobileIdentityConnect {
  static loginWithAuthorizationCodeLoginPage(redirectUri, options) {
    return CoreUser.loginWithMIC(redirectUri, AuthorizationGrant.AuthorizationCodeLoginPage, options).then(user => {
      return user.toJSON();
    });
  }

  static loginWithAuthorizationCodeAPI(username, password, redirectUri, options = {}) {
    options.username = username;
    options.password = password;
    return CoreUser.loginWithMIC(redirectUri, AuthorizationGrant.AuthorizationCodeAPI, options).then(user => {
      return user.toJSON();
    });
  }

  static logout(options) {
    return User.logout(options);
  }
}
