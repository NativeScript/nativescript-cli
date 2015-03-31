/**
 * Copyright 2015 Kinvey, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Mobile Identity Connect
// ----

var MIC = {
  /**
   * Auth Host
   *
   * @constant
   * @default
   */
  AUTH_HOST: 'https://auth.kinvey.com',

  /**
   * Auth Path
   *
   * @constant
   * @default
   */
  AUTH_PATH: '/oauth/auth',

  /**
   * Token Path
   *
   * @constant
   * @default
   */
  TOKEN_PATH: '/oauth/token',

  /**
   * Auth Provider
   *
   * @constant
   * @default
   */
  AUTH_PROVIDER: 'kinveyAuth',

  /**
   * Token Storage Key
   *
   * @constant
   * @default
   */
  TOKEN_STORAGE_KEY: 'micToken',

  /**
   * Login with MIC using the authorization grant.
   *
   * @param  {string} authorizationGrant Authorization grant.
   * @param  {string} redirectUri        Redirect uri.
   * @param  {Object} options            Options.
   * @return {Promise}                   The user.
   */
  login: function(authorizationGrant, redirectUri, options) {
    var clientId = Kinvey.appKey;

    return Storage.get(MIC.TOKEN_STORAGE_KEY).then(function(token) {
      if (null != token) {
        if (MIC.isTokenExpired(token)) {
          return MIC.refreshToken('refresh_token', clientId, redirectUri, token.refresh_token, options).catch(function() {
            return Storage.destroy(MIC.TOKEN_STORAGE_KEY);
          }).then(function() {
            return MIC.login(authorizationGrant, redirectUri, options);
          });
        }
        else {
          return token;
        }
      }
      else if (Kinvey.User.MIC.AuthorizationGrant.AuthorizationCodeLoginPage === authorizationGrant) {
        return MIC.requestCode(clientId, redirectUri, 'code', options).then(function(code) {
          return MIC.requestToken('authorization_code', clientId, redirectUri, code, options);
        });
      }
    }).then(function(token) {
      return Storage.save(MIC.TOKEN_STORAGE_KEY, token).then(function() {
        return token;
      });
    }).then(function(token) {
      options.create = options.create || true;
      return MIC.connect(activeUser, MIC.AUTH_PROVIDER, token.access_token, options);
    });
  },

  /**
   * Request a code by opening a popup up to a url.
   *
   * @param  {string} clientId    Client id or app key.
   * @param  {string} redirectUri Redirect uri.
   * @param  {Object} options     Options.
   * @return {Promise}            The code.
   */
  requestCode: function(clientId, redirectUri, responseType, options) {
    // Popup blockers only allow opening a dialog at this moment.
    var blank = 'about:blank';
    var popup = root.open(blank, 'KinveyMIC');
    popup.location = MIC.AUTH_HOST + MIC.AUTH_PATH + '?client_id=' + clientId +
                    '&redirect_uri=' + redirectUri + '&response_type=' + responseType;

    // Obtain the tokens from the login dialog.
    var deferred = Kinvey.Defer.deferred();

    // Popup management.
    var elapsed = 0; // Time elapsed since opening the popup.
    var interval = 100; // ms.
    var timer = root.setInterval(function() {
      var error;

      // The popup was blocked.
      if(null == popup) {
        root.clearTimeout(timer);// Stop listening.

        // Return the response.
        error = clientError(Kinvey.Error.SOCIAL_ERROR, {
          debug: 'The popup was blocked.'
        });
        deferred.reject(error);
      }

      // The popup closed unexpectedly.
      else if(popup.closed) {
        root.clearTimeout(timer);// Stop listening.

        // Return the response.
        error = clientError(Kinvey.Error.SOCIAL_ERROR, {
          debug: 'The popup was closed unexpectedly.'
        });
        deferred.reject(error);
      }

      // The user waited too long to reply to the authorization request.
      else if(options.timeout && elapsed > options.timeout) {// Timeout.
        root.clearTimeout(timer);// Stop listening.
        popup.close();

        // Return the response.
        error = clientError(Kinvey.Error.SOCIAL_ERROR, {
          debug: 'The authorization request timed out.'
        });
        deferred.reject(error);
      }

      // The popup is still active, check its location.
      else {
        // Firefox will throw an exception when `popup.location.host` has
        // a different origin.
        var host = false;
        try {
          host = blank !== popup.location.toString();
        }
        catch(e) { }

        // Continue if the popup was redirected back to our domain.
        if (host) {
          root.clearTimeout(timer); // Stop listening.

          // Extract tokens from the url.
          var location = popup.location;
          var tokenString = location.search.substring(1) + '&' + location.hash.substring(1);
          var tokens = MIC.tokenize(tokenString);
          deferred.resolve(tokens.code);

          // Close the popup.
          popup.close();
        }
      }

      // Update elapsed time.
      elapsed += interval;
    }, interval);

    // Return the promise.
    return deferred.promise;
  },

  /**
   * Request a token from MIC using the provided code.
   *
   * @param  {string} grantType   Grant type.
   * @param  {string} clientId    Client id or app key.
   * @param  {string} redirectUri Redirect uri.
   * @param  {string} code        MIC Code.
   * @param  {Object} options     Options.
   * @return {Promise}            The token.
   */
  requestToken: function(grantType, clientId, redirectUri, code, options) {
    // Create a request
    var request = {
      auth: Auth.App,
      method: 'POST',
      url: MIC.AUTH_HOST + MIC.TOKEN_PATH,
      data: {
        grant_type: grantType,
        client_id: clientId,
        redirect_uri: redirectUri,
        code: code
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'X-Kinvey-API-Version': Kinvey.API_VERSION,
        'X-Kinvey-Device-Information': deviceInformation()
      }
    };

    // Debug.
    if(KINVEY_DEBUG) {
      request.headers['X-Kinvey-Trace-Request'] = 'true';
      request.headers['X-Kinvey-Force-Debug-Log-Credentials'] = 'true';
    }

    return request.auth().then(function(auth) {
      if (null !== auth) {
        // Format credentials.
        var credentials = auth.credentials;
        if (null != auth.username) {
          credentials = Kinvey.Persistence.Net.base64(auth.username + ':' + auth.password);
        }

        // Append header.
        request.headers.Authorization = auth.scheme + ' ' + credentials;
      }

      // Send request
      return Kinvey.Persistence.Net.request(
        request.method,
        request.url,
        MIC.encodeFormData(request.data),
        request.headers,
        options
      );
    });
  },

  refreshToken: function(grantType, clientId, redirectUri, refreshToken, options) {
    // Create a request
    var request = {
      auth: Auth.App,
      method: 'POST',
      url: MIC.AUTH_HOST + MIC.TOKEN_PATH,
      data: {
        grant_type: grantType,
        client_id: clientId,
        redirect_uri: redirectUri,
        refresh_token: refreshToken
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'X-Kinvey-API-Version': Kinvey.API_VERSION,
        'X-Kinvey-Device-Information': deviceInformation()
      }
    };

    // Debug.
    if(KINVEY_DEBUG) {
      request.headers['X-Kinvey-Trace-Request'] = 'true';
      request.headers['X-Kinvey-Force-Debug-Log-Credentials'] = 'true';
    }

    return request.auth().then(function(auth) {
      if (null !== auth) {
        // Format credentials.
        var credentials = auth.credentials;
        if (null != auth.username) {
          credentials = Kinvey.Persistence.Net.base64(auth.username + ':' + auth.password);
        }

        // Append header.
        request.headers.Authorization = auth.scheme + ' ' + credentials;
      }

      // Send request
      return Kinvey.Persistence.Net.request(
        request.method,
        request.url,
        MIC.encodeFormData(request.data),
        request.headers,
        options
      );
    });
  },

  /**
   * Links a social identity to the provided (if any) Kinvey user.
   *
   * @param {Object} [user] The associated user.
   * @param {string} provider The provider.
   * @param {Options} [options] Options.
   * @param {boolean} [options.create=true] Create a new user if no user with
   *          the provided social identity exists.
   * @returns {Promise} The user.
   */
  connect: function(user, provider, accessToken, options) {
    var error;

    // Update the user data.
    user = user || {};

    // If the user is the active user, forward to `Kinvey.User.update`.
    var activeUser = Kinvey.getActiveUser();
    user._socialIdentity = user._socialIdentity || {};
    user._socialIdentity[provider] = {
      access_token: accessToken
    };

    if (null != activeUser) {
      // Check activeUser for property _id. Thrown error will reject promise.
      if (activeUser._id == null) {
        error = new Kinvey.Error('Active user does not have _id property defined.');
        throw error;
      }

      if (activeUser._id === user._id) {
        options._provider = provider; // Force tokens to be updated.
        return Kinvey.User.update(user, options);
      }
    }

    // Attempt logging in with the tokens.
    user._socialIdentity = {};
    user._socialIdentity[provider] = {
      access_token: accessToken
    };
    return Kinvey.User.login(user, null, options).then(null, function(error) {
      // If `options.create`, attempt to signup as a new user if no user with
      // the identity exists.
      if (options.create && Kinvey.Error.USER_NOT_FOUND === error.name) {
        return Kinvey.User.signup(user, options).then(function(user) {
          return MIC.connect(user, provider, accessToken, options);
        });
      }
      else if (Kinvey.Error.ALREADY_LOGGED_IN) {
        return Kinvey.User.update(user, options);
      }


      return Kinvey.Defer.reject(error);
    });
  },

  /**
   * Tokenizes a string.
   *
   * @example foo=bar&baz=qux -> { foo: "bar", baz: "qux" }
   * @param {string} string The token string.
   * @returns {Object} The tokens.
   */
  tokenize: function(string) {
    var tokens = {};
    string.split('&').forEach(function(pair) {
      var segments = pair.split('=', 2).map(root.decodeURIComponent);
      if(segments[0]) {
        tokens[segments[0]] = segments[1];
      }
    });
    return tokens;
  },

  /**
   * Encodes the data as form data.
   *
   * @param  {object} data Data to encode.
   * @return {string} Encoded data string.
   */
  encodeFormData: function(data) {
    var str = [];
    for (var p in data) {
      if (data.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + '=' + encodeURIComponent(data[p]));
      }
    }
    return str.join('&');
  },

  isTokenExpired: function(token) {
    if (null != token) {
      var expiredDate = new Date(0);
      expiredDate.setUTCSeconds(token.expires_in);
      return (expiredDate.valueOf() > new Date().valueOf());
    }

    return false;
  }
};

/**
 * @memberof! <global>
 * @namespace Kinvey.User.MIC
 */
Kinvey.User = Kinvey.User || {};
Kinvey.User.MIC = /** @lends Kinvey.User.MIC */ {

  /**
   * Enum for authorization grant values.
   *
   * @readOnly
   * @enum {string}
   */
  AuthorizationGrant: {
    AuthorizationCodeLoginPage: 'LoginPage', // Uses Authentication Flow #1: Authentication Grant
    AuthorizationCodeAPI: 'API' // Uses Authentication Flow #2: Authentication Grant without a login page
  },

  /**
   * Login with Mobile Identity Connect (MIC) using the provided authorization grant.
   *
   * @param  {Kinvey.User.MIC.AuthorizationGrant} authorizationGrant Authorization grant.
   * @param  {string}                             redirectUri        Redirect uri.
   * @param  {Object}                             options            Options.
   * @return {Promise}                                               The user.
   */
  login: function(authorizationGrant, redirectUri, options) {
    var promise = MIC.login(authorizationGrant, redirectUri, options);
    return wrapCallbacks(promise, options);
  }
};

