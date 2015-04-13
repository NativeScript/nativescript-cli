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

// Helper function to invoke
// [TiPlatformConnect](https://github.com/k0sukey/TiPlatformConnect) to link a
// social identity.
var tiPlatformConnect = function(provider, options) {
  // Debug.
  if(KINVEY_DEBUG) {
    log('Obtaining a social identity.', arguments);
  }

  // Validate arguments.
  options = options || {};
  if(null == options.consumerKey) {
    throw new Kinvey.Error('options argument must contain: consumerKey.');
  }
  if(null == options.consumerSecret) {
    throw new Kinvey.Error('options argument must contain: consumerSecret.');
  }

  // Prepare the response.
  var deferred = Kinvey.Defer.deferred();

  // Invoke the `TiPlatformConnect` plugin.
  var adapter = root.__KinveySocialAdapter[provider](options);
  adapter.addEventListener('login', function(event) {
    // Upon success, fulfill the promise with the obtained access tokens.
    if(event.success) {
      return deferred.resolve({
        consumer_key        : options.consumerKey,
        consumer_secret     : options.consumerSecret,
        access_token        : event.accessTokenKey,
        access_token_secret : event.accessTokenSecret
      });
    }

    // Failed to obtain the access tokens, reject the promise.
    var error = clientError(Kinvey.Error.SOCIAL_ERROR, {
      description : event.error,
      debug       : event
    });
    deferred.reject(error);
  });

  // Trigger the authorization flow.
  adapter.authorize();

  // Debug.
  if(KINVEY_DEBUG) {
    deferred.promise.then(function(response) {
      log('Obtained the social identity.', response);
    }, function(error) {
      log('Failed to obtain a social identity.', error);
    });
  }

  // Return the response.
  return deferred.promise;
};

// `Social` adapter for Titanium.
var TiSocialAdapter = {
  /**
   * http://docs.appcelerator.com/titanium/latest/#!/api/Modules.Facebook
   * NOTE The built-in Titaium Facebook module can act buggy. Exact use case at
   * http://developer.appcelerator.com/question/116915
   *
   * @augments {Social.facebook}
   * @param {string} options.appId         The Facebook App Id.
   * @param {Array}  [options.permissions] Additional Facebook permissions.
   * @throws {Kinvey.Error} `options` must contain: `appId`.
   */
  facebook: function(options) {
    var error;

    // Debug.
    if(KINVEY_DEBUG) {
      log('Initiating the Facebook OAuth2.0 flow.', arguments);
    }

    // Validate arguments.
    options = options || {};
    if(null == options.appId) {
      error = new Kinvey.Error('options argument must contain: appId.');
      return Kinvey.Defer.reject(error);
    }

    // Prepare the response.
    var deferred = Kinvey.Defer.deferred();

    // Obtain a reference to the Titanium Facebook adapter.
    var TiFacebook = isMobileWeb ? Titanium.Facebook : require('facebook');
    TiFacebook.appid       = options.appId;
    TiFacebook.permissions = options.permissions || TiFacebook.permissions || [];

    // Register the event listener.
    var listener = function(event) {
      TiFacebook.removeEventListener('login', listener);// Cleanup.

      // Debug.
      if(KINVEY_DEBUG) {
        log('Received the Facebook login response.', event);
      }

      // On success, fulfill with the obtained oAuth2.0 token.
      if(event.success) {
        var expires = TiFacebook.getExpirationDate().getTime();
        return deferred.resolve({
          access_token : TiFacebook.getAccessToken(),
          expires_in   : root.parseInt((expires - new Date().getTime()) / 1000, 10)
        });
      }

      // On failure, reject with the error.
      var error = clientError(Kinvey.Error.SOCIAL_ERROR, { debug: event });
      deferred.reject(error);
    };
    TiFacebook.addEventListener('login', listener);

    // Trigger the authorization flow.
    if(TiFacebook.loggedIn) {// If already logged in, fire event manually.
      TiFacebook.fireEvent('login', { success: true });
    }
    else {
      TiFacebook.authorize();
    }

    // Debug.
    if(KINVEY_DEBUG) {
      deferred.promise.then(function(response) {
        log('Obtained the Facebook OAuth2.0 tokens.', response);
      }, function(error) {
        log('Failed to obtain the Facebook OAuth2.0 tokens.', error);
      });
    }

    // Return the response.
    return deferred.promise;
  },

  /**
   * @augments {Social.google}
   */
  google: isMobileWeb ? SocialAdapter.google : function(options) {
    // Cast arguments.
    options = options || {};
    options.scope = [// https://developers.google.com/+/api/oauth#scopes
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ].join(' ');

    // Forward to `tiPlatformConnect`.
    return tiPlatformConnect('Google', options);
  },

  /**
   * @augments {Social.linkedIn}
   */
  linkedIn: isMobileWeb ? SocialAdapter.linkedIn : function(options) {
    // Forward to `tiPlatformConnect`.
    return tiPlatformConnect('Linkedin', options);
  },

  /**
   * @augments {Social.twitter}
   */
  twitter: isMobileWeb ? SocialAdapter.twitter : function(options) {
    // Forward to `tiPlatformConnect`.
    return tiPlatformConnect('Twitter', options);
  }
};

// Apply the adapter.
Social.use(TiSocialAdapter);
