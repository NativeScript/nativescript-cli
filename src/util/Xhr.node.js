(function() {

  // Utilities.
  var nodeHttp = require('http');
  var nodeHttps = require('https');
  var nodeUrl = require('url');

  // Define the Xhr mixin.
  var Xhr = (function() {
    /**
     * Base 64 encodes string.
     * 
     * @private
     * @param {string} value
     * @return {string} Encoded string.
     */
    var base64 = function(value) {
      return new Buffer(value, 'utf8').toString('base64');
    };

    /**
     * Returns authorization string.
     * 
     * @private
     * @param {boolean} forceAppc Force use of application credentials.
     * @return {Object} Authorization.
     */
    var getAuth = function(forceAppc) {
      // Use master secret if specified.
      if(null != Kinvey.masterSecret) {// undefined or null
        return 'Basic ' + this._base64(Kinvey.appKey + ':' + Kinvey.masterSecret);
      }

      // Use Session Auth if there is a current user, and application credentials
      // are not forced.
      var user = Kinvey.getCurrentUser();
      if(!forceAppc && null !== user) {
        return 'Kinvey ' + user.getToken();
      }

      // Use application credentials as last resort.
      return 'Basic ' + this._base64(Kinvey.appKey + ':' + Kinvey.appSecret);
    };

    /**
     * Returns device information.
     * 
     * @private
     * @return {string} Device information.
     */
    var getDeviceInfo = function() {
      // Example: "js-node/@@version linux-node v0.6.13 0".
      return [
        'js-node/@@version',
        process.platform + '-' + process.title,
        process.version,
        0// always set device ID to 0.
      ].map(function(value) {
        return value.toString().toLowerCase().replace(' ', '_');
      }).join(' ');
    };

    /**
     * Parses response body.
     * 
     * @private
     * @param {Array} buffers List of buffers.
     * @return {Buffer|string} Buffer if binary response, string otherwise.
     */
    var parse = function(buffers) {
      // Join buffers. Node.js < 0.8 does not support Buffer.concat.
      var buffer = Buffer.concat ? Buffer.concat(buffers) : (function(buffers) {
        // Calculate total buffer length.
        var length = 0;
        buffers.forEach(function(buffer) {
          length += buffer.length;
        });

        // Copy all buffers into one final buffer.
        var result = new Buffer(length);
        var pos = 0;
        buffers.forEach(function(buffer) {
          buffer.copy(result, pos);
          pos += buffer.length;
        });
        return result;
      }(buffers));

      // If data stream is binary, return buffer. Otherwise, return string.
      var str = buffer.toString();
      if(buffer.length === Buffer.byteLength(str)) {// binary === utf8
        return str;
      }
      return buffer;
    };

    /**
     * Sends a request against Kinvey.
     * 
     * @private
     * @param {string} method Request method.
     * @param {string} url Request URL.
     * @param {string} body Request body.
     * @param {Object} options
     * @param {function(response, info)} [options.success] Success callback.
     * @param {function(error, info)} [options.error] Failure callback.
     */
    var send = function(method, url, body, options) {
      options || (options = {});
      options.success || (options.success = this.options.success);
      options.error || (options.error = this.options.error);

      // For now, include authorization in this adapter. Ideally, it should
      // have some external interface.
      if(null === Kinvey.getCurrentUser() && Kinvey.Store.AppData.USER_API !== this.api && null == Kinvey.masterSecret && !options.appc) {
        return Kinvey.User.create({}, merge(options, {
          success: bind(this, function() {
            this._send(method, url, body, options);
          })
        }));
      }

      // Add host to URL.
      url = Kinvey.HOST + url;

      // Headers.
      var headers = {
        Accept: 'application/json, text/javascript',
        Authorization: this._getAuth(options.appc),
        'X-Kinvey-API-Version': Kinvey.API_VERSION,
        'X-Kinvey-Device-Information': this._getDeviceInfo()
      };
      body && (headers['Content-Type'] = 'application/json; charset=utf-8');
      Kinvey.masterSecret && (headers['X-Kinvey-Master-Create-User'] = true);

      // Execute request.
      this._xhr(method, url, body, merge(options, {
        headers: headers,
        success: function(response, info) {
          // Response is expected to be either empty, or valid JSON.
          response = response ? JSON.parse(response) : null;
          options.success(response, info);
        },
        error: function(response, info) {
          // Response could be valid JSON if the error occurred at Kinvey.
          try {
            response = JSON.parse(response);
          }
          catch(_) {// Or just the error type if something else went wrong.
            var error = {
              abort: 'The request was aborted',
              error: 'The request failed',
              timeout: 'The request timed out'
            };

            // Execute application-level handler.
            response = {
              error: Kinvey.Error.REQUEST_FAILED,
              description: error[response] || error.error,
              debug: ''
            };
          }

          // Return.
          options.error(response, info);
        }
      }));
    };

    /**
     * Sends a request.
     * 
     * @private
     * @param {string} method Request method.
     * @param {string} url Request URL.
     * @param {string} body Request body.
     * @param {Object} options
     * @param {Object} [options.headers] Request headers.
     * @param {integer} [options.timeout] Request timeout (ms).
     * @param {function(status, response)} [options.success] Success callback.
     * @param {function(type)} [options.error] Failure callback.
     */
    var xhr = function(method, url, body, options) {
      options || (options = {});
      options.headers || (options.headers = {});
      'undefined' !== typeof options.timeout || (options.timeout = this.options.timeout);
      options.success || (options.success = this.options.success);
      options.error || (options.error = this.options.error);

      // Add Content-Length header.
      // @link http://nodejs.org/api/buffer.html#buffer_class_method_buffer_bytelength_string_encoding
      var length = 0;
      if(body) {
        length = body instanceof Buffer ? body.length : Buffer.byteLength(body);
      }
      options.headers['Content-Length'] = length;

      // Create request.
      var path = nodeUrl.parse(url);
      var adapter = 'https:' === path.protocol ? nodeHttps : nodeHttp;
      var request = adapter.request({
        host: path.hostname,
        path: path.pathname + (path.search ? path.search : ''),
        port: path.port,
        method: method,
        headers: options.headers
      }, bind(this, function(response) {
        // Capture data stream.
        var data = [];
        response.on('data', function(chunk) {
          data.push(new Buffer(chunk));
        });

        // Handle response when it completes.
        // @link https://github.com/joyent/node/issues/728
        var onComplete = bind(this, function() {
          // Success implicates status 2xx (Successful), or 304 (Not Modified).
          var result = this._parse(data);
          if(2 === parseInt(response.statusCode / 100, 10) || 304 === response.statusCode) {
            options.success(result, { network: true });
          }
          else {
            options.error(result, { network: true });
          }
        });
        response.on('close', onComplete);
        response.on('end', onComplete);
      }));

      // Define timeout error handler.
      if(request.socket) {// Node.js 0.4.x sets the socket immediately.
        request.socket.setTimeout(options.timeout);
        request.socket.on('timeout', function() {
          // Abort the request, and invoke error handler manually.
          request.abort();
          options.error('timeout', { network: true });
        });
      }
      else {// Newer versions of Node.js use an event-based approach.
        request.on('socket', function(socket) {
          socket.setTimeout(options.timeout);
          socket.on('timeout', function() {
            // Abort the request, and set event to timeout explicitly.
            request.eventType = 'timeout';
            request.abort();
          });
        });
      }

      // Define request error handler.
      request.on('error', function(error) {
        // request.eventType is populated on timeout.
        options.error(request.eventType || error.error, { network: true });
      });

      // Fire request.
      body && request.write(body);// pass body.
      request.end();
    };

    // Attach to context.
    return function() {
      this._base64 = base64;
      this._getAuth = getAuth;
      this._getDeviceInfo = getDeviceInfo;
      this._parse = parse;
      this._send = send;
      this._xhr = xhr;
      return this;
    };
  }());

}());