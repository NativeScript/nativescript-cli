/* eslint-disable class-methods-use-this */

import { Injectable } from '@angular/core';
import exists from '../user/exists';
import forgotUsername from '../user/forgotUsername';
import login from '../user/login';
import loginWithRedirectUri from '../user/loginWithRedirectUri';
import loginWithUsernamePassword from '../user/loginWithUsernamePassword';
import loginWithMIC from '../user/loginWithMIC';
import logout from '../user/logout';
import lookup from '../user/lookup';
import me from '../user/me';
import remove from '../user/remove';
import resetPassword from '../user/resetPassword';
import restore from '../user/restore';
import signup from '../user/signup';
import update from '../user/update';
import getActiveUser from '../user/getActiveUser';
import verifyEmail from '../user/verifyEmail';

@Injectable({
  providedIn: 'root'
})
export default class UserService {
  exists(...args) {
    return exists(...args);
  }

  forgotUsername(...args) {
    return forgotUsername(...args);
  }

  login(...args) {
    return login(...args);
  }

  loginWithRedirectUri(...args) {
    return loginWithRedirectUri(...args);
  }

  loginWithUsernamePassword(...args) {
    return loginWithUsernamePassword(...args);
  }

  loginWithMIC(...args) {
    return loginWithMIC(...args);
  }

  logout(...args) {
    return logout(...args);
  }

  lookup(...args) {
    return lookup(...args);
  }

  me() {
    return me();
  }

  remove(...args) {
    return remove(...args);
  }

  resetPassword(...args) {
    return resetPassword(...args);
  }

  restore() {
    return restore();
  }

  signup(...args) {
    return signup(...args);
  }

  update(...args) {
    return update(...args);
  }

  getActiveUser() {
    return getActiveUser();
  }

  verifyEmail(...args) {
    return verifyEmail(...args);
  }
}
