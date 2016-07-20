/* eslint-disable camelcase */
import { Social } from './social';
import { SocialIdentity } from './enums';
import { Promise } from 'es6-promise';
import { KinveyError } from '../../errors';
import { randomString } from '../../utils/string';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import querystring from 'querystring';
import assign from 'lodash/assign';
import url from 'url';

export class Facebook extends Social {
  static get identity() {
    return SocialIdentity.Facebook;
  }

  isSupported() {
    return !!global.KinveyPopup;
  }

  async login(options = {}) {
    options = assign({
      rerequest: false,
      scope: 'public_profile'
    }, options);

    if (!this.isSupported()) {
      throw new KinveyError(`Unable to login with ${this.identity}. It is not supported on this platform.`);
    }

    const session = this.session;
    if (session && this.isOnline(session)) {
      return session;
    }

    const clientId = await this.findClientId(options);
    if (!clientId) {
      throw new KinveyError(`Unable to login with ${this.identity}. `
        + ' No client id was provided. Please make sure you have setup your backend correctly.');
    }

    const promise = new Promise((resolve, reject) => {
      const redirectUri = '';
      const popup = new global.KinveyPopup();
      let redirected = false;
      const query = {
        client_id: this.appId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: options.scope,
        state: randomString()
      };

      // Allow login requests to ask for previously
      // denied permissions.
      if (options.rerequest === true) {
        query.auth_type = 'rerequest';
      }

      // Handle the response from a login request
      function oauthCallback(urlString) {
        const {
          access_token,
          token_type,
          expires_in,
          error,
          error_description,
          error_reason,
          state
        } = querystring.parse(urlString);

        if (state === query.state) {
          if (access_token) {
            const session = {
              access_token: access_token,
              type: token_type,
              expires_in: expires_in,
              clientId: clientId
            };
            this.loggedIn = true;
            this.session = session;
            resolve(session);
          } else if (error) {
            this.loggedIn = false;
            this.session = null;
            reject({ reason: error_reason, error: error, description: error_description });
          } else {
            this.loggedIn = false;
            this.session = null;
            reject({ reason: 'not_authorized', error: 'access_denied', description: 'Your app is not authorized.' });
          }
        } else {
          this.loggedIn = false;
          this.session = null;
          reject({ reason: 'state_mismatch', error: 'access_denied', description: 'The state did not match.' });
        }
      }

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
        query: query
      }));
    });

    return promise;
  }

  async logout() {
    const session = this.session;

    // If nobody has logged in then just return because we are logged out
    if (!session) {
      return;
    }

    // Logout
    this.session = null;
  }
}

