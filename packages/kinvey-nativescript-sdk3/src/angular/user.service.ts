/* eslint-disable class-methods-use-this */

import { Inject, Injectable } from '@angular/core';
import exists from '../core/user/exists';
import forgotUsername from '../core/user/forgotUsername';
import login from '../core/user/login';
import loginWithRedirectUri from '../core/user/loginWithRedirectUri';
import loginWithUsernamePassword from '../core/user/loginWithUsernamePassword';
import loginWithMIC from '../core/user/loginWithMIC';
import logout from '../core/user/logout';
import lookup from '../core/user/lookup';
import me from '../core/user/me';
import remove from '../core/user/remove';
import resetPassword from '../core/user/resetPassword';
import restore from '../core/user/restore';
import signup from '../core/user/signup';
import update from '../core/user/update';
import getActiveUser from '../core/user/getActiveUser';
import verifyEmail from '../core/user/verifyEmail';
import init from '../core/kinvey/init';
import { KinveyConfigToken } from './utils';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(@Inject(KinveyConfigToken) config: any) {
    init(config);
  }

  exists(username, options?) {
    return exists(username, options);
  }

  forgotUsername(email, options?) {
    return forgotUsername(email, options);
  }

  login(username, password?, options?) {
    return login(username, password, options);
  }

  loginWithRedirectUri(redirectUri, options?) {
    return loginWithRedirectUri(redirectUri, options);
  }

  loginWithUsernamePassword(username, password, options?) {
    return loginWithUsernamePassword(username, password, options);
  }

  loginWithMIC(redirectUri, authorizationGrant?, options?) {
    return loginWithMIC(redirectUri, authorizationGrant, options);
  }

  logout(options?) {
    return logout(options);
  }

  lookup(query, options?) {
    return lookup(query, options);
  }

  me() {
    return me();
  }

  remove(id, options?) {
    return remove(id, options);
  }

  resetPassword(username, options?) {
    return resetPassword(username, options);
  }

  restore() {
    return restore();
  }

  signup(data, options?) {
    return signup(data, options);
  }

  update(data) {
    return update(data);
  }

  getActiveUser() {
    return getActiveUser();
  }

  verifyEmail(username, options?) {
    return verifyEmail(username, options);
  }
}
