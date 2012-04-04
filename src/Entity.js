(function(Kinvey) {

  /**
   * Creates new entity.
   * 
   * @example <code>
   * var entity = new Kinvey.Entity('my-collection');
   * var entity = new Kinvey.Entity('my-collection', {
   *   property: 'value'
   * });
   * </code>
   * 
   * @constructor
   * @param {string} collection Entity collection.
   * @param {Object} [prop] Entity data.
   * @throws {Error} On empty collection.
   */
  Kinvey.Entity = function(collection, prop) {
    if(null == collection) {
      throw new Error('Collection must not be null');
    }

    // Constants
    /**
     * Collection API.
     * 
     * @private
     * @constant
     */
    this.API = Kinvey.Net.APPDATA_API;

    // Key constant
    this.KEY_ID = '_id';

    // Properties
    /**
     * Entity collection.
     * 
     * @private
     * @type string
     */
    this.collection = collection;

    /**
     * Entity data.
     * 
     * @private
     * @type Object
     */
    this.prop = null != prop ? prop : {};
  };

  // Methods
  extend(Kinvey.Entity.prototype, {
    /** @lends Kinvey.Entity# */

    /**
     * Destroys entity.
     * 
     * @param {function()} [success] Success callback. {this} is the (destroyed)
     *          entity instance.
     * @param {function(Object)} [failure] Failure callback. {this} is the
     *          entity instance. Only argument is an error object.
     * @throws {Error} On empty id.
     */
    destroy: function(success, failure) {
      var id = this.getId();
      if(null == id) {
        throw new Error('Id must not be null');
      }

      // Build request
      var net = Kinvey.Net.factory(this.API, this.collection, id);
      net.send(Kinvey.Net.DELETE, bind(this, function() {
        bind(this, success)();
      }), bind(this, failure));
    },

    /**
     * Returns entity id or null if not set.
     * 
     * @return {string} id
     */
    getId: function() {
      return this.get(this.KEY_ID);
    },

    /**
     * Returns entity property value or null if not set.
     * 
     * @param {string} key Property key.
     * @throws {Error} On empty key.
     * @return {*} Property value.
     */
    get: function(key) {
      if(null == key) {
        throw new Error('Key must not be null');
      }

      // Find property, and return its value.
      var value = this.prop[key];
      return null != value ? value : null;
    },

    /**
     * Loads entity by id.
     * 
     * @param {string} id Entity id.
     * @param {function()} [success] Success callback. {this} is the entity
     *          instance.
     * @param {function(Object)} [failure] Failure callback. {this} is the
     *          entity instance. Only argument is an error object.
     * @throws {Error} On empty id.
     */
    load: function(id, success, failure) {
      if(null == id) {
        throw new Error('Id must not be null');
      }

      // Build request
      var net = Kinvey.Net.factory(this.API, this.collection, id);
      net.send(Kinvey.Net.READ, bind(this, function(response) {
        this.prop = response;
        bind(this, success)();
      }), bind(this, failure));
    },

    /**
     * Saves entity.
     * 
     * @param {function()} [success] Success callback. {this} is the entity
     *          instance.
     * @param {function(Object)} [failure] Failure callback. {this} is the
     *          entity instance. Only argument is an error object.
     */
    save: function(success, failure) {
      // If entity has an id, update it. Otherwise, create it.
      var id = this.getId();
      var operation = null != id ? Kinvey.Net.UPDATE : Kinvey.Net.CREATE;

      // Build request
      var net = Kinvey.Net.factory(this.API, this.collection, id);
      net.setData(this.prop);// include properties
      net.send(operation, bind(this, function(response) {
        this.prop = response;
        bind(this, success)();
      }), bind(this, failure));
    },

    /**
     * Sets entity id.
     * 
     * @param {string} id Entity id.
     * @throws {Error} On empty id.
     */
    setId: function(id) {
      if(null == id) {
        throw new Error('Id must not be null');
      }
      this.set(this.KEY_ID, id);
    },

    /**
     * Sets entity property.
     * 
     * @param {string} key Property key.
     * @param {*} value Property value.
     * @throws {Error} On empty key.
     */
    set: function(key, value) {
      if(null == key) {
        throw new Error('Key must not be null');
      }
      this.prop[key] = value;
    }
  });

}(Kinvey));