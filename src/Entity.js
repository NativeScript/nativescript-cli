(function(Kinvey) {

  /**
   * Creates new entity
   * 
   * @example
   * 
   * <pre>
   * var entity = new Kinvey.Entity('my-collection');
   * var entity = new Kinvey.Entity('my-collection', {
   *   property: 'value'
   * });
   * </pre>
   * 
   * @constructor
   * @param {string} collection entity collection
   * @param {Object} [map] entity data
   * @throws {Error} on empty collection
   */
  Kinvey.Entity = function(collection, map) {
    if(null == collection) {
      throw new Error('Collection must not be null');
    }

    // Constants
    /**
     * Collection API
     * 
     * @private
     * @constant
     */
    this.API = Kinvey.Net.APPDATA_API;

    // Key constant
    this.KEY_ID = '_id';

    // Properties
    /**
     * Entity collection
     * 
     * @private
     * @type string
     */
    this.collection = collection;

    /**
     * Entity data
     * 
     * @private
     * @type Object
     */
    this.map = null != map ? map : {};
  };

  // Methods
  extend(Kinvey.Entity.prototype, {
    /** @lends Kinvey.Entity# */

    /**
     * Finds entity by property/value
     * 
     * @param {string} property entity property
     * @param {*} value property value
     * @param {function()} [success] success callback
     * @param {function([Object])} [failure] failure callback
     * @throws {Error} on empty property or empty value
     */
    findBy: function(property, value, success, failure) {
      if(null == property) {
        throw new Error('Property must not be null');
      }
      if(null == value) {
        throw new Error('Value must not be null');
      }
      var self = this;// context

      // Construct query for property/value specification
      // TODO add limit 1
      var query = new Kinvey.Query.SimpleQuery();
      query.addCriteria(property, Kinvey.Query.EQUAL, value);

      // Create request and add query
      var net = Kinvey.Net.factory(this.API, this.collection);
      net.setQuery(query);

      // Send request
      net.send(Kinvey.Net.READ, function(data) {
        if(0 === data.length) {// no results
          failure && failure({
            error: 'not found'
          });
          return;
        }

        // Apply data to entity and fire callback
        self.map = data[0];
        success && success();
      }, function(error) {
        failure && failure(error);
      });
    },

    /**
     * Returns entity id or null if not set
     * 
     * @return {string} id
     */
    getId: function() {
      return this.getValue(this.KEY_ID);
    },

    /**
     * Returns entity property value or null if not set
     * 
     * @param {string} key property key
     * @throws {Error} on empty key
     * @return {*} property value
     */
    getValue: function(key) {
      if(null == key) {
        throw new Error('Key must not be null');
      }

      // Find property, and return its value
      var value = this.map[key];
      return null != value ? value : null;
    },

    /**
     * Loads entity by id
     * 
     * @param {string} id entity id
     * @param {function()} [success] success callback
     * @param {function([Object])} [failure] failure callback
     * @throws {Error} on empty id
     */
    load: function(id, success, failure) {
      if(null == id) {
        throw new Error('Id must not be null');
      }
      var self = this;// context

      // Send request
      var net = Kinvey.Net.factory(this.API, this.collection, id);
      net.send(Kinvey.Net.READ, function(data) {
        // Apply data to entity and fire callback
        self.map = data;
        success && success();
      }, function(error) {
        failure && failure(error);
      });
    },

    /**
     * Deletes entity
     * 
     * @param {function()} [success] success callback
     * @param {function([Object])} [failure] failure callback
     * @throws {Error} on empty id
     */
    remove: function(success, failure) {
      var id = this.getId();
      if(null == id) {
        throw new Error('Id must not be null');
      }

      // Send request and fire callbacks
      var net = Kinvey.Net.factory(this.API, this.collection, id);
      net.send(Kinvey.Net.DELETE, function() {
        success && success();
      }, function(error) {
        failure && failure(error);
      });
    },

    /**
     * Saves entity
     * 
     * @param {function()} [success] success callback
     * @param {function([Object])} [failure] failure callback
     */
    save: function(success, failure) {
      // If entity has an id, entity is updated. Otherwise, it is created.
      var id = this.getId(), operation = null != id ? Kinvey.Net.UPDATE
          : Kinvey.Net.CREATE;

      // Create request and include entity as body
      var net = Kinvey.Net.factory(this.API, this.collection, id);
      net.setData(this.map);

      // Send request and fire callbacks
      net.send(operation, function() {
        success && success();
      }, function(error) {
        failure && failure(error);
      });
    },

    /**
     * Sets entity id
     * 
     * @param {string} id entity id
     * @throws {Error} on empty id
     */
    setId: function(id) {
      if(null == id) {
        throw new Error('Id must not be null');
      }
      this.setValue(this.KEY_ID, id);
    },

    /**
     * Sets entity property
     * 
     * @param {string} key property key
     * @param {*} value property value
     * @throws {Error} on empty key
     */
    setValue: function(key, value) {
      if(null == key) {
        throw new Error('Key must not be null');
      }
      this.map[key] = value;
    }
  });

}(Kinvey));