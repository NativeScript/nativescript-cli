import { Inject, Injectable } from '@angular/core';
import { init, User } from 'kinvey-html5-sdk';
import { KinveyConfigToken } from './utils';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(@Inject(KinveyConfigToken) config: any) {
    init(config);
  }

  exists(...args: any[]) {
    return (User as any).exists(...args);
  }

  forgotUsername(...args: any[]) {
    return (User as any).forgotUsername(...args);
  }

  login(...args: any[]) {
    return (User as any).login(...args);
  }

  loginWithRedirectUri(...args: any[]) {
    return (User as any).loginWithRedirectUri(...args);
  }

  loginWithUsernamePassword(...args: any[]) {
    return (User as any).loginWithUsernamePassword(...args);
  }

  loginWithMIC(...args: any[]) {
    return (User as any).loginWithMIC(...args);
  }

  logout(...args: any[]) {
    return (User as any).logout(...args);
  }

  lookup(...args: any[]) {
    return (User as any).lookup(...args);
  }

  me(...args: any[]) {
    return (User as any).me(...args);
  }

  remove(...args: any[]) {
    return (User as any).remove(...args);
  }

  resetPassword(...args: any[]) {
    return (User as any).resetPassword(...args);
  }

  restore(...args: any[]) {
    return (User as any).restore(...args);
  }

  signup(...args: any[]) {
    return (User as any).signup(...args);
  }

  update(...args: any[]) {
    return (User as any).update(...args);
  }

  getActiveUser(...args: any[]) {
    return (User as any).getActiveUser(...args);
  }

  verifyEmail(...args: any[]) {
    return (User as any).verifyEmail(...args);
  }
}
