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

// `Kinvey.Persistence.Net` adapter for [Node.js](http://nodejs.org/).
var NodeHttp = {
  /**
   * The Node.js url module.
   *
   * @type {Object}
   */
  url: require('url'),

  /**
   * @augments {Kinvey.Persistence.net.base64}
   */
  base64: function(value) {
    return new Buffer(value, 'utf-8').toString('base64');
  },

  /**
   * @augments {Kinvey.Persistence.Net.encode}
   */
  encode: encodeURIComponent,

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

    // Append the required Content-Length header.
    var length = 0;
    if(body instanceof Buffer) {
      length = body.length;
    }
    else if(null != body) {
      if (!isString(body)) {
        body = JSON.stringify(body);// Convert to string.
      }

      length = Buffer.byteLength(body);
    }
    headers['Content-Length'] = length;

    // Create the request.
    var path    = NodeHttp.url.parse(url);
    var adapter = require('https:' === path.protocol ? 'https' : 'http');
    var request = adapter.request({
      host    : path.hostname,
      path    : path.pathname + (path.search ? path.search : ''),
      port    : path.port,
      method  : method,
      headers : headers
    }, function(response) {
      // Listen for data.
      var data = [];
      response.on('data', function(chunk) {
        data.push(new Buffer(chunk));
      });

      // Listen for request completion.
      response.on('end', function() {
        // Debug.
        logger.debug('The network request completed.', response);

        // Parse response.
        var responseData = Buffer.concat(data);

        // Success implicates 2xx (Successful), 302 (Redirect), or 304 (Not Modified).
        var status = response.statusCode;

        // Check `Content-Type` header for application/json
        if (!options.file && '' !== responseData.toString() && 2 === parseInt(status / 100, 10) && 204 !== status) {
          var responseContentType = response.headers['content-type'];
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

        // Handle redirects
        if (3 === parseInt(status / 100, 10) && url.indexOf(Kinvey.MICHostName) === 0) {
          var location = response.headers.location;

          if (location) {
            var redirectPath = NodeHttp.url.parse(location);
            return deferred.resolve(parseQueryString(redirectPath.search));
          }

          return deferred.reject(new Kinvey.Error('No location header found. There might be a problem with your MIC setup on the backend.'));
        }
        else if(2 === parseInt(status / 100, 10) || 304 === status) {
          // Unless `options.file`, convert the response to a string.
          if(!options.file) {
            responseData = responseData.toString() || null;
          }
          deferred.resolve(responseData);
        }
        else {// Failure.
          var promise;
          var originalRequest = options._originalRequest;

          if (401 === status && options.attemptMICRefresh) {
            promise = MIC.refresh(options);
          }
          else {
            promise = Kinvey.Defer.reject();
          }

          promise.then(function() {
            // Don't refresh MIC again
            options.attemptMICRefresh = false;
            // Resend original request
            return Kinvey.Persistence.Net._request(originalRequest, options);
          }).then(function(response) {
            deferred.resolve(response);
          }, function() {
            var error = responseData.toString() || null;

            if (Array.isArray(error)) {
              error = new Kinvey.Error('Received an array as a response with a status code of ' + status + '. A JSON ' +
                                       'object is expected as a response to requests that result in an error status code.');
            }

            deferred.reject(error);
          });
        }
      });
    });

    // Apply timeout.
    var timedOut = false;
    if(0 < options.timeout) {
      request.on('socket', function(socket) {
        socket.setTimeout(options.timeout);
        socket.on('timeout', function() {
          timedOut = true;
          request.abort();
        });
      });
    }

    // Create a proxy request
    var aborted = false;
    var requestProxy = {
      cancel: function() {
        aborted = true;
        request.abort();
      }
    };

    // Listen for request errors.
    request.on('error', function(msg) {// Client-side error.
      // Debug.
      logger.error('The network request failed.', msg);

      if (timedOut) {
        return deferred.reject('timeout');
      } else if (aborted) {
        return deferred.reject('canceled');
      }

      // Reject the promise.
      deferred.reject(msg);
    });

    // Debug.
    logger.debug('Initiating a network request.', method, path, body, headers, options);

    // Initiate request.
    if(null != body) {
      request.write(body);
    }
    request.end();

    // Send the proxy request
    if (options.handler && typeof options.handler === 'function') {
      options.handler(requestProxy);
    }

    // Return the promise.
    return deferred.promise;
  }
};

// Use Node.js adapter.
Kinvey.Persistence.Net.use(NodeHttp);
