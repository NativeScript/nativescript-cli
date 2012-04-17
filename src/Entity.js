(function() {

  // Define the Kinvey Entity class.
  Kinvey.Entity = Base.extend({
    // Associated Kinvey API.
    API: Kinvey.Net.APPDATA_API,

    // Identifier attribute.
    ATTR_ID: '_id',

    /**
     * Creates a new entity.
     * 
     * @example <code>
     * var entity = new Kinvey.Entity('my-collection');
     * var entity = new Kinvey.Entity('my-collection', {
     *   key: 'value'
     * });
     * </code>
     * 
     * @name Kinvey.Entity
     * @constructor
     * @param {string} collection Owner collection.
     * @param {Object} [attr] Attribute object.
     * @throws {Error} On empty collection.
     */
    constructor: function(collection, attr) {
      if(null == collection) {
        throw new Error('Collection must not be null');
      }
      this.attr = attr || {};
      this.collection = collection;
    },

    /** @lends Kinvey.Entity# */

    /**
     * Destroys entity.
     * 
     * @param {function()} [success] Success callback. {this} is the (destroyed)
     *          entity instance.
     * @param {function(Object)} [failure] Failure callback. {this} is the
     *          entity instance. Only argument is an error object.
     */
    destroy: function(success, failure) {
      // Return instantly if entity is not saved yet.
      if(this.isNew()) {
        bind(this, success)();
        return;
      }

      // Send request.
      var net = Kinvey.Net.factory(this.API, this.collection, this.getId());
      net.setOperation(Kinvey.Net.DELETE);
      net.send(bind(this, function() {
        bind(this, success)();
      }), bind(this, failure));
    },

    /**
     * Returns attribute, or null if not set.
     * 
     * @param {string} key Attribute key.
     * @throws {Error} On empty key.
     * @return {*} Attribute.
     */
    get: function(key) {
      if(null == key) {
        throw new Error('Key must not be null');
      }

      // Return attribute, or null if attribute is null or undefined.
      var value = this.attr[key];
      return null != value ? value : null;
    },

    /**
     * Returns id or null if not set.
     * 
     * @return {string} id
     */
    getId: function() {
      return this.get(this.ATTR_ID);
    },

    /**
     * Returns whether entity is persisted.
     * 
     * @return {boolean}
     */
    isNew: function() {
      return null === this.getId();
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

      // Retrieve data.
      var net = Kinvey.Net.factory(this.API, this.collection, id);
      net.send(bind(this, function(response) {
        this.attr = response;
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
      var operation = this.isNew() ? Kinvey.Net.CREATE : Kinvey.Net.UPDATE;

      // Retrieve data.
      var net = Kinvey.Net.factory(this.API, this.collection, this.getId());
      net.setData(this.attr);// include attributes
      net.setOperation(operation);
      net.send(bind(this, function(response) {
        this.attr = response;
        bind(this, success)();
      }), bind(this, failure));
    },

    /**
     * Sets id.
     * 
     * @param {string} id Id.
     * @throws {Error} On empty id.
     */
    setId: function(id) {
      if(null == id) {
        throw new Error('Id must not be null');
      }
      this.set(this.ATTR_ID, id);
    },

    /**
     * Sets attribute.
     * 
     * @param {string} key Attribute key.
     * @param {*} value Attribute value.
     * @throws {Error} On empty key.
     */
    set: function(key, value) {
      if(null == key) {
        throw new Error('Key must not be null');
      }
      this.attr[key] = value;
    },

    /**
     * Returns JSON representation. Used by JSON#stringify.
     * 
     * @returns {Object} JSON representation.
     */
    toJSON: function() {
      return this.attr;
    },

    /**
     * Removes attribute.
     * 
     * @param {string} key Attribute key.
     */
    unset: function(key) {
      delete this.attr[key];
    }
  });

}());