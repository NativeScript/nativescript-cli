import { Injectable } from '@angular/core';
import { getActiveUser, login, logout } from 'kinvey-js-sdk/lib/identity/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  getActiveUser() {
    return getActiveUser();
  }

  login(username, password?) {
    return login(username, password);
  }

  logout() {
    return logout();
  }
}
