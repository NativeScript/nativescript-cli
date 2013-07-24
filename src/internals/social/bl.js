/**
 * Copyright 2013 Kinvey, Inc.
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

/* jshint maxlen: 200 */

// Social: Business Logic script.
// ------------------------------

// This file should not be embedded in any of the libraries. This file just
// holds the contents of the BL-script for apps utilizing social login through
// browser-based environments.

// OAuth providers.
var urlConfig = {
  // OAuth1.0a.
  requestToken: {
    linkedIn : 'https://api.linkedin.com/uas/oauth/requestToken',
    twitter  : 'https://api.twitter.com/oauth/request_token'
  },
  accessToken: {
    linkedIn : 'https://api.linkedin.com/uas/oauth/accessToken',
    twitter  : 'https://api.twitter.com/oauth/access_token'
  },

   // OAuth1.0a and 2.0.
  authenticate: {
    facebook : 'https://www.facebook.com/dialog/oauth?',
    google   : 'https://accounts.google.com/o/oauth2/auth?scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile',
    linkedIn : 'https://api.linkedin.com/uas/oauth/authenticate',
    twitter  : 'https://api.twitter.com/oauth/authenticate'
  }
};

/**
 * Tokenizes string.
 *
 * @param {string} string Token string.
 * @example foo=bar&baz=qux => { foo: 'bar', baz: 'qux' }
 */
var tokenize = function(string) {
  var tokens = {};
  string.split('&').forEach(function(pair) {
    var segments = pair.split('=', 2).map(decodeURIComponent);
    if(segments[0]) {// Key must be non-empty.
      tokens[segments[0]] = segments[1];
    }
  });
  return tokens;
};

/**
 * Logs in or creates user with provided OAuth1.0a credentials.
 *
 * @param {Object} doc OAuth provider document.
 * @param {Object} request Kinvey request object.
 * @param {Object} response Kinvey response object.
 * @param {Object} modules Available JavaScript libraries.
 */
var login = function(doc, request, response, modules) {
  // Validate request body.
  var provider = doc._id;
  if(!(request.body._socialIdentity && request.body._socialIdentity[provider] && request.body._socialIdentity[provider].access_token && request.body._socialIdentity[provider].access_token_secret)) {
    response.body = {
      error       : 'IncompleteRequestBody',
      description : 'The request body is either missing or incomplete.',
      debug       : 'Missing required attributes: _socialIdentity.<provider>.[access_token, access_token_secret]'
    };
    return response.complete(400);
  }

  // Add consumer key and secret to request body.
  request.body._socialIdentity[provider].consumer_key    = doc.consumer_key;
  request.body._socialIdentity[provider].consumer_secret = doc.consumer_secret;

  // Forward request to the login endpoint.
  modules.request.post({
    uri: 'https://' + encodeURIComponent(request.headers.host) + '/user/' + encodeURIComponent(request.username) + '/login',
    headers: {
      Authorization          : request.headers.authorization,// Application credentials.
      'Content-Type'         : 'application/json',
      'X-Kinvey-API-Version' : request.headers['x-kinvey-api-version']
    },
    json: request.body
  }, function(err, res) {
    if(err) {// Request failed.
      modules.logger.error(err);
      response.body = {
        error       : 'BLInternalError',
        description : 'The Business Logic script did not complete. See debug message for details.',
        debug       : err.code
      };
      response.complete(550);
    }
    else {// Forward response.
      response.body = res.body;
      response.complete(res.status);
    }
  });
};

/**
 * Obtains an OAuth1.0a request token.
 *
 * @param {Object} doc OAuth provider document.
 * @param {Object} request Kinvey request object.
 * @param {Object} response Kinvey response object.
 * @param {Object} modules Available JavaScript libraries.
 */
var requestOAuth1Token = function(doc, request, response, modules) {
  // Validate request body.
  var provider = doc._id;
  if(!request.body.redirect) {
    response.body = {
      error       : 'IncompleteRequestBody',
      description : 'The request body is either missing or incomplete.',
      debug       : 'Missing required attributes: redirect'
    };
    return response.complete(400);
  }

  // Fire request.
  modules.request.post({
    uri: urlConfig.requestToken[provider],
    oauth: {
      callback: request.body.redirect,
      consumer_key: doc.consumer_key,
      consumer_secret: doc.consumer_secret
    }
  }, function(err, res) {
    if(err) {// Request failed.
      modules.logger.error(err);
      response.body = {
        error       : 'BLInternalError',
        description : 'The Business Logic script did not complete. See debug message for details.',
        debug       : err.code
      };
      response.complete(550);
    }
    else if(200 !== res.status) {// Tokens are invalid.
      response.body = {
        error       : 'InvalidCredentials',
        description : 'Invalid credentials. Please retry your request with correct credentials.',
        debug       : res.body
      };
      response.complete(401);
    }
    else {// Tokens are valid.
      var tokens = tokenize(res.body);
      response.body = {
        url: urlConfig.authenticate[provider] + '?oauth_token=' + encodeURIComponent(tokens.oauth_token),
        oauth_token: tokens.oauth_token,
        oauth_token_secret: tokens.oauth_token_secret
      };
      response.complete(200);
    }
  });
};

/**
 * Obtains an OAuth2 access token.
 *
 * @param {Object} doc OAuth provider document.
 * @param {Object} request Kinvey request object.
 * @param {Object} response Kinvey response object.
 * @param {Object} modules Available JavaScript libraries.
 */
var requestOAuth2Token = function(doc, request, response, modules) {
  // Validate request body.
  var provider = doc._id;
  if(!request.body.redirect) {
    response.body = {
      error       : 'IncompleteRequestBody',
      description : 'The request body is either missing or incomplete.',
      debug       : 'Missing required attributes: redirect'
    };
    return response.complete(400);
  }

  // Build URL.
  var url = urlConfig.authenticate[provider] +
    '&client_id=' + encodeURIComponent(doc.consumer_key) +
    '&response_type=token' +
    '&redirect_uri=' + encodeURIComponent(request.body.redirect);
  if(request.body.state) {// Append state if specified.
    url += '&state=' + encodeURIComponent(request.body.state);
  }

  // No network request needed, return instantly.
  response.body = { url: url };
  response.complete(200);
};

/**
 * Verifies the OAuth1.0a request token.
 *
 * @param {Object} doc OAuth provider document.
 * @param {Object} request Kinvey request object.
 * @param {Object} response Kinvey response object.
 * @param {Object} modules Available JavaScript libraries.
 */
var verifyToken = function(doc, request, response, modules) {
  // Validate request body.
  var provider = doc._id;
  if(!(request.body.oauth_token && request.body.oauth_token_secret && request.body.oauth_verifier)) {
    response.body = {
      error       : 'IncompleteRequestBody',
      description : 'The request body is either missing or incomplete.',
      debug       : 'Missing required attributes: oauth_token, oauth_token_secret, and/or oauth_verifier'
    };
    return response.complete(400);
  }

  // Verify request.
  modules.request.post({
    uri: urlConfig.accessToken[provider],
    oauth: {
      consumer_key: doc.consumer_key,
      consumer_secret: doc.consumer_secret,
      token: request.body.oauth_token,
      token_secret: request.body.oauth_token_secret,
      verifier: request.body.oauth_verifier
    }
  }, function(err, res) {
    if(err) {// Request failed.
      modules.logger.error(err);
      response.body = {
        error       : 'BLInternalError',
        description : 'The Business Logic script did not complete. See debug message for details.',
        debug       : err.code
      };
      response.complete(550);
    }
    else if(200 !== res.status) {// Tokens are invalid.
      response.body = {
        error       : 'InvalidCredentials',
        description : 'Invalid credentials. Please retry your request with correct credentials.',
        debug       : res.body
      };
      response.complete(401);
    }
    else {// Tokens are valid.
      var tokens = tokenize(res.body);
      response.body = {
        access_token        : tokens.oauth_token,
        access_token_secret : tokens.oauth_token_secret
      };
      response.complete(200);
    }
  });
};

/**
 * onPreSave hook. Routes OAuth related requests.
 *
 * @param {Object} request Kinvey request object.
 * @param {Object} response Kinvey response object.
 * @param {Object} modules Available JavaScript libraries.
 */
var onPreSave = function(request, response, modules) {
  var provider = request.params.provider;
  if(null != provider) {
    modules.collectionAccess.collection('oauth').findOne({ _id: provider }, function(err, doc) {
      if(err) {// Request failed.
        modules.logger.error(err);
        response.body = {
          error       : 'BLInternalError',
          description : 'The Business Logic script did not complete. See debug message for details.',
          debug       : err.code
        };
        response.complete(550);
      }
      else if(null == doc) {// Provider not supported.
        response.body = {
          error       : 'FeatureUnavailable',
          description : 'This OAuth provider is not supported by this app.',
          debug       : ''
        };
        response.complete(400);
      }
      else {// Provider found.
        // Route step.
        var step = request.params.step || 'login';
        var oauth1 = -1 !== ['linkedIn', 'twitter'].indexOf(provider);
        var oauth2 = -1 !== ['facebook', 'google'].indexOf(provider);

        // OAuth1.0a providers support login through this proxy.
        if(oauth1 && -1 !== ['login'].indexOf(step)) {
          login(doc, request, response, modules);
        }

        // Request a token.
        else if(oauth1 && 'requestToken' === step) {
          requestOAuth1Token(doc, request, response, modules);
        }
        else if(oauth2 && 'requestToken' === step) {// OAuth2.
          requestOAuth2Token(doc, request, response, modules);
        }

        // OAuth1.0a providers require the request token to be verified.
        else if(oauth1 && 'verifyToken' === step) {
          verifyToken(doc, request, response, modules);
        }

        // Provider/step combination not supported.
        else {
          response.body = {
            error       : 'BadRequest',
            description : 'Unable to understand request.',
            debug       : 'The provided step is not valid in combination with this provider.'
          };
          response.complete(400);
        }
      }
    });
  }
  else {
    // Patch regular save requests by embedding the `consumer_key` and
    // `consumer_secret` for OAuth1.0a providers.
    if(request.body && request.body._socialIdentity) {
      var oAuth1Provider = null;
      var socialIdentity = request.body._socialIdentity;
      if(socialIdentity.twitter && socialIdentity.twitter.access_token) {
        oAuth1Provider = 'twitter';
      }
      else if(socialIdentity.linkedIn && socialIdentity.linkedIn.access_token) {
        oAuth1Provider = 'linkedIn';
      }

      // Patch.
      if(null !== oAuth1Provider) {
        return modules.collectionAccess.collection('oauth').findOne({ _id: oAuth1Provider }, function(err, doc) {
          if(err) {// Request failed.
            modules.logger.error(err);
            response.body = {
              error       : 'BLInternalError',
              description : 'The Business Logic script did not complete. See debug message for details.',
              debug       : err.code
            };
            response.complete(550);
          }
          else if(null == doc) {// Provider not supported.
            response.body = {
              error       : 'FeatureUnavailable',
              description : 'This OAuth provider is not supported by this app.',
              debug       : ''
            };
            response.complete(400);
          }
          else {// Provider found.
            request.body._socialIdentity[oAuth1Provider].consumer_key    = doc.consumer_key;
            request.body._socialIdentity[oAuth1Provider].consumer_secret = doc.consumer_secret;
            response['continue']();
          }
        });
      }
    }

    // Regular request, continue.
    response['continue']();
  }
};