(function() {

  // Define the Kinvey Collection class.
  Kinvey.Collection = Base.extend({
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

      this.store = new Kinvey.Store.AppData(name);
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

      this.store.aggregate(aggregation, options);
    },

    /**
     * Clears collection.
     * 
     * @param {Object} [options]
     * @param {function()} [success] Success callback.
     * @param {function(error)} [error] Failure callback.
     */
    clear: function(options) {
      options || (options = {});

      this.store.removeWithQuery(this.query, {
        success: bind(this, function() {
          this.list = [];
          options.success && options.success(this);
        }),
        error: function(error) {
          options.error && options.error(error);
        }
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
     *     console.log('Count failed', error.message);
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

      var aggregation = new Kinvey.Aggregation();
      aggregation.setInitial({ count: 0 });
      aggregation.setReduce(function(doc, out) {
        out.count += 1;
      });

      this.store.aggregate(aggregation.toJSON(), {
        success: function(response) {
          options.success && options.success(response[0].count);
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

      // Send request.
      this.store.queryWithQuery(this.query, {
        success: bind(this, function(response) {
          this.list = [];
          response.forEach(bind(this, function(attr) {
            this.list.push(new this.entity(this.name, attr));
          }));
          options.success && options.success(this.list);
        }),
        error: function(error) {
          options.error && options.error(error);
        }
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
      this.query = query || new Kinvey.Query();
    }
  });

}());