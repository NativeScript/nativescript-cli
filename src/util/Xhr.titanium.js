(function() {

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
      return Titanium.Utils.base64encode(value);
    };

    /**
     * Returns authorization string.
     * 
     * @private
     * @return {Object} Authorization.
     */
    var getAuth = function() {
      // Use master secret if specified.
      if(null !== Kinvey.masterSecret) {
        return 'Basic ' + this._base64(Kinvey.appKey + ':' + Kinvey.masterSecret);
      }

      // Use Session Auth if there is a current user.
      var user = Kinvey.getCurrentUser();
      if(null !== user) {
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
      // Example: "Titanium mobileweb 2.0.1.GA2 XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXX".
      return [
        'Titanium',
        Titanium.Platform.osname,
        Titanium.Platform.version,
        Titanium.App.getGUID()// device ID.
      ].map(function(value) {
        return value.toString().toLowerCase().replace(' ', '_');
      }).join(' ');
    };

    /**
     * Sends a request against Kinvey.
     * 
     * @private
     * @param {string} method Request method.
     * @param {string} url Request URL.
     * @param {string} body Request body.
     * @param {Object} options
     * @param {integer} [options.timeout] Request timeout (ms).
     * @param {function(response, info)} [options.success] Success callback.
     * @param {function(error, info)} [options.error] Failure callback.
     */
    var send = function(method, url, body, options) {
      options || (options = {});
      'undefined' !== typeof options.timeout || (options.timeout = this.options.timeout);
      options.success || (options.success = this.options.success);
      options.error || (options.error = this.options.error);

      // For now, include authorization in this adapter. Ideally, it should
      // have some external interface.
      if(null === Kinvey.getCurrentUser() && Kinvey.Store.AppData.USER_API !== this.api && null === Kinvey.masterSecret) {
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
        Authorization: this._getAuth(),
        'X-Kinvey-API-Version': Kinvey.API_VERSION,
        'X-Kinvey-Device-Information': this._getDeviceInfo()
      };
      body && (headers['Content-Type'] = 'application/json; charset=utf-8');

      // Add header for compatibility with Android 2.2, 2.3.3 and 3.2.
      // @link http://www.kinvey.com/blog/item/179-how-to-build-a-service-that-supports-every-android-browser
      if('GET' === method && window && window.location) {
        headers['X-Kinvey-Origin'] = window.location.protocol + '//' + window.location.host;
      }

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

      // Create the request. Titanium.Network.createHTTPClient is buggy for
      // Mobile Web, so use the native implementation instead.
      var request;
      if('undefined' === typeof XMLHttpRequest) {
        request = Titanium.Network.createHTTPClient();
      }
      else {
        request = new XMLHttpRequest();
      }
      request.open(method, url);
      request.timeout = options.timeout;

      // Pass headers to request.
      for(var name in options.headers) {
        if(options.headers.hasOwnProperty(name)) {
          request.setRequestHeader(name, options.headers[name]);
        }
      }

      // Attach handlers.
      request.onload = function() {
        // Success implicates status 2xx (Successful), or 304 (Not Modified).
        if(2 === parseInt(this.status / 100, 10) || 304 === this.status) {
          options.success(this.responseText, { network: true });
        }
        else {
          options.error(this.responseText, { network: true });
        }
      };
      request.onabort = request.onerror = request.ontimeout = function(event) {
        options.error(event.type, { network: true });
      };

      // Fire request.
      request.send(body);
    };

    // Attach to context.
    return function() {
      this._base64 = base64;
      this._getAuth = getAuth;
      this._getDeviceInfo = getDeviceInfo;
      this._send = send;
      this._xhr = xhr;
      return this;
    };
  }());

}());