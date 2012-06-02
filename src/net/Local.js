(function() {

  // TODO exclude _count, _login etc.
  // TODO support for > 1 entity at the time (collections, queries etc.)
  // TODO make multi-tab proof, by handling onversionchange/onupgradeneeded better.

  // Define the Kinvey.Net.Local network adapter.
  Kinvey.Net.Local = Base.extend({
    data: null,
    operation: Kinvey.Net.READ,

    constructor: function(api, collection, id) {
      this.collection = collection;
      this.id = id;
    },

    send: function(options) {
      new LocalDatabase('Kinvey.' + Kinvey.appKey, {
        success: bind(this, function(database) {
          switch(this.operation) {
            case Kinvey.Net.CREATE:
            case Kinvey.Net.UPDATE:
              database.save(this.collection, this.data, options);
              break;
            case Kinvey.Net.READ:
              if(null == this.id) {
                throw new Error('An entity ID must be provided');
              }
              database.load(this.collection, this.id, options);
              break;
            case Kinvey.Net.DELETE:
              if(null == this.id) {
                throw new Error('An entity ID must be provided');
              }
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
    setQuery: function(query) { }
  });

}());