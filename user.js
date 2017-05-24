import { User } from 'kinvey-js-sdk';
import url from 'url';
import isString from 'lodash/isString';
import { Popup } from './popup';
const application = require('application'); // eslint-disable-line import/no-unresolved, import/extensions, import/no-extraneous-dependencies

class NativeScriptUser extends User {
  static processMICRedirect(redirectUrl) {
    if (!redirectUrl || isString(redirectUrl) === false) {
      return false;
    }

    const code = url.parse(redirectUrl, true).query.code;

    if (!code) {
      return false;
    }

    application.notify({
      eventName: 'MICRedirectNotification',
      url: redirectUrl
    });
    return true;
  }
}

// Setup popup
NativeScriptUser.usePopupClass(Popup);

// Export
export default NativeScriptUser;
