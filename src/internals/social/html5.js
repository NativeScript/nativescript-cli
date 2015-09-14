/**
 * Copyright 2014 Kinvey, Inc.
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

// `Social` adapter for performing the OAuth flow.
var SocialAdapter = {
  /**
   * @augments {Social.facebook}
   */
  facebook: function(options) {
    return SocialAdapter.oAuth2('facebook', options);
  },

  /**
   * @augments {Social.google}
   */
  google: function(options) {
    return SocialAdapter.oAuth2('google', options);
  },

  /**
   * @augments {Social.linkedIn}
   */
  linkedIn: function(options) {
    return SocialAdapter.oAuth1('linkedIn', options);
  },

  /**
   * @augments {Social.twitter}
   */
  twitter: function(options) {
    return SocialAdapter.oAuth1('twitter', options);
  },

  /**
   * Performs the oAuth1.0a authorization flow.
   *
   * @param {string} provider The provider.
   * @param {Options} [options] Options.
   * @returns {Promise} The oAuth1.0a tokens.
   */
  oAuth1: function(provider, options) {
    // Debug.
    logger.debug('Obtaining OAuth1.0a credentials for a provider.', arguments);

    // Step 1: obtain a request token.
    return SocialAdapter.requestToken(provider, options).then(function(tokens) {
      // Check for errors.
      if(tokens.error || tokens.denied) {
        var error = clientError(Kinvey.Error.SOCIAL_ERROR, { debug: tokens });
        return Kinvey.Defer.reject(error);
      }

      // Return the tokens.
      return {
        oauth_token        : tokens.oauth_token,
        oauth_token_secret : tokens.oauth_token_secret,
        oauth_verifier     : tokens.oauth_verifier
      };
    }).then(function(tokens) {
      // Step 2: convert the request token into an access token.
      return Kinvey.Persistence.Net.create({
        namespace : USERS,
        data      : tokens,
        flags     : { provider: provider, step: 'verifyToken' },
        auth      : Auth.App
      }, options);
    }).then(function(tokens) {
      // Step 3: utilize the access token.
      options._provider = provider;// Hack `Kinvey.User.login`.
      return tokens;
    });
  },

  /**
   * Performs the oAuth2.0 authorization flow.
   *
   * @param {string} provider The provider.
   * @param {Options} [options] Options.
   * @returns {Promise} The oAuth2.0 tokens.
   */
  oAuth2: function(provider, options) {
    // Debug.
    logger.debug('Obtaining OAuth2.0 credentials for a provider.', arguments);

    // Generate a unique token to protect against CSRF.
    options.state = Math.random().toString(36).substr(2);

    // Step 1: obtain an access token.
    return SocialAdapter.requestToken(provider, options).then(function(tokens) {
      var error;

      // The state tokens should match.
      if(tokens.state !== options.state) {
        error = clientError(Kinvey.Error.SOCIAL_ERROR, {
          debug: 'The state parameters did not match (CSRF attack?).'
        });
        return Kinvey.Defer.reject(error);
      }

      // Check for errors.
      if(tokens.error) {
        error = clientError(Kinvey.Error.SOCIAL_ERROR, { debug: tokens });
        return Kinvey.Defer.reject(error);
      }

      // Return the tokens.
      return { access_token: tokens.access_token, expires_in: tokens.expires_in };
    });
  },

  /**
   * Obtains a request token.
   *
   * @param {string} provider The provider.
   * @param {Options} options Options.
   * @returns {Promise} The response and tokens.
   */
  requestToken: function(provider, options) {
    // Popup blockers only allow opening a dialog at this moment. The popup
    // location will be updated later.
    var blank = 'about:blank';
    var popup = root.open(blank, 'KinveyOAuth2');

    // Open the login dialog. This step consists of getting the dialog url,
    // after which the dialog is opened.
    var redirect = options.redirect || root.location.toString();
    var redirectParts = redirect.split('#');
    if (redirectParts.length > 1) {
      redirect = redirectParts[0];
    }

    return Kinvey.Persistence.Net.create({
      namespace : USERS,
      data      : { redirect: redirect, state: options.state },
      flags     : { provider: provider, step: 'requestToken' },
      auth      : Auth.App
    }, options).then(function(response) {
      // Obtain the tokens from the login dialog.
      var deferred = Kinvey.Defer.deferred();

      // Set the popup location.
      if(null != popup) {
        popup.location = response.url;
      }

      // Popup management.
      var elapsed  = 0;// Time elapsed since opening the popup.
      var interval = 100;// ms.
      var timer    = root.setInterval(function() {
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
          if(host) {
            root.clearTimeout(timer);// Stop listening.

            // Extract tokens from the url.
            var location    = popup.location;
            var tokenString = location.search.substring(1) + '&' + location.hash.substring(1);
            var tokens      = SocialAdapter.tokenize(tokenString);
            if(null != response.oauth_token_secret) {// OAuth 1.0a.
              tokens.oauth_token_secret = response.oauth_token_secret;
            }
            deferred.resolve(tokens);

            // Close the popup.
            popup.close();
          }
        }

        // Update elapsed time.
        elapsed += interval;
      }, interval);

      // Return the promise.
      return deferred.promise;
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
  }
};

// Use the browser adapter.
Social.use(SocialAdapter);
