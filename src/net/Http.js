/*globals btoa, XMLHttpRequest*/
(function() {

  // Define the Kinvey.Net.Http network adapter.
  Kinvey.Net.Http = Base.extend({
    // Constants
    // Map CRUD operations to HTTP request methods.
    METHOD: (function(Net) {
      var map = {};
      map[Net.CREATE] = 'POST';
      map[Net.READ] = 'GET';
      map[Net.UPDATE] = 'PUT';
      map[Net.DELETE] = 'DELETE';
      return map;
    }(Kinvey.Net)),

    // Endpoints URLs.
    ENDPOINT: (function(base) {
      return {
        BASE: base,
        APPDATA: base + '/appdata',
        RESOURCE: base + '/resource',
        USER: base + '/user'
      };
    }('https://baas.kinvey.com')),

    // Properties
    data: null,
    headers: {
      Accept: 'application/json, text/javascript',
      'Content-Type': 'application/json; charset=utf-8'
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
    send: function(success, failure) {
      if('undefined' === typeof XMLHttpRequest) {
        throw new Error('XMLHttpRequest is not supported');
      }

      // Create client and build request.
      var request = new XMLHttpRequest();
      request.open(this.METHOD[this.operation], this._getUrl(), true);

      // Add headers.
      for( var header in this.headers) {
        request.setRequestHeader(header, this.headers[header]);
      }
      request.setRequestHeader('Authorization', 'Basic ' + btoa(this._getAuth()));

      // Handle response.
      var self = this;
      request.onerror = function() {
        // Unfortunately, no error message is provided by XHR.
        failure({ error: 'Error' });
      };
      request.onload = function() {
        self._handleResponse(this.status, this.responseText, success, failure);
      };

      // Fire request.
      var data = this.data ? JSON.stringify(this.data) : null;
      request.send(data);
    },

    /**
     * Sets data
     * 
     * @param {Object} data JSON object.
     */
    setData: function(data) {
      this.data = data;
    },

    /**
     * Sets operation
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
     */
    setQuery: function(query) {
      this.query = query;
    },

    /**
     * @private
     */
    _encode: function(value) {
      if(value instanceof Object) {
        value = JSON.stringify(value);
      }
      return encodeURIComponent(value);
    },

    /**
     * @private
     */
    _getAuth: function() {
      if(null !== deviceUser) {
        return deviceUser.getUsername() + ':' + deviceUser.getPassword();
      }
      return Kinvey.appKey + ':' + Kinvey.appSecret;
    },

    /**
     * @private
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
     * @private
     */
    _handleResponse: function(statusCode, body, success, failure) {
      // Parse body. Failing to parse body is not a big deal.
      try {
        body = JSON.parse(body);
      }
      catch(_) {
      }

      // Fire callback.
      (200 <= statusCode && 300 > statusCode) || 304 === statusCode ? success(body)
          : failure(body);
    }
  });

}());