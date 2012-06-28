(function() {

  // Define the Kinvey Entity class.
  Kinvey.Entity = Base.extend({
    // Identifier attribute.
    ATTR_ID: '_id',

    /**
     * Creates a new entity.
     * 
     * @example <code>
     * var entity = new Kinvey.Entity({}, 'my-collection');
     * var entity = new Kinvey.Entity({ key: 'value' }, 'my-collection');
     * </code>
     * 
     * @name Kinvey.Entity
     * @constructor
     * @param {Object} [attr] Attribute object.
     * @param {string} collection Owner collection.
     * @param {Object} options
     * @throws {Error} On empty collection.
     */
    constructor: function(attr, collection, options) {
      if(null == collection) {
        throw new Error('Collection must not be null');
      }
      this.attr = attr || {};
      this.collection = collection;
      this.metadata = null;

      // Options
      options || (options = {});
      this.store = (options.store || Kinvey.Store.factory)(this.collection);
    },

    /** @lends Kinvey.Entity# */

    /**
     * Destroys entity.
     * 
     * @param {Object} [options]
     * @param {function(entity, info)} [options.success] Success callback.
     * @param {function(entity, error, info)} [options.error] Failure callback.
     */
    destroy: function(options) {
      options || (options = {});

      this.store.remove(this.toJSON(), {
        success: bind(this, function(_, info) {
          options.success && options.success(this, info);
        }),
        error: bind(this, function(error, info) {
          options.error && options.error(this, error, info);
        })
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
     * Returns metadata.
     * 
     * @return {Kinvey.Metadata} Metadata.
     */
    getMetadata: function() {
      // Lazy load metadata object, and return it.
      this.metadata || (this.metadata = new Kinvey.Metadata(this.attr));
      return this.metadata;
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
     * @param {function(entity, info)} [options.success] Success callback.
     * @param {function(entity, error, info)} [options.error] Failure callback.
     * @throws {Error} On empty id.
     */
    load: function(id, options) {
      if(null == id) {
        throw new Error('Id must not be null');
      }
      options || (options = {});

      this.store.query(id, {
        success: bind(this, function(response, info) {
          this.attr = response;
          this.metadata = null;// Reset.
          options.success && options.success(this, info);
        }),
        error: bind(this, function(error, info) {
          options.error && options.error(this, error, info);
        })
      });
    },

    /**
     * Saves entity.
     * 
     * @param {Object} [options]
     * @param {function(entity, info)} [options.success] Success callback.
     * @param {function(entity, error, info)} [options.error] Failure callback.
     */
    save: function(options) {
      options || (options = {});

      this.store.save(this.toJSON(), {
        success: bind(this, function(response, info) {
          this.attr = response;
          this.metadata = null;// Reset.
          options.success && options.success(this, info);
        }),
        error: function(error, info) {
          options.error && options.error(this, error, info);
        }
      });
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
     * Sets metadata.
     * 
     * @param {Kinvey.Metadata} metadata Metadata object.
     * @throws {Error} On invalid instance.
     */
    setMetadata: function(metadata) {
      if(metadata && !(metadata instanceof Kinvey.Metadata)) {
        throw new Error('Metadata must be an instanceof Kinvey.Metadata');
      }
      this.metadata = metadata || null;
    },

    /**
     * Returns JSON representation. Used by JSON#stringify.
     * 
     * @returns {Object} JSON representation.
     */
    toJSON: function() {
      var result = this.attr;

      // Add ACL metadata.
      this.metadata && (result._acl = this.metadata.toJSON()._acl);

      return result;
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