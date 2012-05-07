(function() {

  /*globals btoa, navigator, XMLHttpRequest*/

  // Define the Kinvey.Net.Http network adapter.
  Kinvey.Net.Http = Base.extend({
    // Constants
    // Endpoints URLs.
    ENDPOINT: (function(base) {
      return {
        BASE: base,
        APPDATA: base + '/appdata',
        RESOURCE: base + '/resource',
        USER: base + '/user'
      };
    }('<%= pkg.hostname %>')),

    // Map CRUD operations to HTTP request methods.
    METHOD: (function(Net) {
      var map = {};
      var cached = map[Net.CREATE] = 'POST';
      map[Net.READ] = 'GET';
      map[Net.UPDATE] = 'PUT';
      map[Net.DELETE] = 'DELETE';
      return map;
    }(Kinvey.Net)),

    // Properties.
    data: null,
    headers: function() {
      return {
        Accept: 'application/json, text/javascript',
        'Content-Type': 'application/json; charset=utf-8'
      };
    },
    operation: Kinvey.Net.READ,
    query: null,

    /**
     * Creates a new HTTP network adapter.
     * 
     * @name Kinvey.Net.Http
     * @constructor
     * @param {string} api One of Kinvey.Net API constants.
     * @param {string} [collection] Collection name. Required when using the
     *          AppData API.
     * @param {string} [id] Entity id.
     * @throws {Error}
     *           <ul>
     *           <li>On invalid api,</li>
     *           <li>On undefined collection.</li>
     *           </ul>
     */
    constructor: function(api, collection, id) {
      if(null == api) {
        throw new Error('API must not be null');
      }
      switch(api) {
        case Kinvey.Net.APPDATA_API:
          if(null == collection) {
            throw new Error('Collection must not be null');
          }
          break;
        case Kinvey.Net.USER_API:
          break;
        default:
          throw new Error('API ' + api + ' is not supported');
      }

      this.api = api;
      this.collection = collection;
      this.id = id;
    },

    /** @lends Kinvey.Net.Http# */

    /**
     * Sends request.
     * 
     * @param {function(Object)} success Success callback. Only argument is a
     *          response object.
     * @param {function(Object)} failure Failure callback. Only argument is an
     *          error object.
     * @throws {Error} On unsupported client.
     */
    send: function(options) {
      options || (options = {});
      options.success || (options.success = function() { });
      options.error || (options.error = function() { });

      // A current user is required for all but the User API, unless the master
      // secret is specified.
      if(null === Kinvey.getCurrentUser() && Kinvey.Net.USER_API !== this.api && null === Kinvey.masterSecret) {
        Kinvey.User.init({
          success: bind(this, function() {
            this._process(options);
          }),
          error: options.error
        });
        return;
      }

      // There is a current user already, or the User API is requested.
      this._process(options);
    },

    /**
     * Sets data.
     * 
     * @param {Object} data JSON object.
     */
    setData: function(data) {
      this.data = data;
    },

    /**
     * Sets operation.
     * 
     * @param {string} operation Operation.
     * @throws {Error} On invalid operation.
     */
    setOperation: function(operation) {
      if(null == this.METHOD[operation]) {
        throw new Error('Operation ' + operation + ' is not supported');
      }
      this.operation = operation;
    },

    /**
     * Sets query.
     * 
     * @param {Kinvey.Query} query Query object.
     * @throws {Error} On invalid instance.
     */
    setQuery: function(query) {
      if(!(query instanceof Kinvey.Query)) {
        throw new Error('Query must be of instance Kinvey.Query');
      }
      this.query = query;
    },

    /**
     * Encodes a value, so that it can be safely used as part of the query
     * string.
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
     * Returns plain authorization value.
     * 
     * @private
     * @return {string} Authorization value.
     */
    _getAuth: function() {
      // Use master secret if specified.
      if(null !== Kinvey.masterSecret) {
        return Kinvey.appKey + ':' + Kinvey.masterSecret;
      }

      // Use user credentials if specified, use app secret as last resort.
      var currentUser = Kinvey.getCurrentUser();
      if(null !== currentUser) {
        return currentUser.getUsername() + ':' + currentUser.getPassword();
      }
      return Kinvey.appKey + ':' + Kinvey.appSecret;
    },

    /**
     * Returns device information.
     * 
     * @private
     * @return {string} Device information
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
     * Builds URL.
     * 
     * @private
     * @return {string} URL.
     */
    _getUrl: function() {
      var url = '';

      // Build path.
      switch(this.api) {
        case Kinvey.Net.APPDATA_API:
          url = this.ENDPOINT.APPDATA + '/' + Kinvey.appKey + '/' + this.collection;
          if(null != this.id) {
            url += '/' + this.id;
          }
          break;
        case Kinvey.Net.USER_API:
          // User API does not have a collection.
          url = this.ENDPOINT.USER + '/' + Kinvey.appKey + '/';
          if(null != this.id) {
            url += this.id;
          }
          break;
      }

      // Build query string.
      if(null != this.query) {
        var param = [ ];

        // Fill param with all query string parameters.
        var parts = this.query.toJSON();
        parts.limit && param.push('limit=' + this._encode(parts.limit));
        parts.skip && param.push('skip=' + this._encode(parts.skip));
        parts.sort && param.push('sort=' + this._encode(parts.sort));
        parts.query && param.push('query=' + this._encode(parts.query));

        // Append parts to URL.
        url += '?' + param.join('&');
      }
      return url;
    },

    /**
     * Parses HTTP response.
     * 
     * @private
     * @param {number} statusCode Status code.
     * @param {string} body Response body.
     * @param {Object} options
     * @param {function(response)} options.success Success callback.
     * @param {function(error)} options.error Failure callback.
     */
    _handleResponse: function(statusCode, body, options) {
      // Parse body. Failing to parse body is not a big deal.
      try {
        body = JSON.parse(body);
      }
      catch(_) { }

      // Fire callback.
      if((200 <= statusCode && 300 > statusCode) || 304 === statusCode) {
        options.success(body);
      }
      else {
        // Copy error message to message attribute as a convenience.
        body.error && (body.message = body.error);
        options.error(body);
      }
    },

    /**
     * Processes and fires HTTP request.
     * 
     * @private
     * @param {Object} options
     * @param {function(response)} options.success Success callback.
     * @param {function(error)} options.error Failure callback.
     */
    _process: function(options) {
      if('undefined' === typeof XMLHttpRequest) {
        throw new Error('XMLHttpRequest is not supported');
      }

      // Create client and build request.
      var request = new XMLHttpRequest();
      request.open(this.METHOD[this.operation], this._getUrl(), true);

      // Add headers.
      var headers = this.headers();
      headers.Authorization = 'Basic ' + btoa(this._getAuth());
      headers['X-Kinvey-Device-Information'] = this._getDeviceInfo();
      for( var header in headers) {
        request.setRequestHeader(header, headers[header]);
      }

      // Handle response.
      var self = this;
      request.onerror = function() {
        // Unfortunately, no error message is provided by XHR.
        options.error({
          error: 'Unknown error',
          message: 'Unknown error'
        });
      };
      request.onload = function() {
        self._handleResponse(this.status, this.responseText, options);
      };

      // Fire request.
      var data = this.data ? JSON.stringify(this.data) : null;
      request.send(data);
    }
  });

}());