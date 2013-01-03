(function() {

  /**
   * Kinvey OAuth namespace.
   * 
   * @namespace
   */
  Kinvey.OAuth = {
    // BL API uses the user collection.
    api: Kinvey.Store.AppData.USER_API,

    // Default options.
    options: {
      timeout: 10000,// Timeout in ms.

      success: function() { },
      error: function() { }
    },

    /**
     * Creates a new user given its OAuth access tokens. OAuth1.0a only.
     * 
     * @param {string} provider OAuth provider.
     * @param {Object} attr User attributes.
     * @param {Object} [options]
     * @param {function(response, info)} options.success Success callback.
     * @param {function(error, info)} options.error Failure callback.
     */
    create: function(provider, attr, options) {
      this._send('POST', this._getUrl(provider, 'create'), JSON.stringify(attr), options);
    },
    
    /**
     * Logs in an existing user given its OAuth access tokens. OAuth1.0a only.
     * 
     * @param {string} provider OAuth provider.
     * @param {Object} attr User attributes.
     * @param {Object} [options]
     * @param {function(response, info)} options.success Success callback.
     * @param {function(error, info)} options.error Failure callback.
     */
    login: function(provider, attr, options) {
      this._send('POST', this._getUrl(provider, 'login'), JSON.stringify(attr), options);
    },

    /**
     * Processes tokens returned by OAuth provider.
     * 
     * @param {string} provider OAuth provider.
     * @param {Object} response Response attributes.
     * @param {Object} [options]
     * @param {string} options.oauth_token_secret OAuth1.0a token secret.
     * @param {function(tokens)} options.success Success callback.
     * @param {function(error)} options.error Failure callback.
     */
    processToken: function(provider, response, options) {
      options || (options = {});

      // Handle both OAuth1.0a and OAuth 2.0 protocols.
      if(response.access_token && response.expires_in) {// OAuth 2.0.
        options.success && options.success({
          access_token: response.access_token,
          expires_in: response.expires_in
        });
      }
      else if(response.oauth_token && response.oauth_verifier && options.oauth_token_secret) {
        // OAuth 1.0a requires a request to verify the tokens.
        this._send('POST', this._getUrl(provider, 'verifyToken'), JSON.stringify({
          oauth_token: response.oauth_token,
          oauth_token_secret: options.oauth_token_secret,
          oauth_verifier: response.oauth_verifier
        }), options);
      }
      else {// Error, most likely the user did not grant authorization.
        options.error && options.error({
          error: Kinvey.Error.RESPONSE_PROBLEM,
          description: 'User did not grant authorization to the OAuth provider.',
          debug: response.denied || response.error || response.oauth_problem
        });
      }
    },

    /**
     * Requests an OAuth token.
     * 
     * @param {string} provider OAuth provider.
     * @param {Object} [options]
     * @param {string} options.redirect Redirect URL.
     * @param {function(tokens, info)} options.success Success callback.
     * @param {function(error, info)} options.error Failure callback.
     * @throws {Error} On invalid provider.
     */
    requestToken: function(provider, options) {
      options || (options = {});
      this._send('POST', this._getUrl(provider, 'requestToken'), JSON.stringify({
        redirect: options.redirect || document.location.toString()
      }), options);
    },

    /**
     * UI helper function to perform the entire OAuth flow for a provider.
     * 
     * @param {string} provider OAuth provider.
     * @param {Object} [options]
     * @param {function(tokens)} options.success Success callback.
     * @param {function(error)} options.error Failure callback.
     */
    signIn: function(provider, options) {
      options || (options = {});
      options.popup || (options.popup = 'menubar=no,toolbar=no,location=no,personalbar=no');

      // Open pop-up here, as otherwise chances are they are blocked.
      var popup = window.open('about:blank', 'KinveyOAuth', options.popup);

      // Step 1: obtain a request token.
      this.requestToken(provider, merge(options, {
        success: bind(this, function(tokens) {
          // Step 2: redirect pop-up to OAuth provider.
          popup.location.href = tokens.url;

          // Wait for pop-up to return to our domain.
          var interval = 500;// Half a second.
          var elapsed = 0;// Time elapsed.
          var timer = window.setInterval(bind(this, function() {
            if(null == popup.location) {// Pop-up closed unexpectedly.
              window.clearTimeout(timer);// Stop waiting.
              options.error && options.error({
                error: Kinvey.Error.RESPONSE_PROBLEM,
                description: 'The user closed the OAuth pop-up.',
                debug: ''
              });
            }
            else if(elapsed > options.timeout) {// Timeout.
              window.clearTimeout(timer);// Stop waiting.
              popup.close();// Close pop-up.
              options.error && options.error({
                error: Kinvey.Error.RESPONSE_PROBLEM,
                description: 'The OAuth pop-up timed out.',
                debug: 'The user waited too long to grant authorization to the OAuth provider.'
              });
            }
            else if(popup.location.host) {// Returned to our domain.
              window.clearTimeout(timer);// Stop waiting.

              // Save location.
              var url = popup.location.search.substring(1) + '&' + popup.location.hash.substring(1);
              popup.close();// Close pop-up.

              // Step 3: process token.
              this.processToken(provider, this._tokenize(url), merge(options, {
                oauth_token_secret: tokens.oauth_token_secret// OAuth1.0a.
              }));
            }

            // Update elapsed time.
            elapsed += interval;
          }), interval);
        }),
        error: function(response, info) {
          popup.close();// Close pop-up.
          options.error && options.error(response, info);
        }
      }));
    },

    /**
     * Constructs URL.
     * 
     * @private
     * @param {string} provider OAuth provider.
     * @param {string} step OAuth step.
     * @return {string} URL.
     */
    _getUrl: function(provider, step) {
      return '/' + this.api + '/' + encodeURIComponent(Kinvey.appKey) + '/' +
       '?provider=' + encodeURIComponent(provider) +
       '&step=' + encodeURIComponent(step) +
       '&_=' + new Date().getTime();// Android < 4.0 cache bust.
    },

    /**
     * Tokenizes string.
     *
     * @private
     * @param {string} string Token string.
     * @example foo=bar&baz=qux => { foo: 'bar', baz: 'qux' }
     */
    _tokenize: function(string) {
      var tokens = {};
      string.split('&').forEach(function(pair) {
        var segments = pair.split('=', 2).map(decodeURIComponent);
        segments[0] && (tokens[segments[0]] = segments[1]);
      });
      return tokens;
    }
  };

  // Apply mixin.
  Xhr.call(Kinvey.OAuth);

}());