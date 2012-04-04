(function(Kinvey) {

  /**
   * Creates new collection
   * 
   * @example
   * 
   * <pre>
   * var collection = new Kinvey.Collection('my-collection');
   * </pre>
   * 
   * @constructor
   * @param {string} name collection name
   * @param {Kinvey.Query.SimpleQuery} [query] collection query
   * @throws {Error} on empty name or invalid query instance
   */
  Kinvey.Collection = function(name, query) {
    if(null == name) {
      throw new Error('Name must not be null');
    }
    // if(null != query && !(query instanceof Kinvey.Query.SimpleQuery)) {
    // throw new Error('Query must be an instance of Kinvey.Query.SimpleQuery');
    // }

    // Constants
    /**
     * Collection api
     * 
     * @private
     * @constant
     */
    this.API = Kinvey.Net.APPDATA_API;

    // Properties
    /**
     * Object owned by collection
     * 
     * @private
     * @type Object
     */
    this.entity = Kinvey.Entity;

    /**
     * List of entities in collection
     * 
     * @type Array
     */
    this.list = [ ];

    /**
     * Collection name
     * 
     * @private
     * @type string
     */
    this.name = name;

    /**
     * Collection query
     * 
     * @private
     * @type Kinvey.Query.SimpleQuery
     */
    // this.query = query || new Kinvey.Query.SimpleQuery();
  };

  // Methods
  extend(Kinvey.Collection.prototype, {
    /** @lends Kinvey.Collection# */

    // /**
    // * Adds filter criteria to collection query
    // *
    // * @param {string} property property name
    // * @param {string} operator one of Kinvey.Query operator constants
    // * @param {*} value property value
    // * @throws {Error} on empty property or empty operator
    // */
    // addFilterCriteria: function(property, operator, value) {
    // if(null == property) {
    // throw new Error('Property must not be null');
    // }
    // if(null == operator) {
    // throw new Error('Operator must not be null');
    // }
    // this.query.addCriteria(property, operator, value);
    // },
    /**
     * Fetches all entities in collection.
     * 
     * @param {function()} [success] Success callback. {this} is the collection
     *          instance.
     * @param {function(Object)} [failure] Failure callback. {this} is the
     *          collection instance. Only argument is an error object.
     */
    all: function(success, failure) {
      // Build request
      var net = Kinvey.Net.factory(this.API, this.name);
      net.send(Kinvey.Net.READ, bind(this, function(response) {
        for( var entity in response) {
          this.list.push(new this.entity(this.name, response[entity]));
        }
        bind(this, success)();
      }), bind(this, failure));
    },

    /**
     * Clears collection. This method is NOT atomic, it exits on first failure.
     * 
     * @param {function()} [success] Success callback. {this} is the collection
     *          instance.
     * @param {function(Object)} [failure] Failure callback. {this} is the
     *          collection instance. Only argument is an error object.
     */
    clear: function(success, failure) {
      failure = bind(this, failure);
      this.list = [];//clear list

      // Retrieve all entities, and remove them one by one.
      var self = this;
      this.all(function() {
        var it = function() {
          var entity = self.list[0];
          if(entity) {
            entity.destroy(function() {
              self.list.shift();
              it();
            }, failure);
          }
          else {
            bind(self, success)();
          }
        };
        it();
      }, failure);
    },

    /**
     * Clears filter criteria
     * 
     */
    clearFilterCriteria: function() {
      this.query.clear();
    },

    /**
     * Counts number of entities in collection
     * 
     * @param {function([number])} [success] success callback
     * @param {function([Object])} [failure] failure callback
     */
    count: function(success, failure) {
      // Create request and set query
      var net = Kinvey.Net.factory(this.API, this.name, '_count');
      net.setQuery(this.query);

      // Send request
      net.send(Kinvey.Net.READ, function(response) {
        success && success(response.count);
      }, function(error) {
        failure && failure(error);
      });
    },

    /**
     * Fetches entities in collection, based on query
     * 
     * @param {function(Array)} [success] success callback
     * @param {function(Object)} [failure] failure callback
     */
    fetch: function(success, failure) {
      var self = this;// context

      // Clear list
      this.list = [ ];

      // Create request and set query
      var net = Kinvey.Net.factory(this.API, this.name);
      net.setQuery(this.query);

      // Send request
      net.send(Kinvey.Net.READ, function(datalist) {
        // Convert datalist to list of entities and store them in list
        datalist.forEach(function(data) {
          self.list.push(self._toEntity(data));
        });
        success && success(self.list);
      }, function(error) {
        failure && failure(error);
      });
    }
  });

}(Kinvey));