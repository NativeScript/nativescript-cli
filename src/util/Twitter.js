(function() {

  Kinvey.OAuth = {};

  // @link https://dev.twitter.com/docs/auth/implementing-sign-twitter
  Kinvey.OAuth.Twitter = {
    // BL API uses the user collection.
    api: Kinvey.Store.AppData.USER_API,

    // Default options.
    options: {
      timeout: 10000,// Timeout in ms.

      success: function() { },
      error: function() { }
    },

    /**
     * Obtains an access token from Twitter.
     * 
     * @param {Object} tokens
     * @param {string} tokens.oauth_token Request token.
     * @param {string} tokens.oauth_token_secret Request token secret.
     * @param {string} tokens.oauth_verifier OAuth verifier.
     * @param {Object} options
     * @param {function(tokens, info)} options.success Success callback.
     * @param {function(error, info)} options.error Failure callback.
     * @throws {Error} On incomplete tokens.
     */
    accessToken: function(tokens, options) {
      tokens || (tokens = {});
      if(!(tokens.oauth_token && tokens.oauth_token_secret && tokens.oauth_verifier)) {
        throw new Error('Tokens must contain the oauth_token, oauth_token_secret, and oauth_verifier.');
      }

      // Fire request.
      this._send('POST', this._url(), JSON.stringify(tokens), options);
    },

    /**
     * Creates and links a user given Twitter access tokens.
     * 
     * @param {Object} attr User attributes.
     * @param {Object} options
     * @param {function(response, info)} options.success Success callback.
     * @param {function(error, info)} options.error Failure callback.
     * @throws {Error} On incomplete Twitter tokens.
     */
    create: function(attr, options) {
      var identity = (attr && attr._socialIdentity && attr._socialIdentity.twitter) || {};
      if(!(identity.access_token && identity.access_token_secret)) {
        throw new Error('Attributes must contain the Twitter access token and access token secret.');
      }

      // Fire request.
      this._send('POST', this._url(), JSON.stringify(attr), options);
    },

    /**
     * Logs in with Twitter access tokens.
     * 
     * @param {Object} attr User attributes.
     * @param {Object} options
     * @param {function(response, info)} options.success Success callback.
     * @param {function(error, info)} options.error Failure callback.
     * @throws {Error} On incomplete Twitter tokens.
     */
    login: function(attr, options) {
      var identity = (attr && attr._socialIdentity && attr._socialIdentity.twitter) || {};
      if(!(identity.access_token && identity.access_token_secret)) {
        throw new Error('Attributes must contain the Twitter access token and access token secret.');
      }

      // Fire request.
      this._send('POST', this._url() + '&login=true', JSON.stringify(attr), options);
    },

    /**
     * Obtains a request token from Twitter.
     * 
     * @param {Object} options
     * @param {function(tokens, info)} options.success Success callback.
     * @param {function(error, info)} options.error Failure callback.
     */
    requestToken: function(options) {
      this._send('POST', this._url(), null, options);
    },

    /**
     * Returns endpoint.
     * 
     * @private
     * @return {string} Endpoint.
     */
    _url: function() {
      return '/' + this.api + '/' + encodeURIComponent(Kinvey.appKey) + '/?provider=twitter';
    }
  };

  // Apply mixin.
  Xhr.call(Kinvey.OAuth.Twitter);

}());