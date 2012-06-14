(function() {

  // Define the Kinvey Collection class.
  Kinvey.Collection = Base.extend({
    // List of entities.
    list: [],

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
     * @param {Object} [options] Options.
     * @throws {Error}
     *           <ul>
     *           <li>On empty name,</li>
     *           <li>On invalid query instance.</li>
     *           </ul>
     */
    constructor: function(name, options) {
      if(null == name) {
        throw new Error('Name must not be null');
      }
      this.name = name;

      // Options
      options || (options = {});
      this.setQuery(options.query || new Kinvey.Query());
      this.store = (options.store || Kinvey.Store.factory)(this.name);
    },

    /** @lends Kinvey.Collection# */

    /**
     * Aggregates entities in collection.
     * 
     * @param {Kinvey.Aggregation} aggregation Aggregation object.
     * @param {Object} [options] Options.
     * @param {function(collection, aggregation, info)} [options.success] Success callback.
     * @param {function(collection, error, info)} [options.error] Failure callback.
     */
    aggregate: function(aggregation, options) {
      if(!(aggregation instanceof Kinvey.Aggregation)) {
        throw new Error('Aggregation must be an instanceof Kinvey.Aggregation');
      }
      options || (options = {});

      aggregation.setQuery(this.query);// respect collection query.
      this.store.aggregate(aggregation.toJSON(), {
        success: bind(this, function(response, info) {
          options.success && options.success(this, response, info);
        }),
        error: bind(this, function(error, info) {
          options.error && options.error(this, error, info);
        })
      });
    },

    /**
     * Clears collection.
     * 
     * @param {Object} [options]
     * @param {function(collection, info)} [success] Success callback.
     * @param {function(collection, error, info)} [error] Failure callback.
     */
    clear: function(options) {
      options || (options = {});

      this.store.removeWithQuery(this.query.toJSON(), {
        success: bind(this, function(_, info) {
          this.list = [];
          options.success && options.success(this, info);
        }),
        error: bind(this, function(error, info) {
          options.error && options.error(this, error, info);
        })
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
     * @param {function(collection, count, info)} [success] Success callback.
     * @param {function(collection, error, info)} [error] Failure callback.
     */
    count: function(options) {
      options || (options = {});

      var aggregation = new Kinvey.Aggregation();
      aggregation.setInitial({ count: 0 });
      aggregation.setReduce(function(doc, out) {
        out.count += 1;
      });

      this.store.aggregate(aggregation.toJSON(), {
        success: function(response, info) {
          options.success && options.success(this, response[0].count, info);
        },
        error: function(error, info) {
          options.error && options.error(this, error, info);
        }
      });
    },

    /**
     * Fetches entities in collection.
     * 
     * @param {Object} [options]
     * @param {function(collection, list, info)} [options.success] Success callback.
     * @param {function(collection, error, info)} [options.error] Failure callback.
     */
    fetch: function(options) {
      options || (options = {});

      // Send request.
      this.store.queryWithQuery(this.query.toJSON(), {
        success: bind(this, function(response, info) {
          this.list = [];
          response.forEach(bind(this, function(attr) {
            this.list.push(new this.entity(attr, this.name));
          }));
          options.success && options.success(this, this.list, info);
        }),
        error: bind(this, function(error, info) {
          options.error && options.error(this, error, info);
        })
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