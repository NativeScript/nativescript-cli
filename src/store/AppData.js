(function() {

  /*globals btoa, XMLHttpRequest, window*/

  // Define the Kinvey.Store.AppData class.
  Kinvey.Store.AppData = Base.extend({
    // Path constants.
    HOST: '<%= pkg.hostname %>',
    APPDATA_API: 'appdata',
    USER_API: 'user',

    // Default options.
    options: {
      timeout: 10000//ms
    },

    /**
     * Constructor.
     * 
     * @name Kinvey.Store.AppData
     * @constructor
     * @param {string} collection
     * @param {Object} [options]
     */
    constructor: function(collection, options) {
      this.api = this.USER_API === collection ? this.USER_API : this.APPDATA_API;
      this.collection = collection;

      options && this.configure(options);
    },

    /** @lends Kinvey.Store.AppData# */

    /**
     * Aggregates entities from the store.
     * 
     * @param {Object} aggregation
     * @param {Object} options
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
     * @param {Object} options
     */
    configure: function(options) {
      options.timeout && (this.options.timeout = options.timeout);
    },

    /**
     * Logs in user.
     * 
     * @param {Object} object
     * @param {Object} options
     */
    login: function(object, options) {
      // Construct URL.
      var url = this._getUrl({ id: 'login' });

      // Send request.
      this._send('POST', url, JSON.stringify(object), options);
    },

    /**
     * Queries the store for a specific entity.
     * 
     * @param {string} id
     * @param {Object} options
     */
    query: function(id, options) {
      // Construct URL.
      var url = this._getUrl({ id: id });

      // Send request.
      this._send('GET', url, null, options);
    },

    /**
     * Queries the store for multiple entities.
     * 
     * @param {Object} query
     * @param {Object} options
     */
    queryWithQuery: function(query, options) {
      // Construct URL.
      var url = this._getUrl({ query: query.toJSON() });

      // Send request.
      this._send('GET', url, null, options);
    },

    /**
     * Removes entity from the store.
     * 
     * @param {Object} object
     * @param {Object} options
     */
    remove: function(object, options) {
      // Construct URL.
      var url = this._getUrl({ id: object._id });

      // Send request.
      this._send('DELETE', url, null, options);
    },

    /**
     * Removes multiple entities from the store.
     * 
     * @param {Object} query
     * @param {Object} options
     */
    removeWithQuery: function(query, options) {
       // Construct URL.
      var url = this._getUrl({ query: query.toJSON() });

      // Send request.
      this._send('DELETE', url, null, options);
    },

    /**
     * Saves entity to the store.
     * 
     * @param {Object} object
     * @param {Object} options
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
     * @param {*} value
     * @return {string}
     */
    _encode: function(value) {
      if(value instanceof Object) {
        value = JSON.stringify(value);
      }
      return encodeURIComponent(value);
    },

    /**
     * Returns authorization.
     * 
     * @return {string}
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
     * Constructs URL.
     * 
     * @private
     * @param {Object} parts
     * @return {string} URctStoreNames.contains(c)) {L.
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
      // by adding a cache bursting query string.
      param.push('_=' + new Date().getTime());

      return url + '?' + param.join('&');
    },

    /**
     * Sends the request.
     * 
     * @private
     * @param {string} method
     * @param {string} url
     * @param {string} body
     * @param {Object} options
     */
    _send: function(method, url, body, options) {
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

      // Apply options.
      request.timeout = this.options.timeout;

      // Set headers.
      var headers = {
        Accept: 'application/json, text/javascript',
        Authorization: 'Basic ' + btoa(this._getAuth())
      };
      body && (headers['Content-Type'] = 'application/json; charset=UTF-8');

      // Add header for compatibility with Android 2.2, 2.3.3 and 3.2.
      // @link http://stackoverflow.com/questions/9146491/ajax-get-request-with-authorization-header-and-cors-on-android-2-3-3
      if('GET' === method && window && window.location) {
        headers['X-Kinvey-Origin'] = window.location.protocol + '//' + window.location.host;
      }

      // Pass headers to request.
      for(var name in headers) {
        request.setRequestHeader(name, headers[name]);
      }

      // Attach request response handler.
      request.onload = function() {
        // Response is expected to be either empty, or valid JSON.
        var response = this.responseText && JSON.parse(this.responseText);

        // Success implicates status 2xx (Successful), or 304 (Not Modified).
        if(2 === parseInt(this.status / 100, 10) || 304 === this.status) {
          options.success(response);
        }
        else {
          options.error(response);
        }
      };

      // Define request error handlers.
      request.onabort = request.onerror = request.ontimeout = function(event) {
        var error = {
          abort: 'The request was aborted',
          error: 'The request failed',
          timeout: 'The request timed out'
        };
        var msg = error[event.type] || error.error;

        // Execute application-level handler.
        options.error({
          error: msg,
          message: msg
        });
      };

      // Fire request.
      request.send(body);
    }
  });

}());