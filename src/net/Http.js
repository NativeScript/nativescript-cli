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
     * @throws {Error} On invalid api, undefined collection.
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

      // Create client.
      var request = new XMLHttpRequest();
      request.open(this.METHOD[this.operation], this._buildEndpoint(), true);

      // Add headers.
      for( var header in this.headers) {
        request.setRequestHeader(header, this.headers[header]);
      }

      // Add authorization.
      var auth;
      if(null !== deviceUser) {
        auth = deviceUser.getUsername() + ':' + deviceUser.getPassword();
      }
      else {
        auth = Kinvey.appKey + ':' + Kinvey.appSecret;
      }
      request.setRequestHeader('Authorization', 'Basic ' + btoa(auth));

      // Set callbacks.
      request.onabort = request.onerror = request.ontimeout = function() {
        failure && failure({
          error: 'Error'
        });
        request.onabort = request.onerror = request.ontimeout = null;
      };
      request.onload = function() {
        // Determine request success.
        var callback;
        if(200 <= this.status && 300 > this.status || 304 === this.status) {
          callback = success;
        }
        else {
          callback = failure;
        }

        // Parse response
        var response;
        try {
          response = '' !== this.responseText ? JSON.parse(this.responseText)
              : this.responseText;
        }
        catch(_) {
          callback = failure;
          response = {
            error: 'Error parsing response'
          };
        }

        // Trigger
        callback && callback(response);
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
    _buildEndpoint: function() {
      var url;
      switch(this.api) {
        case Kinvey.Net.APPDATA_API:
          url = this.ENDPOINT.APPDATA + '/' + Kinvey.appKey + '/' + this.collection;
          if(null != this.id) {
            url += '/' + this.id;
          }
          break;
        case Kinvey.Net.USER_API:
          url = this.ENDPOINT.USER + '/' + Kinvey.appKey + '/';
          if(null != this.id) {
            url += this.id;
          }
          break;
      }

      // Append query string
      if(null != this.query) {
        var query = this.query.toJSON();
        var param = [];
        if(query.limit) {
          param.push('limit=' + encodeURIComponent(query.limit));
        }
        if(query.skip) {
          param.push('skip=' + encodeURIComponent(query.skip));
        }
        if(query.sort) {
          param.push('sort=' + encodeURIComponent(JSON.stringify(query.sort)));
        }
        if(query.query) {
          param.push('query=' + encodeURIComponent(JSON.stringify(query.query)));
        }
        url += '?' + param.join('&');
      }
      return url;
    }
  });

}());