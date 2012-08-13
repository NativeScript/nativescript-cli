(function() {

  // Define the Kinvey Entity class.
  Kinvey.Entity = Base.extend({
    // Identifier attribute.
    ATTR_ID: '_id',

    // Map.
    map: {},

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
     * @param {Object} options Options.
     * @throws {Error} On empty collection.
     */
    constructor: function(attr, collection, options) {
      if(null == collection) {
        throw new Error('Collection must not be null');
      }
      this.attr = attr ? this._parseAttr(attr) : {};
      this.collection = collection;
      this.metadata = null;

      // Options.
      options || (options = {});
      this.store = Kinvey.Store.factory(collection, options.store, options.options);
    },

    /** @lends Kinvey.Entity# */

    /**
     * Destroys entity.
     * 
     * @param {Object} [options]
     * @param {function(entity, info)} [options.success] Success callback.
     * @param {function(error, info)} [options.error] Failure callback.
     */
    destroy: function(options) {
      options || (options = {});
      this.store.remove(this.toJSON(), merge(options, {
        success: bind(this, function(_, info) {
          options.success && options.success(this, info);
        })
      }));
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
     * @param {function(error, info)} [options.error] Failure callback.
     * @throws {Error} On empty id.
     */
    load: function(id, options) {
      if(null == id) {
        throw new Error('Id must not be null');
      }
      options || (options = {});

      this.store.query(id, merge(options, {
        success: bind(this, function(response, info) {
          this.attr = this._parseAttr(response);
          this.metadata = null;// Reset.
          options.success && options.success(this, info);
        })
      }));
    },

    /**
     * Saves entity.
     * 
     * @param {Object} [options]
     * @param {function(entity, info)} [options.success] Success callback.
     * @param {function(error, info)} [options.error] Failure callback.
     */
    save: function(options) {
      options || (options = {});

      // Save references first, then save original.
      this._saveAttr(this.attr, bind(this, function() {
        this.store.save(this.toJSON(), merge(options, {
          success: bind(this, function(response, info) {
            this.attr = this._parseAttr(response);
            this.metadata = null;// Reset.
            options.success && options.success(this, info);
          })
        }));
      }));
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
      this.attr[key] = this._parse(key, value);
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
      // Flatten attributes.
      var result = this._flattenAttr(merge(this.attr));

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
    },

    /**
     * Flattens references in name/value pair.
     * 
     * @param {string} name Attribute name.
     * @param {*} value Attribute value.
     * @returns {*} Flattened value.
     */
    _flatten: function(name, value) {
      if(value instanceof Object) {
        if(value instanceof Kinvey.Entity) {// Case 1: value is a reference.
          value = {
            _type: 'KinveyRef',
            _collection: value.collection,
            _id: value.getId()
          };
        }
        else if(value instanceof Array) {// Case 2: value is an array.
          return value.map(bind(this, function(x) {
            return this._flatten(name, x);
          }));
        }
        else {// Case 3: value is an object.
          value = this._flattenAttr(value);
        }
      }
      return value;
    },

    /**
     * Flattens references in attributes.
     * 
     * @param {Object} attr Attributes.
     * @returns {Object} Flattened attributes.
     */
    _flattenAttr: function(attr) {
      Object.keys(attr).forEach(bind(this, function(name) {
        attr[name] = this._flatten(name, attr[name]);
      }));
      return attr;
    },

    /**
     * Parses references in name/value pair.
     * 
     * @private
     * @param {string} name Attribute name.
     * @param {*} value Attribute value.
     * @returns {*} Parsed value.
     */
    _parse: function(name, value) {
      if(value instanceof Object) {
        if('KinveyRef' === value._type) {// Case 1: value is a reference.
          // Create object from reference.
          if(value._obj) {
            var Entity = this.map[name] || Kinvey.Entity;// Mapping defined?
            value = new Entity(value._obj, value._collection);
          }
        }
        else if(value instanceof Array) {// Case 2: value is an array.
          // Loop through and parse every element.
          value = value.map(bind(this, function(x) {
            return this._parse(name, x);
          }));
        }
        else {// Case 3: value is an object.
          value = this._parseAttr(value, name);
        }
      }
      return value;
    },

    /**
     * Parses references in attributes.
     * 
     * @private
     * @param {Object} attr Attributes.
     * @param {string} [prefix] Name prefix.
     * @return {Object} Parsed attributes.
     */
    _parseAttr: function(attr, prefix) {
      Object.keys(attr).forEach(bind(this, function(name) {
        attr[name] = this._parse((prefix ? prefix + '.' : '') + name, attr[name]);
      }));
      return attr;
    },
    
    /**
     * Saves reference in name/value pair.
     * 
     * @private
     * @param {*} value Attribute value.
     * @param {function()} fn Complete callback.
     */
    _save: function(value, fn) {
      if(value instanceof Object) {
        // Case 1: value is a reference.
        if(value instanceof Kinvey.Entity) {
          return value.save({
            success: fn,
            error: fn
          });
        }

        // Case 2: value is an array.
        if(value instanceof Array) {
          // Loop through and save each element.
          var pending = value.length;
          return value.map(bind(this, function(x) {
            return this._save(x, function() {
              !--pending && fn();
            });
          }));
        }

        // Case 3: value is an object.
        return this._saveAttr(value, fn);
      }

      // Case 4: value is a scalar.
      return fn();
    },

    /**
     * Saves references in attributes.
     * 
     * @private
     * @param {Object} attr Attributes.
     * @param {function()} fn Complete callback.
     */
    _saveAttr: function(attr, fn) {
      // Loop through and save each attribute.
      var names = Object.keys(attr);
      var i = 0;
      var save = bind(this, function() {
        if(i < names.length) {// Save attribute.
          this._save(attr[names[i++]], save);
        }
        else {
          // No more attributes, fire complete callback.
          fn(attr);
        }
      });

      // Trigger.
      save();
    }
  });

}());