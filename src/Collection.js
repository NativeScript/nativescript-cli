(function() {

  // Define the Kinvey Collection class.
  Kinvey.Collection = Base.extend({
    // Associated Kinvey API.
    API: Kinvey.Net.APPDATA_API,

    // List of entities.
    list: [ ],

    // Mapped entity class.
    entity: Kinvey.Entity,

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
      this.setQuery(query);
      this.name = name;
    },

    /** @lends Kinvey.Collection# */

    /**
     * Aggregates entities in collection.
     * 
     * @param {Kinvey.Aggregation} aggregation Aggregation object.
     * @param {Object} [options] Options.
     * @param {function(list)} [options.success] Success callback.
     * @param {function(error)} [options.error] Failure callback.
     */
    aggregate: function(aggregation, options) {
      if(!(aggregation instanceof Kinvey.Aggregation)) {
        throw new Error('Aggregation must be an instanceof Kinvey.Aggregation');
      }
      aggregation.setQuery(this.query);// respect collection query.

      var net = Kinvey.Net.factory(this.API, this.name, '_group');
      net.setData(aggregation);
      net.setOperation(Kinvey.Net.CREATE);
      net.send(options);
    },

    /**
     * Clears collection. This method is NOT atomic, it stops on first failure.
     * 
     * @param {Object} [options]
     * @param {function()} [success] Success callback.
     * @param {function(error)} [error] Failure callback.
     */
    clear: function(options) {
      options || (options = {});
      this.list = [ ];// clear list

      // Retrieve all entities, and remove them one by one.
      this.fetch({
        success: bind(this, function() {
          var iterator = bind(this, function() {
            var entity = this.list[0];
            if(entity) {
              entity.destroy({
                success: bind(this, function() {
                  this.list.shift();
                  iterator();
                }),
                error: options.error
              });
            }
            else {
              options.success && options.success();
            }
          });
          iterator();
        }),
        error: options.error
      });
    },

    /**
     * Counts number of entities.
     * 
     * @example <code>
     * var collection = new Kinvey.Collection('my-collection');
     * collection.count({
     *   success: function(i) {
     *    console.log('Number of entities: ' + i);
     *   },
     *   error: function(error) {
     *     console.log('Count failed', error.error);
     *   }
     * });
     * </code>
     * 
     * @param {Object} [options]
     * @param {function(number)} [success] Success callback.
     * @param {function(error)} [error] Failure callback.
     */
    count: function(options) {
      options || (options = {});

      var net = Kinvey.Net.factory(this.API, this.name, '_count');
      this.query && net.setQuery(this.query);// set query
      net.send({
        success: function(response) {
          options.success && options.success(response.count);
        },
        error: options.error
      });
    },

    /**
     * Fetches entities in collection.
     * 
     * @param {Object} [options]
     * @param {function(list)} [options.success] Success callback.
     * @param {function(error)} [options.error] Failure callback.
     */
    fetch: function(options) {
      options || (options = {});

      // Clear list.
      this.list = [ ];

      // Send request.
      var net = Kinvey.Net.factory(this.API, this.name);
      this.query && net.setQuery(this.query);// set query
      net.send({
        success: bind(this, function(response) {
          response.forEach(bind(this, function(attr) {
            this.list.push(new this.entity(this.name, attr));
          }));
          options.success && options.success(this.list);
        }),
        error: options.error
      });
    },

    /**
     * Sets query.
     * 
     * @param {Kinvey.Query} [query] Query.
     * @throws {Error} On invalid instance.
     */
    setQuery: function(query) {
      if(query && !(query instanceof Kinvey.Query)) {
        throw new Error('Query must be an instanceof Kinvey.Query');
      }
      this.query = query || null;
    }
  });

}());