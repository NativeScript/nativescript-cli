(function() {

  /**
   * Supported providers:
   * - Facebook (https://developers.facebook.com/docs/howtos/login/client-side-without-js-sdk/)
   * - Google (https://developers.google.com/accounts/docs/OAuth2Login)
   * - LinkedIn (http://developer.linkedin.com/documents/authentication)
   * - Twitter (https://dev.twitter.com/docs/auth/implementing-sign-twitter)
   */

  /**
   * Business Logic for user collection: "Pre Process" -> "Pre Save".
   * 
   * An "oauth" collection must also exist (private permissions), holding:
   * {
   *   _id: "<provider>",
   *   consumer_key: "<consumer_key>",
   *   consumer_secret: "<consumer_secret>",
   *   _acl: { creator: "<kinvey-app-key>" }
   * }
   */
//  function onPreSave(request, response, modules) {
//    var logger = modules.logger;
//
//    // Route on POST /?provider=<provider>[&redirect=<URL>][&state=<string>]
//    if(request.params.provider) {
//      modules.collectionAccess.collection('oauth').findOne({ _id: request.params.provider }, function(err, doc) {
//        if(err) {// Request failed.
//          logger.error(err);
//          res.body = {
//            error: 'KinveyInternalErrorRetry',
//            description: 'The Kinvey server could not lookup the OAuth provider. Please try again.',
//            debug: ''
//          };
//          res.complete(500);
//        }
//        else if(null == doc) {// Unsupported provider.
//          response.body = {
//            error: 'FeatureUnavailable',
//            description: 'This OAuth provider is not supported by this app.',
//            debug: ''
//          };
//          response.complete(400);
//        }
//        else {// Supported provider.
//          var provider = doc._id;
//          var consumer_key = doc.consumer_key;
//          var redirect = request.params.redirect || '';// Optional.
//
//          // OAuth 1.0a
//          if(-1 !== ['linkedin', 'twitter'].indexOf(provider)) {
//            var consumer_secret = doc.consumer_secret;
//            var url = {
//              linkedin: 'https://api.linkedin.com/uas/oauth/requestToken',
//              twitter: 'https://api.twitter.com/oauth/request_token',
//            };
//
//            // Authorization request.
//            var req = modules.request;
//            req.post({
//              url: {
//                linkedin: 'https://api.linkedin.com/uas/oauth/requestToken',
//                twitter: 'https://api.twitter.com/oauth/request_token',
//              }[provider],
//              oauth: {
//                callback: decodeURIComponent(redirect),
//                consumer_key: consumer_key,
//                consumer_secret: consumer_secret
//              }
//            }, function(err, res, body) {
//              if(err) {// Request failed.
//                logger.error(err);
//                response.body = {
//                  error: 'KinveyInternalErrorRetry',
//                  description: 'The Kinvey server failed to obtain a request token. Please try again.',
//                  debug: ''
//                };
//                response.complete(500);
//              }
//              else if(200 !== res.status) {// Authorization not granted.
//                response.body = {
//                  error: 'BLRuntimeError',
//                  description: 'The OAuth provider did not grant authorization.',
//                  debug: body
//                };
//                response.complete(400);
//              }
//              else {// Authorization granted.
//                var tokens = tokenize(body);
//                response.body = {
//                  provider: provider,
//                  url: {
//                    linkedin: 'https://api.linkedin.com/uas/oauth/authenticate',
//                    twitter: 'https://api.twitter.com/oauth/authenticate'
//                  }[provider] + '?oauth_token=' + encodeURIComponent(tokens.oauth_token),
//                  secret: tokens.oauth_token_secret
//                };
//                response.complete(200);
//              }
//            });
//          }
//          else if(-1 !== ['facebook', 'google'].indexOf(provider)) {// OAuth 2.0
//            consumer_key = encodeURIComponent(consumer_key);// Escape for use in URL.
//
//            // Response holds provider and authentication URL.
//            response.body = {
//              provider: provider,
//              url: {
//                facebook: 'https://www.facebook.com/dialog/oauth?display=popup&client_id=' + consumer_key + (redirect ? '&redirect_uri=' + redirect : ''),
//                google: 'https://accounts.google.com/o/oauth2/auth?client_id=' + consumer_key + '&redirect_uri=' + redirect + '&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile',
//              }[provider] + '&response_type=token' + (request.params.state ? '&state=' + request.params.state : '')
//            };
//            response.complete(200);
//          }
//        }
//      });
//    }
//    else {// Regular request.
//      response.continue();
//    }
//  }
//
//  /**
//   * Tokenizes string.
//   *
//   * @param {string} string Token string.
//   * @example foo=bar&baz=qux => { foo: 'bar', baz: 'qux' }
//   */
//  function tokenize(string) {
//    var tokens = {};
//    string.split('&').forEach(function(pair) {
//      var segments = pair.split('=', 2).map(decodeURIComponent);
//      segments[0] && (tokens[segments[0]] = segments[1]);
//    });
//    return tokens;
//  }

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
      segments[0] && (tokens[segments[0]] = segments[1]);
    });
    return tokens;
  };

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
     * Obtains OAuth access token from provider.
     * 
     * @param {string} provider OAuth provider.
     * @param {Object} [options]
     * @param {string} options.redirect Redirect URL.
     * @param {function(tokens, info)} options.success Success callback.
     * @param {function(error, info)} options.error Failure callback.
     */
    signIn: function(provider, options) {
      options || (options = {});

      // Open pop-up now, as opening it later will not play well with pop-up blockers.
      var popup = window.open('', 'KinveyOAuth', 'menubar=no,toolbar=no,location=no,personalbar=no');
      var redirect = options.redirect || document.location.href;
      var state = Math.random().toString(36).substr(2, 12);// Random string to avoid CSRF.

      // Build URL.
      var url = '/' + this.api + '/' + encodeURIComponent(Kinvey.appKey) + '/' +
        '?provider=' + encodeURIComponent(provider) +
        '&state=' + state +
        '&redirect=' + encodeURIComponent(redirect);

      // Fire request.
      this._send('POST', url, null, merge(options, {
        success: function(response, info) {
          // Redirect pop-up to provider.
          popup.location.href = response.url;

          // Because we redirected to a different domain, we can't access it.
          // Wait for the pop-up to switch back to our domain.
          var interval = window.setInterval(function() {
            if(null == popup.location) {// Pop-up closed unexpectedly.
              window.clearTimeout(interval);// Stop waiting.
              options.error && options.error({
                error: Kinvey.Error.RESPONSE_PROBLEM,
                description: 'The OAuth authentication pop-up closed unexpectedly.',
                debug: ''
              }, info);
            }
            else if(popup.location.href && 0 === popup.location.href.indexOf(redirect)) {
              window.clearTimeout(interval);// Stop waiting.
              var qs = (popup.location.search || '').substring(1);// OAuth 1.0a, remove "?".
              var hash = (popup.location.hash || '').substring(1);// OAuth 2.0, remove "#".
              popup.close();

              // Handle response.
              var data = merge(tokenize(qs), tokenize(hash));
              if(data.error || data.denied) {
                return options.error({
                  error: Kinvey.Error.REQUEST_FAILED,
                  description: 'The user refused to grant access to the OAuth provider.',
                  debug: ''
                }, info);
              }

              // OAuth 2.0.
              if(data.access_token && data.expires_in) {
                if(data.state === state) {// Validate state (avoid CSRF).
                  options.success && options.success({
                    access_token: data.access_token,
                    expires_in: data.expires_in
                  }, info);
                }
                else {
                  options.error({
                    error: Kinvey.Error.RESPONSE_PROBLEM,
                    description: 'The OAuth state parameter did not match the expected state.',
                    debug: 'The request was maliciously altered. This indicates a possible CSRF attack.'
                  }, info);
                }
                return;
              }

              // OAuth 1.0a: trigger verify request.
              data.oauth_token_secret = response.secret;
              Kinvey.OAuth.verifySignIn(provider, data, options);
            }
          }, 500);
        },
        error: function(error, info) {
          popup.close();// Something went wrong.
          options.error && options.error(error, info);
        }
      }));
    },

    /**
     * Verifies OAuth tokens. Only for OAuth 1.0a.
     * 
     * @param {string} provider OAuth provider.
     * @param {Object} tokens
     * @param {string} tokens.oauth_token OAuth token.
     * @param {string} tokens.oauth_token_secret OAuth token secret.
     * @param {string} tokens.oauth_verifier OAuth verifier.
     * @param {Object} [options]
     * @param {function(tokens, info)} options.success Success callback.
     * @param {function(error, info)} options.error Failure callback.
     */
    verifySignIn: function(provider, data, options) {
      options || (options = {});

      // Build URL.
      var url = '/' + this.api + '/' + encodeURIComponent(Kinvey.appKey) + '/' +
        '?provider=' + encodeURIComponent(provider);
      
      // Fire request.
      this._send('POST', url, JSON.stringify(data), merge(options, {
        success: function(response, info) {
          console.log(arguments);
        }
      }));
    }
  };

  // Apply mixin.
  Xhr.call(Kinvey.OAuth);

}());