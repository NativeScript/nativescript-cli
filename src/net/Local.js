(function() {

  // TODO support for > 1 entity at the time (collections, queries etc.).
  // TODO make multi-tab proof, by handling onversionchange/onupgradeneeded better.
  // TODO decide on user management when local.

  // Define the Kinvey.Net.Local network adapter.
  Kinvey.Net.Local = Base.extend({
    data: null,
    operation: Kinvey.Net.READ,
    query: null,

    constructor: function(api, collection, id) {
      this.api = api;
      this.collection = collection;
      this.id = id;
    },

    send: function(options) {
      options || (options = {});

      // Define callback to invoke when request is not supported.
      var unsupported = function() {
        options.error({
          error: 'This request is not supported',
          message: 'This request is not supported'
        });
      };

      // _<id> requests are not supported.
      if(this.id && 0 === this.id.indexOf('_')) {
        unsupported();
        return;
      }

      new LocalDatabase('Kinvey.' + Kinvey.appKey, {
        success: bind(this, function(database) {
          switch(this.operation) {
            case Kinvey.Net.CREATE:
            case Kinvey.Net.UPDATE:
              if(Kinvey.Net.APPDATA_API === this.api) {
                return database.save(this.collection, this.data, options);
              }
              break;
            case Kinvey.Net.READ:
              if('' !== this.collection) {
                if(null != this.id) {
                  return database.load(this.collection, this.id, options);
                }
                return database.fetch(this.collection, this.query, options);
              }
              return database.ping(options);
            case Kinvey.Net.DELETE:
              if(Kinvey.Net.APPDATA_API === this.api) {
                if(null != this.id) {
                  return database.destroy(this.collection, this.id, options);
                }
                return database.clear(this.collection, this.query, options);
              }
              break;
            default:
              throw new Error('Operation ' + this.operation + ' is not supported');
          }

          // If code reaches this point, the request is not supported.
          unsupported();
        }),
        error: options.error
      });
    },

    setData: function(data) {
      this.data = data;
    },
    setOperation: function(operation) {
      this.operation = operation;
    },
    setQuery: function(query) {
      if(query && !(query instanceof Kinvey.Query)) {
        throw new Error('Query must be an instanceof Kinvey.Query');
      }
      this.query = query;
    }
  });

}());