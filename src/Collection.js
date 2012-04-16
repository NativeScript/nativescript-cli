(function() {

  // Define the Kinvey Collection class.
  Kinvey.Collection = Base.extend({
    // Associated Kinvey API.
    API: Kinvey.Net.APPDATA_API,

    // List of entities.
    list: [ ],

    // Mapped entity class.
    map: Kinvey.Entity,

    /**
     * Creates new collection.
     * 
     * @example <code>
     * var collection = new Kinvey.Collection('my-collection');
     * </code>
     * 
     * @constructor
     * @name Kinvey.Collection
     * @param {string} name Collection name.
     * @param {Kinvey.Query} [query] Query.
     * @throws {Error}
     *           <ul>
     *           <li>On empty name,</li>
     *           <li>On invalid query instance.</li>
     *           </ul>
     */
    constructor: function(name, query) {
      if(null == name) {
        throw new Error('Name must not be null');
      }
      if(query && !(query instanceof Kinvey.Query)) {
        throw new Error('Query must be an instanceof Kinvey.Query');
      }
      this.name = name;
      this.query = query;
    },

    /** @lends Kinvey.Collection# */

    /**
     * Clears collection. This method is NOT atomic, it stops on first failure.
     * 
     * @param {function()} [success] Success callback. {this} is the collection
     *          instance.
     * @param {function(Object)} [failure] Failure callback. {this} is the
     *          collection instance. Only argument is an error object.
     */
    clear: function(success, failure) {
      failure = bind(this, failure);
      this.list = [ ];// clear list

      // Retrieve all entities, and remove them one by one.
      this.fetch(bind(this, function() {
        var it = bind(this, function() {
          var entity = this.list[0];
          if(entity) {
            entity.destroy(bind(this, function() {
              this.list.shift();
              it();
            }), failure);
          }
          else {
            bind(this, success)();
          }
        });
        it();
      }), failure);
    },

    /**
     * Counts number of entities.
     * 
     * @param {function(number)} [success] Success callback. {this} is the
     *          Collection instance. Only argument is the number of entities.
     * @param {function(Object)} [failure] Failure callback. {this} is the
     *          Collection instance. Only argument is an error object.
     */
    count: function(success, failure) {
      var net = Kinvey.Net.factory(this.API, this.name, '_count');
      this.query && net.setQuery(this.query);// set query
      net.send(bind(this, function(response) {
        bind(this, success)(response.count);
      }), bind(this, failure));
    },

    /**
     * Fetches entities in collection.
     * 
     * @param {function()} [success] Success callback. {this} is the collection
     *          instance.
     * @param {function(Object)} [failure] Failure callback. {this} is the
     *          collection instance. Only argument is an error object.
     */
    fetch: function(success, failure) {
      // Clear list.
      this.list = [ ];

      // Send request.
      var net = Kinvey.Net.factory(this.API, this.name);
      this.query && net.setQuery(this.query);// set query
      net.send(bind(this, function(response) {
        response.forEach(bind(this, function(attr) {
          this.list.push(new this.map(this.name, attr));
        }));
        bind(this, success)();
      }), bind(this, failure));
    }
  });

}());