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
      this.collection = collection;
      this.metadata = null;

      // Options.
      options || (options = {});
      this.store = Kinvey.Store.factory(options.store, this.collection, options.options);

      // Parse attributes.
      this.attr = attr ? this._parseAttr(attr) : {};

      // State (used by save()).
      this._pending = false;
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

      // Refuse to save circular references.
      if(this._pending && options._ref) {
        this._pending = false;// Reset.
        options.error({
          error: Kinvey.Error.OPERATION_DENIED,
          message: 'Circular reference detected, aborting save',
          debug: ''
        }, {});
        return;
      }
      this._pending = true;

      // Save children first.
      this._saveAttr(this.attr, {
        success: bind(this, function(references) {
          // All children are saved, save parent.
          this.store.save(this.toJSON(), merge(options, {
            success: bind(this, function(response, info) {
              this._pending = false;// Reset.

              // Merge response with response of children.
              this.attr = merge(this._parseAttr(response), references);
              this.metadata = null;// Reset.

              options.success && options.success(this, info);
            }),
            error: bind(this, function(error, info) {
              this._pending = false;// Reset.
              options.error && options.error(error, info);
            })
          }));
        }),

        // One of the children failed, break on error.
        error: bind(this, function(error, info) {
          this._pending = false;// Reset.
          options.error && options.error(error, info);
        }),

        // Flag to detect any circular references. 
        _ref: true
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
    toJSON: function(name) {
      // Flatten references.
      var result = this._flattenAttr(this.attr);// Copy by value.
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
     * Flattens attribute value.
     * 
     * @private
     * @param {*} value Attribute value.
     * @returns {*}
     */
    _flatten: function(value) {
      if(value instanceof Object) {
        if(value instanceof Kinvey.Entity) {// Case 1: value is a reference.
          value = {
            _type: 'KinveyRef',
            _collection: value.collection,
            _id: value.getId()
          };
        }
        else if(value instanceof Array) {// Case 2: value is an array.
          // Flatten all members.
          value = value.map(bind(this, function(x) {
            return this._flatten(x);
          }));
        }
        else {
          value = this._flattenAttr(value);// Case 3: value is an object.
        }
      }
      return value;
    },

    /**
     * Flattens attributes.
     * 
     * @private
     * @param {Object} attr Attributes.
     * @returns {Object} Flattened attributes.
     */
    _flattenAttr: function(attr) {
      var result = {};
      Object.keys(attr).forEach(bind(this, function(name) {
        result[name] = this._flatten(attr[name]);
      }));
      return result;
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
        if(value instanceof Kinvey.Entity) { }// Skip.
        else if('KinveyRef' === value._type) {// Case 1: value is a reference.
          // Create object from reference if embedded, otherwise skip.
          if(value._obj) {
            var Entity = this.map[name] || Kinvey.Entity;// Use mapping if defined.

            // Maintain store type and configuration.
            var opts = { store: this.store.type, options: this.store.options };
            value = new Entity(value._obj, value._collection, opts);
          }
        }
        else if(value instanceof Array) {// Case 2: value is an array.
          // Loop through and parse all members.
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
      var result = merge(attr);// Copy by value.
      Object.keys(attr).forEach(bind(this, function(name) {
        result[name] = this._parse((prefix ? prefix + '.' : '') + name, attr[name]);
      }));
      return result;
    },
    
    /**
     * Saves an attribute value.
     * 
     * @private
     * @param {*} value Attribute value.
     * @param {Object} options Options.
     */
    _save: function(value, options) {
      if(value instanceof Object) {
        if(value instanceof Kinvey.Entity) {// Case 1: value is a reference.
          return value.save(options);
        }
        if(value instanceof Array) {// Case 2: value is an array.
          // Save every element in the array (serially), and update in place.
          var i = 0;

          // Define save handler.
          var save = bind(this, function() {
            var item = value[i];
            item ? this._save(item, merge(options, {
              success: function(response) {
                value[i++] = response;// Update.
                save();// Advance.
              }
            })) : options.success(value);
          });

          // Trigger.
          return save();
        }

        // Case 3: value is an object.
        return this._saveAttr(value, options);
      }

      // Case 4: value is a scalar.
      options.success(value);
    },

    /**
     * Saves attributes.
     * 
     * @private
     * @param {Object} attr Attributes.
     * @param {Object} options Options.
     */
    _saveAttr: function(attr, options) {
      // Save attributes serially.
      var attrs = Object.keys(attr);
      var i = 0;

      // Define save handler.
      var save = bind(this, function() {
        var name = attrs[i++];
        name ? this._save(attr[name], merge(options, {
          success: function(response) {
            attr[name] = response;// Update.
            save();// Advance.
          }
        })) : options.success(attr);
      });

      // Trigger.
      save();
    }
  });

}());