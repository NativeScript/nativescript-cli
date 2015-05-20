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

  AuthorizationGrant: {
    AuthorizationCodeLoginPage: 'AuthorizationCodeLoginPage',
    AuthorizationCodeAPI: 'AuthorizationCodeAPI'
  },

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
    var clientId = Kinvey.appKey;
    var activeUser = Kinvey.getActiveUser();
    var error;
    var promise;

    // Set defaults for options
    options = options || {};
    options.timeout = options.timeout || MIC.AUTH_TIMEOUT;
    options.attemptMICRefresh = false;

    if (null != activeUser) {
      // Reject with error because of active user
      error = clientError(Kinvey.Error.ALREADY_LOGGED_IN);
      return wrapCallbacks(Kinvey.Defer.reject(error), options);
    }
    else if (null == redirectUri) {
      error = new Kinvey.Error('A redirect uri must be provided to login with MIC.');
      return wrapCallbacks(Kinvey.Defer.reject(error), options);
    }
    // Step 1: Check authorization grant type
    else if (MIC.AuthorizationGrant.AuthorizationCodeLoginPage === authorizationGrant) {
      if (this.isNode()) {
        error = new Kinvey.Error(MIC.AuthorizationGrant.AuthorizationCodeLoginPage + ' grant is not supported.');
        return wrapCallbacks(Kinvey.Defer.reject(error), options);
      }

      // Step 2: Request a code
      promise = MIC.requestCodeWithPopup(clientId, redirectUri, options);
    }
    else if (MIC.AuthorizationGrant.AuthorizationCodeAPI === authorizationGrant) {
      if (this.isHTML5() || this.isAngular() || this.isBackbone() || this.isPhoneGap() || this.isTitanium()) {
        error = new Kinvey.Error(MIC.AuthorizationGrant.AuthorizationCodeAPI + ' grant is not supported.');
        return wrapCallbacks(Kinvey.Defer.reject(error), options);
      }

      if (null == options.username) {
        error = new Kinvey.Error('A username must be provided to login with MIC using the ' +
                                 MIC.AuthorizationGrant.AuthorizationCodeAPI + ' grant.');
        return wrapCallbacks(Kinvey.Defer.reject(error), options);
      }

      if (null == options.password) {
        error = new Kinvey.Error('A password must be provided to login with MIC using the ' +
                                 MIC.AuthorizationGrant.AuthorizationCodeAPI + ' grant.');
        return wrapCallbacks(Kinvey.Defer.reject(error), options);
      }

      // Step 2a: Request a temp login uri
      promise = MIC.requestUrl(clientId, redirectUri, options).then(function(url) {
        // Step 2b: Request a code
        // options.url = url + '?client_id=' + encodeURIComponent(clientId) + '&redirect_uri=' + encodeURIComponent(redirectUri) +
        //   '&response_type=code&username=' + encodeURIComponent(options.username) +
        //   '&password=' + encodeURIComponent(options.password);
        return MIC.requestCodeWithUrl(url, clientId, redirectUri, options);
      });
    }
    else {
      // Reject with error because of invalid authorization grant
      error = clientError(Kinvey.Error.MIC_ERROR, {
        debug: 'The authorization grant ' + authorizationGrant + ' is unrecognized. Please provide one of the ' +
               'following authorization grants: ' + MIC.AuthorizationGrant.AuthorizationCodeLoginPage + ', ' +
               MIC.AuthorizationGrant.AuthorizationCodeAPI + '.'
      });
      return wrapCallbacks(Kinvey.Defer.reject(error), options);
    }

    promise = promise.then(function(code) {
      // Step 3: Request a token
      return MIC.requestToken(clientId, redirectUri, code, options);
    }).then(function(token) {
      // Step 4: Connect the token with the user. Create a new user by default if one does not exist.
      options.create = false === options.create ? false : true;
      return MIC.connect(activeUser, token.access_token, options).then(function(user) {
        // Step 5: Save the token
        return Storage.save(MIC.TOKEN_STORAGE_KEY, {
          refresh_token: token.refresh_token,
          redirect_uri: redirectUri
        }).then(function() {
          return user;
        });
      });
    });

    return wrapCallbacks(promise, options);
  },

  /**
   * Refresh a MIC token.
   *
   * @param  {Object}   [options]   Options.
   * @return {Promise}              Authorized user.
   */
  refresh: function(options) {
    var error;
    var clientId = Kinvey.appKey;
    var activeUser = Kinvey.getActiveUser();
    var redirectUri;
    var promise;

    // Set defaults for options
    options = options || {};
    options.attemptMICRefresh = false;

    // Step 1: Retrieve the saved token
    promise = Storage.get(MIC.TOKEN_STORAGE_KEY).then(function(token) {
      if (null != token) {
        // Step 2: Refresh the token
        redirectUri = token.redirect_uri;
        return MIC.refreshToken(clientId, redirectUri, token.refresh_token, options);
      }

      // Throw error to reject promise for missing token.
      error = clientError(Kinvey.Error.MIC_ERROR, {
        debug: 'Unable to refresh because there is not a valid refresh token available.'
      });
      throw error;
    }).then(function(token) {
      // Step 3: Connect the token with the user
      return MIC.connect(activeUser, token.access_token, options).then(function(user) {
        // Step 4: Save the token
        return Storage.save(MIC.TOKEN_STORAGE_KEY, {
          refresh_token: token.refresh_token,
          redirect_uri: redirectUri
        }).then(function() {
          return user;
        });
      });
    }, function(err) {
      return Storage.destroy(MIC.TOKEN_STORAGE_KEY).then(function() {
        throw err;
      });
    });

    return wrapCallbacks(promise, options);
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
      url: Kinvey.MICHostName + MIC.AUTH_PATH,
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
      try {
        response = JSON.parse(response);
      } catch(e)  {}

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
  requestCodeWithPopup: function(clientId, redirectUri, options) {
    var error;
    var deferred = Kinvey.Defer.deferred();
    var url = Kinvey.MICHostName + MIC.AUTH_PATH + '?client_id=' + encodeURIComponent(clientId) +
             '&redirect_uri=' + encodeURIComponent(redirectUri) + '&response_type=code';
    var deferredResolved = false;
    var popup;
    var tiWebView;
    var tiCloseButton;
    options = options || {};
    options.url = options.url || url;

    // Load handler: Used when running Cordova or Titanium
    var loadHandler = function(event) {
      // Check if url is location of redirect uri
      var redirected = false;
      try {
        redirected = 0 === event.url.indexOf(redirectUri);
      }
      catch(e) { }

      // Continue if the popup was redirected.
      if (redirected) {
        // Extract the code
        var queryString = '?' + event.url.split('?')[1];
        var params = parseQueryString(queryString);
        deferred.resolve(params.code);
        deferredResolved = true;

        // Animation popup open prevents closing sometimes so
        // wait just a moment to close
        setTimeout(function() {
          // Close the popup
          popup.close();
        }, 200);
      }
    };

    // Close handler: Used when running Cordova or Titanium
    var closeHandler = function() {
      if (!deferredResolved) {
        // Return the response.
        error = clientError(Kinvey.Error.MIC_ERROR, {
          debug: 'The popup was closed without authorizing the user.'
        });
        deferred.reject(error);
      }

      // Remove event listeners
      if (MIC.isPhoneGap()) {
        popup.removeEventListener('loadstart', loadHandler);
        popup.removeEventListener('exit', closeHandler);
      }
      else if (MIC.isTitanium()) {
        tiWebView.removeEventListener('load', loadHandler);
        tiWebView.removeEventListener('error', loadHandler);
        popup.removeEventListener('close', closeHandler);

        if (OS_IOS) {
          tiCloseButton.removeEventListener('click', clickHandler);
        }
        else if (OS_ANDROID) {
          popup.close();
          popup.removeEventListener('androidback', closeHandler);
        }
      }
    };

    // Click handler: Used when running Titanium
    var clickHandler = function() {
      popup.close();
    };

    if (MIC.isPhoneGap()) {
      // Open the popup
      popup = root.open(options.url, '_blank', 'location=yes');

      if (null == popup) {
        // Return the response.
        error = clientError(Kinvey.Error.MIC_ERROR, {
          debug: 'The popup was blocked.'
        });
        deferred.reject(error);
      }
      else {
        popup.addEventListener('loadstart', loadHandler);
        popup.addEventListener('exit', closeHandler);
      }
    }
    else if (MIC.isTitanium()) {
      // Create a web view
      tiWebView = Titanium.UI.createWebView({
        width: '100%',
        height: '100%',
        url: options.url
      });

      // Create a popup window
      popup = Titanium.UI.createWindow({
        backgroundColor: 'white',
        barColor: '#000',
        title: 'Kinvey - MIC',
        modal: true
      });

      // Add the web view to the popup window
      popup.add(tiWebView);

      if(OS_IOS) {
        // Create a window
        var win = Titanium.UI.createWindow({
          backgroundColor: 'white',
          barColor: '#e3e3e3',
          title: 'Kinvey - MIC'
        });

        // Add the web view to the window
        win.add(tiWebView);

        // Create close button
        tiCloseButton = Titanium.UI.createButton({
          title: 'Close',
          style: Titanium.UI.iPhone.SystemButtonStyle.DONE
        });
        win.setLeftNavButton(tiCloseButton);

        // Listen for click event on close button
        tiCloseButton.addEventListener('click', clickHandler);

        // Create a navigation window
        popup = Titanium.UI.iOS.createNavigationWindow({
          backgroundColor: 'white',
          window: win,
          modal: true
        });
      }
      else if(OS_ANDROID) {
        popup.addEventListener('androidback', closeHandler);
      }

      // Open the web view UI
      popup.open();

      // Add event listener
      tiWebView.addEventListener('load', loadHandler);
      tiWebView.addEventListener('error', loadHandler);
      popup.addEventListener('close', closeHandler);
    }
    else {
      // Open the popup
      popup = root.open(options.url, '_blank', 'toolbar=no,location=no');

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
            debug: 'The popup was closed without authorizing the user.'
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
            redirected = 0 === popup.location.href.indexOf(redirectUri);
          }
          catch(e) { }

          // Continue if the popup was redirected.
          if (redirected) {
            root.clearTimeout(timer);

            // Extract the code
            var params = parseQueryString(popup.location.search);
            deferred.resolve(params.code);
            deferredResolved = true;

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
   * Request a code by sending a POST request to the url.
   *
   * @param  {String} url         Url.
   * @param  {string} clientId    Client Id.
   * @param  {string} redirectUri Redirect Uri.
   * @param  {Object} options     Options.
   * @return {Promise}            Code.
   */
  requestCodeWithUrl: function(url, clientId, redirectUri, options) {
    // Create a request
    var request = {
      method: 'POST',
      url: url,
      data: {
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        username: options.username,
        password: options.password
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      }
    };

    // Send request
    return Kinvey.Persistence.Net.request(
      request.method,
      request.url,
      MIC.encodeFormData(request.data),
      request.headers,
      options
    ).then(function(response) {
      try {
        response = JSON.parse(response);
      } catch(e)  {}

      return response.code;
    }, function(error) {
      error = clientError(Kinvey.Error.MIC_ERROR, {
        debug: 'Unable to authorize user with username ' + options.username + ' and ' +
               'password ' + options.password + '.'
      });
      throw error;
    });
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
      url: Kinvey.MICHostName + MIC.TOKEN_PATH,
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
      try {
        token = JSON.parse(token);
      } catch(e)  {}

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
      url: Kinvey.MICHostName + MIC.TOKEN_PATH,
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
      try {
        token = JSON.parse(token);
      } catch(e)  {}

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
    // Default user.
    user = user || {};

    // Set active user to null
    Kinvey.setActiveUser(null);

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
  disconnect: function() {
    // Destroy the token
    return Storage.destroy(MIC.TOKEN_STORAGE_KEY);
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

  /**
   * Return true or false if using HTML5.
   *
   * @return {Boolean} HTML5
   */
  isHTML5: function() {
    return !(this.isTitanium() || this.isNode());
  },

  /**
   * Return true or false if using Angular framework.
   *
   * @return {Boolean} Angular Framework
   */
  isAngular: function() {
    return ('undefined' !== typeof root.angular);
  },

  /**
   * Return true or false if using Backbone framework.
   *
   * @return {Boolean} Backbone Framework
   */
  isBackbone: function() {
    return ('undefined' !== typeof root.Backbone);
  },

  /**
   * Return true or false if using Cordova/PhoneGap framework.
   *
   * @return {Boolean} Cordova/PhoneGap Framework
   */
  isPhoneGap: function() {
    return ('undefined' !== typeof root.cordova && 'undefined' !== typeof root.device);
  },

  /**
   * Return true or false if using Titanium framework.
   *
   * @return {Boolean} Titanium Framework
   */
  isTitanium: function() {
    return ('undefined' !== typeof Titanium);
  },

  /**
   * Return true or false if using NodeJS.
   *
   * @return {Boolean} NodeJS
   */
  isNode: function() {
    return (typeof process !== 'undefined' && typeof require !== 'undefined');
  }
};

/**
 * @memberof! <global>
 * @namespace Kinvey.User.MIC
 */
Kinvey.User = Kinvey.User || {};
Kinvey.User.MIC = /** @lends Kinvey.User.MIC */ {

  /**
   * Authorize a user with Mobile Identity Connect (MIC) using a login page.
   *
   * @param  {String}   redirectUri               Where to redirect to after a succesful login. This should be the same value as setup
   *                                              in the Kinvey Console for your applicaiton.
   * @param  {Object}   [options]                 Options.
   * @param  {Boolean}  [options.create=true]     Create a new user if no user exists.
   * @param  {Number}   [options.timeout=300000]  How long to wait for a successful authorization. Defaults to 5 minutes.
   * @return {Promise}                            Authorized user.
   */
  loginWithAuthorizationCodeLoginPage: function(redirectUri, options) {
    return MIC.login(MIC.AuthorizationGrant.AuthorizationCodeLoginPage, redirectUri, options);
  },

  /**
   * Authorize a user with Mobile Identity Connect (MIC) using a provided username and password.
   *
   * @param  {String}   username                Username for the user to be authorized.
   * @param  {String}   password                Password for the user to be authorized.
   * @param  {String}   redirectUri             Where to redirect to after a succesful login. This should be the same value as setup
   *                                            in the Kinvey Console for your applicaiton.
   * @param  {Object}   [options]               Options.
   * @param  {Boolean}  [options.create=true]   Create a new user if no user exists.
   * @return {Promise}                          Authorized user.
   */
  loginWithAuthorizationCodeAPI: function(username, password, redirectUri, options) {
    options = options || {};
    options.username = username;
    options.password = password;
    return MIC.login(MIC.AuthorizationGrant.AuthorizationCodeAPI, redirectUri, options);
  },

  /**
   * Logout the active user.
   *
   * @param {Options} [options] Options.
   * @param {boolean} [options.force=false] Reset the active user even if an
   *          `InvalidCredentials` error is returned.
   * @param {boolean} [options.silent=false] Succeed when there is no active
   *          user.
   * @returns {Promise} The previous active user.
   */
  logout: function(options) {
    return Kinvey.User.logout(options);
  }
};

