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

      new LocalDatabase('Kinvey.' + Kinvey.appKey, {
        success: bind(this, function(database) {
          if(this.multi) {
            options.error && options.error({
              error: 'Complex operations are not supported',
              message: 'Complex operations are not supported'
            });
            return;
          }

          // Single entry, we support that.
          switch(this.operation) {
            case Kinvey.Net.CREATE:
            case Kinvey.Net.UPDATE:
              database.save(this.collection, this.data, options);
              break;
            case Kinvey.Net.READ:
              database.load(this.collection, this.id, options);
              break;
            case Kinvey.Net.DELETE:
              database.destroy(this.collection, this.id, options);
              break;
            default:
              throw new Error('Operation ' + this.operation + ' is not supported');
          }
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