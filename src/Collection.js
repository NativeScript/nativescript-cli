(function() {

  // Define the Kinvey Collection class.
  Kinvey.Collection = Base.extend({
    // Associated Kinvey API.
    API: Kinvey.Net.APPDATA_API,

    // Mapped entity class.
    entity: Kinvey.Entity,

    // List of entities.
    list: [ ],

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
     * @throws {Error} On empty name.
     */
    constructor: function(name) {
      if(null == name) {
        throw new Error('Name must not be null');
      }
      this.name = name;
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
      net.send(bind(this, function(response) {
        bind(this, success)(response.count);
      }), bind(this, failure));
    },

    /**
     * Fetches entities in collection.
     * 
     * @param {Kinvey.Query} [query] Filter object.
     * @param {function()} [success] Success callback. {this} is the collection
     *          instance.
     * @param {function(Object)} [failure] Failure callback. {this} is the
     *          collection instance. Only argument is an error object.
     */
    fetch: function(query, success, failure) {
      // Parse arguments.
      if(!(query instanceof Kinvey.Query)) {// no filter.
        success = query;
        failure = success;
        query = null;
      }

      // Clear list.
      this.list = [ ];

      // Send request.
      var net = Kinvey.Net.factory(this.API, this.name);
      net.setQuery(query);
      net.send(bind(this, function(response) {
        response.forEach(bind(this, function(attr) {
          this.list.push(new this.entity(this.name, attr));
        }));
        bind(this, success)();
      }), bind(this, failure));
    }
  });

}());