/* eslint-disable camelcase */
import { Social } from './social';
import { Promise } from 'es6-promise';
import { KinveyError } from '../../errors';
import { randomString } from '../../utils/string';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import querystring from 'querystring';
import assign from 'lodash/assign';
import url from 'url';

export class Facebook extends Social {
  get identity() {
    return 'Facebook';
  }

  async login(redirectUrl, options = {}) {
    options = assign({
      rerequest: false,
      scope: 'public_profile'
    }, options);

    // If the app is already logged in and has a token
    // then just return the token.
    if (this.loggedIn) {
      const token = this.token;

      if (token) {
        return token;
      }
    }

    // Throw an error if we do not have a way to present the popup.
    if (!global.KinveyPopup) {
      throw new KinveyError('KinveyPopup is undefined. Unable to login with Facebook.');
    }

    const promise = new Promise((resolve, reject) => {
      const popup = new global.KinveyPopup();
      let redirected = false;
      const query = {
        client_id: this.appId,
        redirect_uri: redirectUrl,
        response_type: 'token',
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
          error,
          error_description,
          error_reason,
          state
        } = querystring.parse(urlString);

        if (state === query.state) {
          if (access_token) {
            const token = { accessToken: access_token };
            this.loggedIn = true;
            this.token = token;
            resolve(token);
          } else if (error) {
            this.loggedIn = false;
            this.token = null;
            reject({ reason: error_reason, error: error, description: error_description });
          } else {
            this.loggedIn = false;
            this.token = null;
            reject({ reason: 'not_authorized', error: 'access_denied', description: 'Your app is not authorized.' });
          }
        } else {
          this.loggedIn = false;
          this.token = null;
          reject({ reason: 'state_mismatch', error: 'access_denied', description: 'The state did not match.' });
        }
      }

      function loadCallback(event) {
        const urlString = event.url;

        try {
          if (urlString && urlString.indexOf(redirectUrl) === 0 && redirected === false) {
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
          if (urlString && urlString.indexOf(redirectUrl) === 0 && redirected === false) {
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
}

