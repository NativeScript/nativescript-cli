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

// `Kinvey.Persistence.Net` adapter for [XHR](http://www.w3.org/TR/XMLHttpRequest2/).
var Xhr = {
  /**
   * Flag containing the device `responseType`.
   *
   * @type {string}
   */
  responseType: (function() {
    // The latest version of the File API uses `new Blob` to create a Blob object.
    // Older browsers, however, do not support this and fall back to using
    // ArrayBuffer.
    try {
      return new root.Blob() && 'blob';
    }
    catch(e) {
      return 'arraybuffer';
    }
  }()),

  /**
   * Flag whether the device supports the timeout property natively.
   *
   * @type {boolean}
   */
  supportsTimeout: XMLHttpRequest.prototype.hasOwnProperty('timeout'),

  /**
   * @augments {Kinvey.Persistence.Net.base64}
   */
  base64: function(value) {
    return root.btoa(value);
  },

  /**
   * @augments {Kinvey.Persistence.Net.encode}
   */
  encode: root.encodeURIComponent,

  /**
   * @augments {Kinvey.Persistence.Net.request}
   */
  request: function(method, url, body, headers, options) {
    // Cast arguments.
    body    = body    || null;
    headers = headers || {};
    options = options || {};
    options.attemptMICRefresh = false === options.attemptMICRefresh ? false : true;

    // Prepare the response.
    var deferred = Kinvey.Defer.deferred();

    // Create the request.
    var request = new XMLHttpRequest();
    request.open(method, url);

    // Apply options.
    if(options.file) {
      request.responseType = Xhr.responseType;
      request.setRequestHeader('Accept', options.file);
    }
    if(0 < options.timeout) {
      request.timeout = options.timeout;
    }
    var timer = null;

    // Append header for compatibility with Android 2.2, 2.3.3, and 3.2.
// http://www.kinvey.com/blog/item/179-how-to-build-a-service-that-supports-every-android-browser
    if(0 === url.indexOf(Kinvey.APIHostName) && 'GET' === method) {
      var location = root.location;
      if(null != location && null != location.protocol) {
        headers['X-Kinvey-Origin'] = location.protocol + '//' + location.host;
      }
    }

    // Append request headers.
    for(var name in headers) {
      if(headers.hasOwnProperty(name)) {
        request.setRequestHeader(name, headers[name]);
      }
    }

    // Listen for request completion.
    // NOTE `request.onloadend` lacks universal support.
    request.onabort = request.onerror = request.onload = request.ontimeout = function(event) {
      // Stop the timer.
      if(null !== timer) {
        root.clearTimeout(timer);
      }

      // Debug.
      if(KINVEY_DEBUG) {
        log('The network request completed.', request);
      }

      // Extract the response.
      var responseData = request.response || null;
      if('undefined' === typeof request.response) {
        responseData = request.responseText || null;
      }

      // Check `Content-Type` header for application/json
      if (!options.file && responseData != null && 204 !== request.status) {
        var responseContentType = request.getResponseHeader('Content-Type');
        var error;

        if (responseContentType == null) {
          error = new Kinvey.Error('Content-Type header missing in response. Please add ' +
                                   'Content-Type header to response with value ' +
                                   'application/json.');
        }
        else if (responseContentType.indexOf('application/json') === -1) {
          error = new Kinvey.Error('Response Content-Type header is set to ' +
                                   responseContentType + '. Expected it to be set ' +
                                   'to application/json.');
        }

        if (error) {
          return deferred.reject(error);
        }
      }

      // Success implicates 2xx (Successful), or 304 (Not Modified).
      var status = request.status;
      if(2 === parseInt(status / 100, 10) || 304 === status) {
        deferred.resolve(responseData);
      }
      else {// Failure.
        var promise;
        var originalRequest = options._originalRequest;
        options._originalRequest = null;

        if (options.attemptMICRefresh && null != originalRequest) {
          // Try and refresh MIC access token
          promise = MIC.refresh(options);
        }
        else {
          // Go ahead an just reject
          promise = Kinvey.Defer.reject();
        }

        promise.then(function() {
          // Resend original request
          Kinvey.Persistence.Net._request(originalRequest, options).then(function(response) {
            deferred.resolve(response);
          }, function(err) {
            deferred.reject(err);
          });
        }, function() {
          var type = null !== timer ? 'timeout' : event.type;
          var response = 0 !== status ? responseData : type;

          // If `options.file`, parse the response to obtain the error.
          if(options.file && 0 !== status) {
            // Convert the binary response to a string.
            if(null != root.ArrayBuffer && response instanceof root.ArrayBuffer) {
              var buffer  = '';
              var bufView = new root.Uint8Array(response);
              for(var i = 0; i < response.byteLength; i += 1) {
                buffer += String.fromCharCode(bufView[i]);
              }
              deferred.reject(buffer);
            }
            else if(null != root.Blob && response instanceof root.Blob) {
              var reader = new root.FileReader();
              reader.onload = function(event) {
                deferred.reject(event.target.result);
              };
              reader.readAsText(response);
            }
          }
          else {// Return the error.
            deferred.reject(response || type || null);
          }
        });
      }
    };

    // Debug.
    if(KINVEY_DEBUG) {
      log('Initiating a network request.', method, url, body, headers, options);
    }

    // Initiate the request.
    if(isObject(body) && !(
     (null != root.ArrayBuffer && body instanceof root.ArrayBuffer) ||
     (null != root.Blob        && body instanceof root.Blob)
    )) {
      body = JSON.stringify(body);
    }
    request.send(body);

    // Set a manual timeout if not supported natively.
    if(!Xhr.supportsTimeout && request.timeout) {
      // Abort the request on timeout.
      timer = root.setTimeout(function() {
        request.abort();
      }, request.timeout);
    }

    // Return the response.
    return deferred.promise;
  }
};

// Use XHR adapter.
Kinvey.Persistence.Net.use(Xhr);
