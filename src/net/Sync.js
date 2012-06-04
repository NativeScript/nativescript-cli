(function() {

  // Define the Kinvey.Net.Sync network adapter.
  Kinvey.Net.Sync = Base.extend({
    operation: Kinvey.Net.READ,
    constructor: function(api, collection,id) {
      this.api = api;
      this.collection = collection;
      this.id = id;

      this.local = new Kinvey.Net.Local(api, collection, id);
      this.remote = new Kinvey.Net.Http(api, collection, id);
    },
    send: function(options) {
      options || (options = { });
      options.success || (options.success = function() { });
      options.error || (options.error = function() { });

      var oncomplete = bind(this, function() {
        this.remote.send({
          success: bind(this, function(response) {
            options.success(response);

            if(Kinvey.Net.READ === this.operation && null != this.collection) {
              if(!(response instanceof Array)) {
                response = [response];
              }
              response.forEach(bind(this, function(entity) {
                this.local.setOperation(Kinvey.Net.UPDATE);
                this.local.setData(entity);
                this.local.send();
              }));
            }
          }),
          error: bind(this, function(error) {
            options.error(error);

            if(Kinvey.Net.READ === this.operation && null != this.collection) {
              this.local.setOperation(Kinvey.Net.DELETE);
              this.local.id = this.id;
              this.local.send();
            }
          })
        });
      });

      if(Kinvey.Net.READ === this.operation) {
        this.local.send({
          success: function() {
            options.success.apply(this, arguments);
  
            oncomplete();
          },
          error: oncomplete
        });
      }
      else {
        oncomplete();
      }
    },
    setData: function(data) {
      this.local.setData(data);
      this.remote.setData(data);
    },
    setOperation: function(operation) {
      this.operation = operation;
      this.local.setOperation(operation);
      this.remote.setOperation(operation);
    },
    setQuery: function(query) {
      this.local.setQuery(query);
      this.remote.setQuery(query);
    }
  });

}());