(function() {

  /*globals btoa, navigator, XMLHttpRequest, window*/

  // Define the Kinvey.Store.AppData class.
  Kinvey.Store.AppData = Base.extend({
    // Path constants.
    HOST: '<%= pkg.hostname %>',
    APPDATA_API: 'appdata',
    USER_API: 'user',

    // Default options.
    options: {
      error: function() { },
      success: function() { },
      timeout: 10000//ms
    },

    /**
     * Creates a new store.
     * 
     * @name Kinvey.Store.AppData
     * @constructor
     * @param {string} collection Collection name.
     * @param {Object} [options] Options.
     */
    constructor: function(collection, options) {
      this.api = this.USER_API === collection ? this.USER_API : this.APPDATA_API;
      this.collection = collection;

      // Options.
      options && this.configure(options);
    },

    /** @lends Kinvey.Store.AppData# */

    /**
     * Aggregates objects from the store.
     * 
     * @param {Object} aggregation Aggregation.
     * @param {Object} [options] Options.
     */
    aggregate: function(aggregation, options) {
      // Construct URL.
      var url = this._getUrl({ id: '_group' });

      // Send request.
      this._send('POST', url, JSON.stringify(aggregation), options);
    },

    /**
     * Configures store.
     * 
     * @param {Object} options Options.
     * @param {function(response, info)} [options.success] Success callback.
     * @param {function(error, info)} [options.error] Failure callback.
     * @param {integer} [options.timeout] Request timeout (in milliseconds).
     */
    configure: function(options) {
      options.error && (this.options.error = options.error);
      options.success && (this.options.success = options.success);
      'undefined' !== typeof options.timeout && (this.options.timeout = options.timeout);
    },

    /**
     * Logs in user.
     * 
     * @param {Object} object
     * @param {Object} [options] Options.
     */
    login: function(object, options) {
      // Construct URL.
      var url = this._getUrl({ id: 'login' });

      // Send request.
      this._send('POST', url, JSON.stringify(object), options);
    },

    /**
     * Queries the store for a specific object.
     * 
     * @param {string} id Object id.
     * @param {Object} [options] Options.
     */
    query: function(id, options) {
      // Construct URL.
      var url = this._getUrl({ id: id });

      // Send request.
      this._send('GET', url, null, options);
    },

    /**
     * Queries the store for multiple objects.
     * 
     * @param {Object} query Query object.
     * @param {Object} [options] Options.
     */
    queryWithQuery: function(query, options) {
      // Construct URL.
      var url = this._getUrl({ query: query });

      // Send request.
      this._send('GET', url, null, options);
    },

    /**
     * Removes object from the store.
     * 
     * @param {Object} object Object to be removed.
     * @param {Object} [options] Options.
     */
    remove: function(object, options) {
      // Construct URL.
      var url = this._getUrl({ id: object._id });

      // Send request.
      this._send('DELETE', url, null, options);
    },

    /**
     * Removes multiple objects from the store.
     * 
     * @param {Object} query Query object.
     * @param {Object} [options] Options.
     */
    removeWithQuery: function(query, options) {
       // Construct URL.
      var url = this._getUrl({ query: query });

      // Send request.
      this._send('DELETE', url, null, options);
    },

    /**
     * Saves object to the store.
     * 
     * @param {Object} object Object to be saved.
     * @param {Object} [options] Options.
     */
    save: function(object, options) {
      // Set request method and construct URL.
      var method = object._id ? 'PUT' : 'POST';
      var url = this._getUrl({ id: object._id });

      // Send request.
      this._send(method, url, JSON.stringify(object), options);
    },

    /**
     * Encodes value for use in query string.
     * 
     * @private
     * @param {*} value Value to be encoded.
     * @return {string} Encoded value.
     */
    _encode: function(value) {
      if(value instanceof Object) {
        value = JSON.stringify(value);
      }
      return encodeURIComponent(value);
    },

    /**
     * Returns authorization string.
     * 
     * @private
     * @return {string} Authorization string.
     */
    _getAuth: function() {
      // Use master secret if specified.
      if(null !== Kinvey.masterSecret) {
        return Kinvey.appKey + ':' + Kinvey.masterSecret;
      }

      // Use user credentials if specified, use app secret as last resort.
      var user = Kinvey.getCurrentUser();
      if(null === user) {
        return Kinvey.appKey + ':' + Kinvey.appSecret;
      }
      return user.getUsername() + ':' + user.getPassword();
    },

    /**
     * Returns device information.
     * 
     * @private
     * @return {string} Device information.
     */
    _getDeviceInfo: function() {
      // Try the most common browsers, fall back to navigator.appName otherwise.
      var ua = navigator.userAgent.toLowerCase();

      var rChrome = /(chrome)\/([\w]+)/;
      var rSafari = /(safari)\/([\w.]+)/;
      var rFirefox = /(firefox)\/([\w.]+)/;
      var rOpera = /(opera)(?:.*version)?[ \/]([\w.]+)/;
      var rIE = /(msie) ([\w.]+)/i;

      var browser = rChrome.exec(ua) || rSafari.exec(ua) || rFirefox.exec(ua) || rOpera.exec(ua) || rIE.exec(ua) || [ ];

      // Build device information.
      // Example: "linux chrome 18 0".
      return [
        navigator.platform,
        browser[1] || navigator.appName,
        browser[2] || 0,
        0 // always set device ID to 0.
      ].map(function(value) {
        return value.toString().toLowerCase().replace(' ', '_');
      }).join(' ');
    },

    /**
     * Constructs URL.
     * 
     * @private
     * @param {Object} parts URL parts.
     * @return {string} URL.
     */
    _getUrl: function(parts) {
      var url = this.HOST + '/' + this.api + '/' + Kinvey.appKey + '/';

      // Only the appdata API has explicit collections.
      if(this.APPDATA_API === this.api && null != this.collection) {
        url += this.collection + '/';
      }
      parts.id && (url += parts.id);

      // Build query string.
      var param = [];
      if(null != parts.query) {
        // Required query parts.
        param.push('query=' + this._encode(parts.query.query || {}));

        // Optional query parts.
        parts.query.limit && param.push('limit=' + this._encode(parts.query.limit));
        parts.query.skip && param.push('skip=' + this._encode(parts.query.skip));
        parts.query.sort && param.push('sort=' + this._encode(parts.query.sort));
      }

      // Android < 4.0 caches all requests aggressively. For now, work around
      // by adding a cache busting query string.
      param.push('_=' + new Date().getTime());

      return url + '?' + param.join('&');
    },

    /**
     * Sends the request.
     * 
     * @private
     * @param {string} method Request method.
     * @param {string} url Request URL.
     * @param {string} body Request body.
     * @param {Object} options Options.
     */
    _send: function(method, url, body, options) {
      options || (options = {});
      options.error || (options.error = this.options.error);
      options.success || (options.success = this.options.success);
      'undefined' !== typeof options.timeout || (options.timeout = this.options.timeout);

      // For now, include authorization in this adapter. Ideally, it should
      // have some external interface.
      if(null === Kinvey.getCurrentUser() && this.APPDATA_API === this.api && null === Kinvey.masterSecret) {
        return Kinvey.User.create({}, {
          success: bind(this, function() {
            this._send(method, url, body, options);
          }),
          error: options.error
        });
      }

      // Create the request.
      var request = new XMLHttpRequest();
      request.open(method, url, true);
      request.timeout = options.timeout;

      // Set headers.
      var headers = {
        Accept: 'application/json, text/javascript',
        Authorization: 'Basic ' + btoa(this._getAuth()),
        'X-Kinvey-API-Version': Kinvey.API_VERSION,
        'X-Kinvey-Device-Information': this._getDeviceInfo()
      };
      body && (headers['Content-Type'] = 'application/json; charset=utf-8');

      // Add header for compatibility with Android 2.2, 2.3.3 and 3.2.
      // @link http://www.kinvey.com/blog/item/179-how-to-build-a-service-that-supports-every-android-browser
      if('GET' === method && window && window.location) {
        headers['X-Kinvey-Origin'] = window.location.protocol + '//' + window.location.host;
      }

      // Pass headers to request.
      for(var name in headers) {
        if(headers.hasOwnProperty(name)) {
          request.setRequestHeader(name, headers[name]);
        }
      }

      // Attach request response handler.
      request.onload = function() {
        // Response is expected to be either empty, or valid JSON.
        var response = this.responseText && JSON.parse(this.responseText);

        // Success implicates status 2xx (Successful), or 304 (Not Modified).
        if(2 === parseInt(this.status / 100, 10) || 304 === this.status) {
          options.success(response, { network: true });
        }
        else {
          options.error(response, { network: true });
        }
      };

      // Define request error handlers.
      request.onabort = request.onerror = request.ontimeout = function(event) {
        var error = {
          abort: 'The request was aborted',
          error: 'The request failed',
          timeout: 'The request timed out'
        };
        var description = error[event.type] || error.error;

        // Execute application-level handler.
        options.error({
          code: Kinvey.Error.REQUEST_FAILED,
          description: description,
          debug: ''
        }, { network: true });
      };

      // Fire request.
      request.send(body);
    }
  });

}());