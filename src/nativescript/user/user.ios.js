import { User as CoreUser } from '../../core/user';

export class User extends CoreUser {
  static handleMICRedirectURL(redirectUri, micRedirectURL) {
    if (typeof redirectUri !== 'string') {
      throw new Error('redirectUri must be a string');
    }

    if (micRedirectURL instanceof NSURL) {
      micRedirectURL = micRedirectURL.absoluteString;
    }

    if (typeof micRedirectURL !== 'string') {
      throw new Error('micRedirectURL must be a string');
    }

    if (micRedirectURL.toLowerCase().indexOf(redirectUri.toLowerCase()) === 0) {
      NSNotificationCenter.defaultCenter.postNotificationNameObject('KinveyMICRedirectURL', micRedirectURL);
      return true;
    }

    return false;
  }
}
