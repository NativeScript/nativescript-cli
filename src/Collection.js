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
    if(null != query && !(query instanceof Kinvey.Query.SimpleQuery)) {
      throw new Error('Query must be an instance of Kinvey.Query.SimpleQuery');
    }

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
     * List of entities in collection
     * 
     * @private
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
    this.query = query || new Kinvey.Query.SimpleQuery();
  };

  // Methods
  extend(Kinvey.Collection.prototype, {
    /** @lends Kinvey.Collection# */

    /**
     * Adds filter criteria to collection query
     * 
     * @param {string} property property name
     * @param {string} operator one of Kinvey.Query operator constants
     * @param {*} value property value
     * @throws {Error} on empty property or empty operator
     */
    addFilterCriteria: function(property, operator, value) {
      if(null == property) {
        throw new Error('Property must not be null');
      }
      if(null == operator) {
        throw new Error('Operator must not be null');
      }
      this.query.addCriteria(property, operator, value);
    },

    /**
     * Fetches all entities in collection
     * 
     * @param {function([Array])} [success] success callback
     * @param {function([Object])} [failure] failure callback
     */
    all: function(success, failure) {
      this.clearFilterCriteria();
      this.fetch(success, failure);
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
    },

    /**
     * Removes all entities in collection. This operation is not atomic, should
     * be used with caution.
     * 
     * @param {function()} [success] success callback
     * @param {function(Object)} [failure] failure callback
     */
    removeAll: function(success, failure) {
      var self = this;// context

      // Retrieve all entities first
      this.all(function() {
        // If collection is already empty, return immediately
        if(0 === self.list.length) {
          success && success();
          return;
        }

        // Collection not empty, remove one by one and track status
        var i = self.list.length;
        var updateStatus = function() {
          // On every update, an item is removed. When all items are
          // removed, success callback is triggered.
          if(0 === --i) {
            success && success();
          }
        };

        // Remove entities one by one. Failures are not caught.
        self.list.forEach(function(entity) {
          entity.remove(updateStatus);
        });
      }, function(error) {
        failure && failure(error);
      });
    },

    /**
     * Creates entity from JSON data
     * 
     * @private
     * @param {Object} map
     * @return {Kinvey.Entity}
     */
    _toEntity: function(map) {
      return new Kinvey.Entity(this.name, map);
    }
  });

}(Kinvey));