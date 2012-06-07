(function() {

  // Define the Kinvey Entity class.
  Kinvey.Entity = Base.extend({
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

      this.store = new Kinvey.Store.AppData(this.collection);
    },

    /** @lends Kinvey.Entity# */

    /**
     * Destroys entity.
     * 
     * @param {Object} [options]
     * @param {function()} [options.success] Success callback.
     * @param {function(error)} [options.error] Failure callback.
     */
    destroy: function(options) {
      options || (options = {});

      this.store.remove(this.toJSON(), {
        success: function() {
          options.success && options.success();
        },
        error: function(error) {
          options.error && options.error(error);
        }
      });
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
     * @param {Object} [options]
     * @param {function(entity)} [options.success] Success callback.
     * @param {function(error)} [options.error] Failure callback.
     * @throws {Error} On empty id.
     */
    load: function(id, options) {
      if(null == id) {
        throw new Error('Id must not be null');
      }
      options || (options = {});

      // Retrieve data.
      this.store.query(id, {
        success: bind(this, function(response) {
          this.attr = response;
          options.success && options.success(this);
        }),
        error: function(error) {
          options.error && options.error(error);
        }
      });
    },

    /**
     * Saves entity.
     * 
     * @param {Object} [options]
     * @param {function(entity)} [options.success] Success callback.
     * @param {function(error)} [options.error] Failure callback.
     */
    save: function(options) {
      options || (options = {});

      this.store.save(this.toJSON(), {
        success: bind(this, function(response) {
          this.attr = response;
          options.success && options.success(this);
        }),
        error: function(error) {
          options.error && options.error(error);
        }
      });
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