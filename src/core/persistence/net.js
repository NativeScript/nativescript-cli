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

// Network persistence.
// --------------------

// The cached return value of `deviceInformation` function.
var deviceInformationHeader = null;

// The actual execution of a network request must be defined by an adapter.

/**
 * @private
 * @memberof! <global>
 * @namespace Kinvey.Persistence.Net
 */
Kinvey.Persistence.Net = /** @lends Kinvey.Persistence.Net */{
  /**
   * Initiates a create request.
   *
   * @param {Request} request The request.
   * @param {Options} options Options.
   * @returns {Promise} The response.
   */
  create: function(request, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Initiating a create request.', arguments);
    }

    // Strip maxAge metadata.
    request.data = maxAge.removeMetadata(request.data);

    // Initiate the network request.
    request.method = 'POST';
    return Kinvey.Persistence.Net._request(request, options);
  },

  /**
   * Initiates a read request.
   *
   * @param {Request} request The request.
   * @param {Options} options Options.
   * @returns {Promise} The response.
   */
  read: function(request, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Initiating a read request.', arguments);
    }

    // Cast arguments.
    request.flags = request.flags || {};
    options       = options || {};

    // Add support for field selection.
    if(isArray(options.fields)) {
      request.flags.fields = options.fields.join(',');
    }

    // Add support for file references.
    if(null != request.collection) {
      if(false !== options.fileTls) {
        request.flags.kinveyfile_tls = true;
      }
      if(options.fileTtl) {
        request.flags.kinveyfile_ttl = options.fileTtl;
      }
    }

    // Add support for references.
    if(options.relations) {
      // Resolve all relations not explicitly excluded.
      options.exclude = options.exclude || [];
      var resolve = Object.keys(options.relations).filter(function(member) {
        return -1 === options.exclude.indexOf(member);
      });

      if(0 !== resolve.length) {
        request.flags.retainReferences = false;
        request.flags.resolve          = resolve.join(',');
      }
    }

    // Initiate the network request.
    request.method = 'GET';
    return Kinvey.Persistence.Net._request(request, options);
  },

  /**
   * Initiates an update request.
   *
   * @param {Request} request The request.
   * @param {Options} options Options.
   * @returns {Promise} The response.
   */
  update: function(request, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Initiating an update request.', arguments);
    }

    // Strip maxAge metadata.
    request.data = maxAge.removeMetadata(request.data);

    // Initiate the network request.
    request.method = 'PUT';
    return Kinvey.Persistence.Net._request(request, options);
  },

  /**
   * Initiates a delete request.
   *
   * @param {Request} request The request.
   * @param {Options} options Options.
   * @returns {Promise} The response.
   */
  destroy: function(request, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Initiating a delete request.', arguments);
    }

    // Initiate the network request.
    request.method = 'DELETE';
    return Kinvey.Persistence.Net._request(request, options);
  },

  /**
   * Initiates a network request to the Kinvey service.
   *
   * @private
   * @param {Request} request The request.
   * @param {string} request.method The request method.
   * @param {Options} options Options.
   * @returns {Promise}
   */
  _request: function(request, options) {
    var error;

    // Validate arguments.
    if(null == request.method) {
      error = new Kinvey.Error('request argument must contain: method.');
      return wrapCallbacks(Kinvey.Defer.reject(error), options);
    }
    if(null == request.namespace) {
      error = new Kinvey.Error('request argument must contain: namespace.');
      return wrapCallbacks(Kinvey.Defer.reject(error), options);
    }
    if(null == request.auth) {
      error = new Kinvey.Error('request argument must contain: auth.');
      return wrapCallbacks(Kinvey.Defer.reject(error), options);
    }

    // Validate preconditions.
    if(null == Kinvey.appKey && Auth.None !== request.auth) {
      error = clientError(Kinvey.Error.MISSING_APP_CREDENTIALS);
      return wrapCallbacks(Kinvey.Defer.reject(error), options);
    }
    if(null == Kinvey.masterSecret && options.skipBL) {
      error = clientError(Kinvey.Error.MISSING_MASTER_CREDENTIALS);
      return wrapCallbacks(Kinvey.Defer.reject(error), options);
    }

    // Cast arguments.
    options.trace = options.trace || (KINVEY_DEBUG && false !== options.trace);
    options.attemptMICRefresh = false === options.attemptMICRefresh ? false : true;

    // Build, escape, and join URL segments.
    // Format: <APIHostName>/<namespace>[/<Kinvey.appKey>][/<collection>][/<id>]
    var segments = [ request.namespace, Kinvey.appKey, request.collection, request.id];
    segments = segments.filter(function(value) {
      // Exclude empty optional segment. Note the required namespace cannot be
      // empty at this point (enforced above).
      return null != value;
    }).map(Kinvey.Persistence.Net.encode);
    var url = [ Kinvey.APIHostName ].concat(segments).join('/') + '/';

    // Build query string.
    var flags = request.flags || {};
    if(request.query) {// Add query fragments.
      var query = request.query.toJSON();
      flags.query = query.filter;
      if(!isEmpty(query.fields)) {
        flags.fields = query.fields.join(',');
      }
      if(null !== query.limit) {
        flags.limit = query.limit;
      }
      if(0 !== query.skip) {
        flags.skip = query.skip;
      }
      if(!isEmpty(query.sort)) {
        flags.sort = query.sort;
      }
    }

    // Unless `options.nocache` is false, add a cache busting query string.
    // This is useful for Android < 4.0 which caches all requests aggressively.
    if(false !== options.nocache) {
      flags._ = Math.random().toString(36).substr(2);
    }

    // Format fragments.
    var params = [];
    for(var key in flags) {
      if(flags.hasOwnProperty(key)) {
        var value = isString(flags[key]) ? flags[key] : JSON.stringify(flags[key]);
        params.push(
          Kinvey.Persistence.Net.encode(key) + '=' + Kinvey.Persistence.Net.encode(value)
        );
      }
    }

    // Append query string if there are `params`.
    if(0 < params.length) {
      url += '?' + params.join('&');
    }

    // Evaluate the device information header.
    if(null === deviceInformationHeader) {
      deviceInformationHeader = deviceInformation();
    }

    // Set headers.
    var headers = {
      Accept                        : 'application/json',
      'X-Kinvey-API-Version'        : Kinvey.API_VERSION,
      'X-Kinvey-Device-Information' : deviceInformationHeader
    };

    // Append optional headers.
    options.clientAppVersion = options.clientAppVersion || Kinvey.ClientAppVersion.stringValue();
    if (options.clientAppVersion != null) {
      headers['X-Kinvey-Client-App-Version'] = (options.clientAppVersion + '');
    }
    if(null != request.data) {
      headers['Content-Type'] = 'application/json; charset=utf-8';
    }
    if(options.contentType) {
      headers['X-Kinvey-Content-Type'] = options.contentType;
    }
    if(options.skipBL) {
      headers['X-Kinvey-Skip-Business-Logic'] = 'true';
    }
    if(options.trace) {
      headers['X-Kinvey-Include-Headers-In-Response'] = 'X-Kinvey-Request-Id';
      headers['X-Kinvey-ResponseWrapper']             = 'true';
    }

    // Set the custom request properties for the request defaulting to an
    // empty object.
    options.customRequestProperties = options.customRequestProperties || {};

    // Get globally set custom request properties.
    var customRequestProperties = Kinvey.CustomRequestProperties.properties();

    // If any custom request properties exist globally, merge them into the
    // custom request properties for this request. Only global custom request
    // properties that don't already exist for this request will be added.
    // Global request properties do NOT overwrite existing custom request
    // properties for the request.
    if (customRequestProperties != null) {
      Object.keys(customRequestProperties).forEach(function(name) {
        if (!options.customRequestProperties.hasOwnProperty(name)) {
          options.customRequestProperties[name] = customRequestProperties[name];
        }
      });
    }

    // Set the custom request properties header only if there are custom request
    // properties to send
    if (Object.getOwnPropertyNames(options.customRequestProperties).length > 0) {
      // Set X-Kinvey-Custom-Request-Properties to the JSON string of the custom
      // request properties for the request. Checks to make sure the JSON string of
      // the custom request properties is less then the max bytes allowed for custom
      // request properties otherwise throw an error.
      var customRequestPropertiesHeader = JSON.stringify(options.customRequestProperties);
      var customRequestPropertiesByteCount = getByteCount(customRequestPropertiesHeader);
      if (customRequestPropertiesByteCount >= CRP_MAX_BYTES) {
        error = new Kinvey.Error('Custom request properties is ' + customRequestPropertiesByteCount +
                                 ' bytes. It must be less then ' + CRP_MAX_BYTES + ' bytes.');
        return wrapCallbacks(Kinvey.Defer.reject(error), options);
      }

      // Set the custom request property header
      headers['X-Kinvey-Custom-Request-Properties'] = customRequestPropertiesHeader;
    }

    // Debug.
    if(KINVEY_DEBUG) {
      headers['X-Kinvey-Trace-Request']               = 'true';
    }

    // Authorization.
    var promise = request.auth().then(function(auth) {
      if(null !== auth) {
        // Format credentials.
        var credentials = auth.credentials;
        if(null != auth.username) {
          credentials = Kinvey.Persistence.Net.base64(auth.username + ':' + auth.password);
        }

        // Append header.
        headers.Authorization = auth.scheme + ' ' + credentials;
      }
    });

    // Invoke the network layer.
    return promise.then(function() {
      // Store the original request
      options._originalRequest = request;

      // Send the request
      var response = Kinvey.Persistence.Net.request(
        request.method,
        url,
        request.data,
        headers,
        options
      ).then(function(response) {
        // Parse the response.
        try {
          response = JSON.parse(response);
        }
        catch(e) { }

        // Debug.
        if(KINVEY_DEBUG && options.trace && isObject(response)) {
          log('Obtained the request ID.', response.headers['X-Kinvey-Request-Id']);
        }

        // Check response to GET request that we receive a
        // single entity if one is expected or an array of entities
        // if they are expected. Thrown error will reject the promise.
        if (request.method === 'GET' &&
            request.collection != null &&
            request.namespace === 'appdata') {
          var expectSingleEntity = request.id != null ? true : false;
          var error;

          if (isArray(response) && expectSingleEntity) {
            error = new Kinvey.Error('Expected a single entity as a response to ' +
                                     request.method + ' ' + url + '. Received an array ' +
                                     'of entities instead.');
            throw error;
          }
          else if (!isArray(response) && !expectSingleEntity) {
            error = new Kinvey.Error('Expected an array of entities as a response to ' +
                                     request.method + ' ' + url + '. Received a single ' +
                                     'entity instead.');
            throw error;
          }
        }

        return options.trace && isObject(response) ? response.result : response;
      }, function(response) {
        // Parse the response.
        try {
          response = JSON.parse(response);
        }
        catch(e) {}

        // If `options.trace`, extract result and headers from the response.
        var requestId = null;
        if(options.trace) {
          requestId = response.headers['X-Kinvey-Request-Id'];
          response  = response.result;
        }

        // Format the response as client-side error object.
        if(null != response && null != response.error) {// Server-side error.
          response = {
            name        : response.error,
            description : response.description || '',
            debug       : response.debug       || ''
          };

          // If `options.trace`, add the `requestId`.
          if(options.trace) {
            response.requestId = requestId;

            // Debug.
            if(KINVEY_DEBUG) {
              log('Obtained the request ID.', requestId);
            }
          }
        }
        else {// Client-side error.
          var dict = {// Dictionary for common errors.
            abort   : Kinvey.Error.REQUEST_ABORT_ERROR,
            error   : Kinvey.Error.REQUEST_ERROR,
            timeout : Kinvey.Error.REQUEST_TIMEOUT_ERROR
          };
          response = clientError(dict[response] || dict.error, { debug: response });
        }

        // Reject.
        return Kinvey.Defer.reject(response);
      });

      // Handle certain errors.
      return response.then(null, function(error) {
        if (Kinvey.Error.USER_LOCKED_DOWN === error.name) {
          // Clear user credentials.
          Kinvey.setActiveUser(null);

          // Clear the cache, and return the original error.
          if('undefined' !== typeof Database) {
            var fn = function() {
              Kinvey.Defer.reject(error);
            };
            return Kinvey.Sync.destruct().then(fn, fn);
          }
        }
        else if (Kinvey.Error.INVALID_CREDENTIALS === error.name) {
          var activeUser = Kinvey.getActiveUser();

          // Add a descriptive message to `InvalidCredentials` error so the user
          // knows what’s going on.
          if (activeUser != null && activeUser._socialIdentity != null && activeUser._socialIdentity[MIC.AUTH_PROVIDER] != null) {
            error.debug += ' It is possible the tokens used to execute the ' +
             'request are expired. In that case, please execute ' +
             '`Kinvey.User.logout({ force: true })`, and then log back in ' +
             'using `Kinvey.User.MIC.loginWithAuthorizationCodeLoginPage(redirectUri)` or ' +
             '`Kinvey.User.MIC.loginWithAuthorizationCodeAPI(username, password, redirectUri)` ' +
             'to solve this issue.';
          }
          else {
            error.debug += ' It is possible the tokens used to execute the ' +
             'request are expired. In that case, please execute ' +
             '`Kinvey.User.logout({ force: true })`, and then log back in ' +
             'using `Kinvey.User.login(username, password)` ' +
             'to solve this issue.';
          }
        }
        return Kinvey.Defer.reject(error);
      });
    });
  },

  /**
   * Base64-encodes a value.
   *
   * @abstract
   * @method
   * @param {string} value Value.
   * @returns {string} Base64-encoded value.
   */
  base64: methodNotImplemented('Kinvey.Persistence.Net.base64'),

  /**
   * Encodes a value for use in the URL.
   *
   * @abstract
   * @method
   * @param {string} value Value.
   * @returns {string} Encoded value.
   */
  encode: methodNotImplemented('Kinvey.Persistence.Net.encode'),

  /**
   * Initiates a network request.
   *
   * @abstract
   * @method
   * @param {string}  method    Method.
   * @param {string}  url       URL.
   * @param {?Object} [body]    Body.
   * @param {Object}  [headers] Headers.
   * @param {Options} [options] Options.
   * @returns {Promise} The promise.
   */
  request: methodNotImplemented('Kinvey.Persistence.Net.request'),

  /**
   * Sets the implementation of `Kinvey.Persistence.Net` to the specified
   * adapter.
   *
   * @method
   * @param {Object} adapter Object implementing the `Kinvey.Persistence.Net`
   *          interface.
   */
  use: use(['base64', 'encode', 'request'])
};
