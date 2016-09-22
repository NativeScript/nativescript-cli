/* eslint-disable camelcase */
import { Social } from './social';
import { SocialIdentity } from './enums';
import { KinveyError } from '../../errors';
import { randomString } from '../../utils';
import { Popup } from 'kinvey-popup'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
import Promise from 'pinkie';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import assign from 'lodash/assign';
import querystring from 'querystring';
import url from 'url';

/**
 * @private
 */
export class Facebook extends Social {
  get identity() {
    return SocialIdentity.Facebook;
  }

  static get identity() {
    return SocialIdentity.Facebook;
  }

  isSupported() {
    return !!Popup;
  }

  async login(clientId, options = {}) {
    options = assign({
      force: false,
      scope: 'public_profile'
    }, options);

    if (!this.isSupported()) {
      throw new KinveyError(`Unable to login with ${this.identity}. It is not supported on this platform.`);
    }

    const session = this.session;
    if (session && this.isOnline(session)) {
      return session;
    }

    if (!clientId) {
      throw new KinveyError(`Unable to login with ${this.identity}. `
        + ' No client id was provided.');
    }

    const promise = new Promise((resolve, reject) => {
      const redirectUri = options.redirectUri || global.location.href;
      const originalState = randomString();
      const popup = new Popup();
      let redirected = false;

      // Handle the response from a login request
      const oauthCallback = (urlString) => {
        const { hash } = url.parse(urlString);
        const {
          access_token,
          expires_in,
          error,
          error_description,
          error_reason,
          state
        } = querystring.parse(hash.substring(1));
        const expiresIn = parseInt(expires_in, 10);
        const expires = ((new Date()).getTime() / 1e3) + (expiresIn || (60 * 60 * 24 * 365));

        if (state === originalState) {
          if (access_token) {
            const session = {
              access_token: access_token,
              expires_in: expiresIn,
              expires: expires,
              client_id: clientId
            };
            this.session = session;
            resolve(session);
          } else if (error) {
            this.session = null;
            reject({ reason: error_reason, error: error, description: error_description });
          } else {
            this.session = null;
            reject({ reason: 'not_authorized', error: 'access_denied', description: 'Your app is not authorized.' });
          }
        } else {
          this.session = null;
          reject({ reason: 'state_mismatch', error: 'access_denied', description: 'The state did not match.' });
        }
      };

      function loadCallback(event) {
        const urlString = event.url;

        try {
          if (urlString && urlString.indexOf(redirectUri) === 0 && redirected === false) {
            redirected = true;
            popup.removeAllListeners();
            popup.close();
            oauthCallback(urlString);
          }
        } catch (error) {
          // Just catch the error
        }
      }

      function errorCallback(event) {
        const urlString = event.url;

        try {
          if (urlString && urlString.indexOf(redirectUri) === 0 && redirected === false) {
            redirected = true;
            popup.removeAllListeners();
            popup.close();
            oauthCallback(urlString);
          } else if (redirected === false) {
            popup.removeAllListeners();
            popup.close();
            reject(new KinveyError(event.message, '', event.code));
          }
        } catch (error) {
          // Just catch the error
        }
      }

      function closedCallback() {
        if (redirected === false) {
          popup.removeAllListeners();
          reject(new KinveyError('Facebook login has been cancelled.'));
        }
      }

      popup.on('loadstart', loadCallback);
      popup.on('loadstop', loadCallback);
      popup.on('error', errorCallback);
      popup.on('closed', closedCallback);
      popup.open(url.format({
        protocol: 'https:',
        host: 'www.facebook.com',
        pathname: '/dialog/oauth',
        query: {
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: 'token',
          scope: options.scope,
          auth_type: options.force === true ? 'rerequest' : null,
          state: originalState
        }
      }));
    });

    return promise;
  }

  async logout() {
    this.session = null;
  }
}

