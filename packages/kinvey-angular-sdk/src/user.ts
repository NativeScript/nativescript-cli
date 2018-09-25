import { Injectable } from '@angular/core';
import { User, AuthorizationGrant } from './sdk';

@Injectable({
  providedIn: 'root'
})
export class KinveyUserService {
  get AuthorizationGrant() {
    return AuthorizationGrant;
  }

  getActiveUser() {
    return User.getActiveUser();
  }

  signup(data?, options?) {
    return User.signup(data, options);
  }

  login(username, password?) {
    return User.login(username, password);
  }

  loginWithMIC(redirectUri?, authorizationGrant?, options?) {
    return User.loginWithMIC(redirectUri, authorizationGrant, options);
  }

  logout() {
    return User.logout();
  }

  me() {
    return User.me();
  }

  update(data) {
    return User.update(data);
  }

  remove(id, options?) {
    return User.remove(id, options);
  }

  verifyEmail(username) {
    return User.verifyEmail(username);
  }

  forgotUsername(email) {
    return User.forgotUsername(email);
  }

  resetPassword(username) {
    return User.resetPassword(username);
  }

  lookup(query) {
    return User.lookup(query);
  }

  exists(username) {
    return User.exists(username);
  }
}
