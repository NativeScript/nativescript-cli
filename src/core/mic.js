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

var KINVEY_AUTH_URL = 'https://auth.kinvey.com';
var AUTH_PATH = '/oauth/auth';
var ACCESS_TOKEN_PATH = '/oauth/token';
var KINVEY_AUTH_PROVIDER = 'kinveyAuth';
var MIC_ACCESS_TOKEN_KEY = 'micAccessToken';

var loginWithAuthProvider = function(authProvider, token) {
  return Kinvey.User.loginWithProvider(authProvider, token);
};

var createMICToken = function(grantType, clientId, redirectUri, code, options) {
  // Create a request
  var request = {
    auth: Auth.Basic,
    method: 'POST',
    url: KINVEY_AUTH_URL + ACCESS_TOKEN_PATH,
    data: {
      grant_type: grantType,
      code: code,
      redirect_uri: redirectUri,
      client_id: clientId
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

  // Get auth credentials
  var promise = request.auth().then(function(auth) {
    if (null !== auth) {
      // Format credentials.
      var credentials = auth.credentials;
      if (null != auth.username) {
        credentials = Kinvey.Persistence.Net.base64(auth.username + ':' + auth.password);
      }

      // Append header.
      request.headers.Authorization = auth.scheme + ' ' + credentials;
    }
  });

  return promise.then(function() {
    // Send request
    return Kinvey.Persistence.Net.request(
      request.method,
      request.url,
      encodeFormData(request.data),
      request.headers,
      options
    );
  }).then(function(token) {
    // Save the token and return the token
    return Storage.save(MIC_ACCESS_TOKEN_KEY, token).then(function() {
      return token;
    });
  });
};

var loginWithMICLoginPage = function(clientId, redirectUri, options) {
  var promise = Storage.get(MIC_ACCESS_TOKEN_KEY);

  return promise.then(function(token) {
    if (null == token) {
      var url = KINVEY_AUTH_URL + AUTH_PATH + '?client_id=' + clientId + '&redirect_uri=' + redirectUri +
                '&response_type=code';
      var win = window.open(url);
      var codeUrl;

      // Poll the window location query string to see
      // if we have received a OAuth code
      var pollTimer = window.setInterval(function() {
        var code;

        try {
          // Get code query string param
          codeUrl = win.location.search || codeUrl;
          code = getParameterByName(codeUrl, 'code');

          // Close the window we opened if the code is not
          // null or undefined
          if (null != code) {
            win.close();
          }
        } catch (e) {}

        // If the window has been closed
        if (win.closed !== false) {
          if (null != code) {
            // Create a MIC token
            createMICToken('authorization_code', clientId, redirectUri, code, options).then(function(token) {
              // Login using the token
              return loginWithAuthProvider(KINVEY_AUTH_PROVIDER, token.access_token);
            }).then(function(user) {
              return Kinvey.Defer.resolve(user);
            }).catch(function(err) {
              return Kinvey.Defer.reject(err);
            });
          }
          else {
            // Reject with error
            return Kinvey.Defer.reject(new Kinvey.Error('Unable to authenticate.'));
          }

          // Clear the polling timer
          window.clearInterval(pollTimer);
        }
      }, 200);
    }
    else {
      // Check if token is expired

      // Login using the saved token
      loginWithAuthProvider(KINVEY_AUTH_PROVIDER, token.access_token).then(function(user) {
        return Kinvey.Defer.resolve(user);
      }).catch(function(err) {
        return Kinvey.Defer.reject(err);
      });
    }
  });
};

var loginWithMICAPI = function() {

};

/**
 * @memberof! <global>
 * @namespace Kinvey.User.MIC
 */
Kinvey.User = Kinvey.User || {};
Kinvey.User.MIC = /** @lends Kinvey.User.MIC */ {

  AuthorizationGrant: {
    AuthorizationCode: {
      LoginPage: 'LoginPage', // Uses Authentication Flow #1: Authentication Grant
      API: 'API' // Uses Authentication Flow #2: Authentication Grant without a login page
    }
  },

  login: function(authorizationGrant, redirectUri, options) {
    if (Kinvey.User.MIC.AuthorizationGrant.AuthorizationCode.LoginPage === authorizationGrant) {
      return loginWithMICLoginPage(Kinvey.appKey, redirectUri, options);
    }
    else if (Kinvey.User.MIC.AuthorizationGrant.AuthorizationCode.API === authorizationGrant) {
      return loginWithMICAPI(Kinvey.appKey, redirectUri, options);
    }
  }
};

