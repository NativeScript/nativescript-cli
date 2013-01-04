(function() {

  /**
   * UI helper function to perform the entire OAuth flow for a provider.
   * 
   * @param {string} provider OAuth provider.
   * @param {Object} [options]
   * @param {string} options.redirect Redirect URL.
   * @param {function(tokens)} options.success Success callback.
   * @param {function(error)} options.error Failure callback.
   */
  Kinvey.OAuth.signIn = function(provider, options) {
    options || (options = {});
    options.popup || (options.popup = 'menubar=no,toolbar=no,location=no,personalbar=no');

    // Open pop-up here, as otherwise chances are they are blocked.
    var popup = window.open('about:blank', 'KinveyOAuth', options.popup);

    // Step 1: obtain a request token.
    var state = Math.random().toString(36).substr(2, 12);// CSRF protection.
    this.requestToken(provider, merge(options, {
      redirect: options.redirect || document.location.toString(),
      state: state,
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
            var response = this._tokenize(
              popup.location.search.substring(1) + '&' + popup.location.hash.substring(1)
            );
            popup.close();// Close pop-up.

            // Step 3: process token.
            if(response.state && response.state !== state) {// Validate state.
              options.error && options.error({
                error: Kinvey.Error.RESPONSE_PROBLEM,
                description: 'The state parameter did not match the expected state.',
                debug: 'This error could be the result of a cross-site-request-forgery attack.'
              });
            }
            else {
              this.accessToken(provider, response, merge(options, {
                oauth_token_secret: tokens.oauth_token_secret// OAuth1.0a.
              }));
            }
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
  };

}());