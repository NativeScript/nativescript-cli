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
   * @default 'https://auth.kinvey.com'
   */
  AUTH_HOST: 'https://auth.kinvey.com',

  /**
   * Auth Path
   *
   * @constant
   * @default '/oauth/auth'
   */
  AUTH_PATH: '/oauth/auth',

  /**
   * Token Path
   *
   * @constant
   * @default '/oauth/token'
   */
  TOKEN_PATH: '/oauth/token',

  /**
   * Auth Provider
   *
   * @constant
   * @default 'kinveyAuth'
   */
  AUTH_PROVIDER: 'kinveyAuth',

  /**
   * Token Storage Key
   *
   * @constant
   * @default 'micToken'
   */
  TOKEN_STORAGE_KEY: 'micToken',

  /**
   * Auth Timeout
   *
   * @constant
   * @default 5 minutes
   */
  AUTH_TIMEOUT: (1000 * 60 * 5),

  /**
   * Login with MIC.
   *
   * @param  {string}   authorizationGrant        Authorization Grant.
   * @param  {string}   redirectUri               Redirect Uri.
   * @param  {Object}   [options]                 Options.
   * @params {string}   [options.username]        Username for the user to be authorized.
   * @params {string}   [options.password]        Password for the user to be authorized.
   * @param  {boolean}  [options.create=true]     Create a new user if no user exists.
   * @param  {number}   [options.timeout=300000]  How long to wait for a successful authorization. Defaults to 5 minutes.
   * @return {Promise}                            Authorized user.
   */
  login: function(authorizationGrant, redirectUri, options) {
    var error;
    var promise;
    var clientId = Kinvey.appKey;
    var activeUser = Kinvey.getActiveUser();

    // Set defaults for options
    options = options || {};
    options.timeout = options.timeout || MIC.AUTH_TIMEOUT;

    if (null != activeUser) {
      // Reject with error because of active user
      error = clientError(Kinvey.Error.MIC_ERROR, {
        debug: 'A user is already logged in. To refresh a token used to authenticate a user, ' +
               'try calling Kinvey.User.MIC.refresh(). Or your can logout the user and try logging ' +
               'in again.'
      });
      return Kinvey.Defer.reject(error);
    }
    // Step 1: Check authorization grant type
    else if (Kinvey.User.MIC.AuthorizationGrant.AuthorizationCodeLoginPage === authorizationGrant) {
      // Step 2: Request a code
      promise = MIC.requestCode(clientId, redirectUri, options);
    }
    else if (Kinvey.User.MIC.AuthorizationGrant.AuthorizationCodeAPI === authorizationGrant) {
      if (null == options.username) {
        error = new Kinvey.Error('A username must be provided in the options argument to login with MIC using this flow.');
        return Kinvey.Defer.reject(error);
      }

      if (null == options.password) {
        error = new Kinvey.Error('A password must be provided in the options argument to login with MIC using this flow.');
        return Kinvey.Defer.reject(error);
      }

      // Step 2a: Request a temp login url
      promise = MIC.requestUrl(clientId, redirectUri, options).then(function(url) {
        // Step 2b: Request a code
        options.url = url + '?client_id=' + encodeURIComponent(clientId) + '&redirect_uri=' + encodeURIComponent(redirectUri) +
          '&response_type=code&username=' + encodeURIComponent(options.username) +
          '&password=' + encodeURIComponent(options.password);
        return MIC.requestCode(clientId, redirectUri, options);
      });
    }
    else {
      // Reject with error because of invalid authorization grant
      error = clientError(Kinvey.Error.MIC_ERROR, {
        debug: 'The authorization grant ' + authorizationGrant + ' is unrecognized. Please provide one of the ' +
               'following authorization grants: ' + Kinvey.User.MIC.AuthorizationGrant.AuthorizationCodeLoginPage + ', ' +
               Kinvey.User.MIC.AuthorizationGrant.AuthorizationCodeAPI + '.'
      });
      return Kinvey.Defer.reject(error);
    }

    return promise.then(function(code) {
      // Step 3: Request a token
      return MIC.requestToken(clientId, redirectUri, code, options);
    }).then(function(token) {
      // Step 4: Save the token
      return Storage.save(MIC.TOKEN_STORAGE_KEY, token).then(function() {
        return token;
      });
    }).then(function(token) {
      // Step 5: Connect the token with the user. Create a new user by default if one does not exist.
      options.create = options.create || true;
      return MIC.connect(Kinvey.getActiveUser(), token.access_token, options);
    });
  },

  /**
   * Refresh a MIC token.
   *
   * @param  {Object}   [options]   Options.
   * @return {Promise}              Authorized user.
   */
  refresh: function(options) {
    var error;
    options = options || {};
    options.attemptMICRefresh = false;

    // Step 1: Retrieve the saved token
    return Storage.get(MIC.TOKEN_STORAGE_KEY).then(function(token) {
      if (null != token) {
        // Step 2: Refresh the token
        return MIC.refreshToken(token.client_id, token.redirect_uri, token.refresh_token, options);
      }

      // Throw error to reject promise for missing token.
      error = clientError(Kinvey.Error.MIC_ERROR, {
        debug: 'Unable to refresh token because there is not a saved token to refresh. Try to ' +
               'login first by calling Kinvey.User.MIC.login().'
      });
      throw error;
    }).then(function(token) {
      // Step 3: Save the token
      return Storage.save(MIC.TOKEN_STORAGE_KEY, token).then(function() {
        return token;
      });
    }).then(function(token) {
      // Step 4: Connect the token with the user
      return MIC.connect(Kinvey.getActiveUser(), token.access_token, options);
    }, function(err) {
      return Storage.destroy(MIC.TOKEN_STORAGE_KEY).then(function() {
        throw err;
      });
    });
  },

  /**
   * Send a request to get a temp login url.
   *
   * @param  {string} clientId     Client Id.
   * @param  {string} redirectUri  Redirect Uri.
   * @param  {Object} options      Options.
   * @return {Promise}             Temp Login Uri.
   */
  requestUrl: function(clientId, redirectUri, options) {
    // Create a request
    var request = {
      method: 'POST',
      url: MIC.AUTH_HOST + MIC.AUTH_PATH,
      data: {
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code'
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

    // Send request
    return Kinvey.Persistence.Net.request(
      request.method,
      request.url,
      MIC.encodeFormData(request.data),
      request.headers,
      options
    ).then(function(response) {
      return response.temp_login_uri;
    });
  },

  /**
   * Request a code by opening a popup up to a url.
   *
   * @param  {string} clientId    Client Id.
   * @param  {string} redirectUri Redirect Uri.
   * @param  {Object} options     Options.
   * @return {Promise}            Code.
   */
  requestCode: function(clientId, redirectUri, options) {
    var error;
    var deferred = Kinvey.Defer.deferred();
    var url = MIC.AUTH_HOST + MIC.AUTH_PATH + '?client_id=' + encodeURIComponent(clientId) +
             '&redirect_uri=' + encodeURIComponent(redirectUri) + '&response_type=code';
    var popup;
    var popupManuallyClosed = false;
    options = options || {};

    // Load start handler
    var loadStartHandler = function(evt) {
      // Firefox will throw an exception when `popup.location.host` has
      // a different origin.
      var redirected = false;
      try {
        redirected = -1 !== evt.url.indexOf(redirectUri);
      }
      catch(e) { }

      // Continue if the popup was redirected.
      if (redirected) {
        // Extract tokens from the url.
        var location = evt.url;
        var tokenString = location.split('?')[1];
        var tokens = MIC.tokenize(tokenString);
        deferred.resolve(tokens.code);

        // Close the popup
        popupManuallyClosed = true;
        popup.close();
      }
    };

    // Inappbrowser exit handler: Used when running in Cordova only
    var exitHandler = function() {
      if (!popupManuallyClosed) {
        // Return the response.
        error = clientError(Kinvey.Error.MIC_ERROR, {
          debug: 'The popup was closed unexpectedly.'
        });
        deferred.reject(error);
      }

      // Remove event listeners
      popup.removeEventListener('loadstop', loadStartHandler);
      popup.removeEventListener('exit', exitHandler);
    };

    if (MIC.isPhoneGap()) {
      // Open the popup
      popup = root.open(options.url || url, '_blank', 'location=yes');

      if (null == popup) {
        // Return the response.
        error = clientError(Kinvey.Error.MIC_ERROR, {
          debug: 'The popup was blocked.'
        });
        deferred.reject(error);
      }
      else {
        popup.addEventListener('loadstart', loadStartHandler);
        popup.addEventListener('exit', exitHandler);
      }
    }
    else {
      // Open the popup
      popup = root.open(options.url || url, '_blank', 'toolbar=no,location=no');

      // Popup management.
      var elapsed = 0; // Time elapsed since opening the popup.
      var interval = 100; // ms.
      var timer = root.setInterval(function() {
        // The popup was blocked.
        if (null == popup) {
          root.clearTimeout(timer); // Stop listening.

          // Return the response.
          error = clientError(Kinvey.Error.MIC_ERROR, {
            debug: 'The popup was blocked.'
          });
          deferred.reject(error);
        }

        // The popup closed unexpectedly.
        else if (popup.closed) {
          root.clearTimeout(timer); // Stop listening.

          // Return the response.
          error = clientError(Kinvey.Error.MIC_ERROR, {
            debug: 'The popup was closed unexpectedly.'
          });
          deferred.reject(error);
        }
        // The user waited too long to reply to the authorization request.
        else if (options.timeout && elapsed > options.timeout) {
          root.clearTimeout(timer); // Stop listening.
          popup.close();

          // Return the response.
          error = clientError(Kinvey.Error.MIC_ERROR, {
            debug: 'The authorization request timed out.'
          });
          deferred.reject(error);
        }

        // The popup is still active, check its location.
        else {
          // Firefox will throw an exception when `popup.location.host` has
          // a different origin.
          var redirected = false;
          try {
            redirected = -1 !== popup.location.href.indexOf(redirectUri);
          }
          catch(e) { }

          // Continue if the popup was redirected.
          if (redirected) {
            root.clearTimeout(timer);

            // Extract tokens from the url.
            var location = popup.location;
            var tokenString = location.search.substring(1) + '&' + location.hash.substring(1);
            var tokens = MIC.tokenize(tokenString);
            deferred.resolve(tokens.code);

            // Close the popup
            popup.close();
          }
        }

        // Update elapsed time.
        elapsed += interval;
      }, interval);
    }

    // Return the promise.
    return deferred.promise;
  },

  /**
   * Request a token from MIC using the provided code.
   *
   * @param  {string} clientId    Client Id.
   * @param  {string} redirectUri Redirect Uri.
   * @param  {string} code        MIC Code.
   * @param  {Object} options     Options.
   * @return {Promise}            Token.
   */
  requestToken: function(clientId, redirectUri, code, options) {
    // Create a request
    var request = {
      auth: Auth.App,
      method: 'POST',
      url: MIC.AUTH_HOST + MIC.TOKEN_PATH,
      data: {
        grant_type: 'authorization_code',
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
    }).then(function(token) {
      // Extend the token
      token.client_id = clientId;
      token.redirect_uri = redirectUri;
      return token;
    });
  },

  /**
   * Refresh a token with the provided refresh token.
   *
   * @param  {string} clientId     Client Id.
   * @param  {string} redirectUri  Redirect Uri.
   * @param  {string} refreshToken Refresh Token.
   * @param  {Object} options      Options.
   * @return {Promise}             User.
   */
  refreshToken: function(clientId, redirectUri, refreshToken, options) {
    // Create a request
    var request = {
      auth: Auth.App,
      method: 'POST',
      url: MIC.AUTH_HOST + MIC.TOKEN_PATH,
      data: {
        grant_type: 'refresh_token',
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
    }).then(function(token) {
      // Extend the token
      token.client_id = clientId;
      token.redirect_uri = redirectUri;
      return token;
    });
  },

  /**
   * Links a MIC token to the provided (if any) Kinvey user.
   *
   * @param {Object} [user] The associated user.
   * @param {Options} [options] Options.
   * @param {boolean} [options.create=true] Create a new user if no user with
   *          the provided social identity exists.
   * @returns {Promise} The user.
   */
  connect: function(user, accessToken, options) {
    var error;

    // Update the user data.
    user = user || {};

    // If the user is the active user, forward to `Kinvey.User.update`.
    var activeUser = Kinvey.getActiveUser();
    user._socialIdentity = user._socialIdentity || {};
    user._socialIdentity[MIC.AUTH_PROVIDER] = {
      access_token: accessToken
    };

    if (null != activeUser) {
      // Check activeUser for property _id. Thrown error will reject promise.
      if (activeUser._id == null) {
        error = new Kinvey.Error('Active user does not have _id property defined.');
        throw error;
      }

      if (activeUser._id === user._id) {
        options._provider = MIC.AUTH_PROVIDER; // Force tokens to be updated.
        return Kinvey.User.update(user, options);
      }
    }

    // Attempt logging in with the tokens.
    user._socialIdentity = {};
    user._socialIdentity[MIC.AUTH_PROVIDER] = {
      access_token: accessToken
    };
    return Kinvey.User.login(user, null, options).then(null, function(error) {
      // If `options.create`, attempt to signup as a new user if no user with
      // the identity exists.
      if (options.create && Kinvey.Error.USER_NOT_FOUND === error.name) {
        return Kinvey.User.signup(user, options).then(function(user) {
          return MIC.connect(user, accessToken, options);
        });
      }

      return Kinvey.Defer.reject(error);
    });
  },

  /**
   * Removes a MIC token from the provided Kinvey user.
   *
   * @param {Object} [user] The user.
   * @param {Options} [options] Options.
   * @returns {Promise} The user.
   */
  disconnect: function(user, options) {
    var promise;

    // Default options
    options = options || {};

    // Update the user data.
    user._socialIdentity = user._socialIdentity || {};
    user._socialIdentity[MIC.AUTH_PROVIDER] = null;

    // If the user exists, forward to `Kinvey.User.update`. Otherwise, resolve
    // immediately.
    if(null == user._id) {
      promise = Kinvey.Defer.resolve(user);
    }

    promise = Kinvey.User.update(user, options);

    // Destroy the token
    promise.then(function() {
      return Storage.destroy(MIC.TOKEN_STORAGE_KEY);
    });

    return wrapCallbacks(promise, options);
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

  isPhoneGap: function() {
    return ('undefined' !== typeof root.cordova && 'undefined' !== typeof root.device);
  },

  getToken: function() {
    return Storage.get(MIC.TOKEN_STORAGE_KEY);
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
    AuthorizationCodeLoginPage: 'AuthorizationCodeLoginPage', // Uses Authentication Flow #1: Authentication Grant
    AuthorizationCodeAPI: 'AuthorizationCodeAPI' // Uses Authentication Flow #2: Authentication Grant without a login page
  },

  /**
   * Authorize a user with Mobile Identity Connect (MIC).
   *
   * @param  {Kinvey.User.MIC.AuthorizationGrant} authorizationGrant            Authorization grant.
   * @param  {string}                             redirectUri                   Where to redirect to after a succesful login. This should be the same value as setup
   *                                                                            in the Kinvey Console for your applicaiton.
   * @param  {Object}                             [options]                     Options.
   * @param  {string}                             [options.username]            Username for the user to be authorized. Only required with
   *                                                                            AuthorizationGrant.AuthorizationCodeAPI.
   * @param  {string}                             [options.password]            Password for the user to be authorized. Only required with
   *                                                                            AuthorizationGrant.AuthorizationCodeAPI.
   * @param  {boolean}                            [options.create=true]         Create a new user if no user exists.
   * @param  {number}                             [options.timeout=300000]      How long to wait for a successful authorization. Defaults to 5 minutes.
   * @return {Promise}                                                          Authorized user.
   */
  login: function(authorizationGrant, redirectUri, options) {
    options = options || {};
    var promise = MIC.login(authorizationGrant, redirectUri, options);
    return wrapCallbacks(promise, options);
  },

  /**
   * Authorize a user with Mobile Identity Connect (MIC) using a login page.
   *
   * @param  {string}   redirectUri               Where to redirect to after a succesful login. This should be the same value as setup
   *                                              in the Kinvey Console for your applicaiton.
   * @param  {Object}   [options]                 Options.
   * @param  {boolean}  [options.create=true]     Create a new user if no user exists.
   * @param  {number}   [options.timeout=300000]  How long to wait for a successful authorization. Defaults to 5 minutes.
   * @return {Promise}                            Authorized user.
   */
  loginWithAuthorizationCodeLoginPage: function(redirectUri, options) {
    return Kinvey.User.MIC.login(Kinvey.User.MIC.AuthorizationGrant.AuthorizationCodeLoginPage, redirectUri, options);
  },

  /**
   * Authorize a user with Mobile Identity Connect (MIC) using a provided username and password.
   *
   * @param  {string}   redirectUri             Where to redirect to after a succesful login. This should be the same value as setup
   *                                            in the Kinvey Console for your applicaiton.
   * @param  {Object}   options                 Options.
   * @param  {string}   options.username        Username for the user to be authorized.
   * @param  {string}   options.password        Password for the user to be authorized.
   * @param  {boolean}  [options.create=true]   Create a new user if no user exists.
   * @return {Promise}                          Authorized user.
   */
  loginWithAuthorizationCodeAPI: function(redirectUri, options) {
    return Kinvey.User.MIC.login(Kinvey.User.MIC.AuthorizationGrant.AuthorizationCodeAPI, redirectUri, options);
  }
};

