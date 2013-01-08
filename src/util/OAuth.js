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
     * Processes request token, and obtains access token for OAuth provider.
     * 
     * @param {string} provider OAuth provider.
     * @param {Object} response Response attributes.
     * @param {Object} [options]
     * @param {string} options.oauth_token_secret OAuth1.0a token secret.
     * @param {function(tokens)} options.success Success callback.
     * @param {function(error)} options.error Failure callback.
     */
    accessToken: function(provider, response, options) {
      response || (response = {});
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
        redirect: options.redirect || '',
        state: options.state || null
      }), options);
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