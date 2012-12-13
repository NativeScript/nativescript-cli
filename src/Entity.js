(function() {

  // Assign unique id to every object, so we can save circular references.
  var objectId = 0;

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
      this.attr = attr || {};
      this.collection = collection;
      this.metadata = null;

      // Options.
      options || (options = {});
      this.store = Kinvey.Store.factory(options.store, this.collection, options.options);

      // Assign object id.
      this.__objectId = ++objectId;
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
      this.store.remove(this.toJSON(true), merge(options, {
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
          // Maintain collection store type and configuration.
          var opts = { store: this.store.name, options: this.store.options };

          // Resolve references, and update attributes.
          this.attr = Kinvey.Entity._resolve(this.map, response, options.resolve, opts);
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
      this._saveReferences(merge(options, {
        success: bind(this, function(outAttr) {
          this.store.save(this.toJSON(true), merge(options, {
            success: bind(this, function(response, info) {
              // Replace flat references with real objects. outAttr is an
              // array containing fields to replace with the replacement object.
              while(outAttr[0]) {
                var resolve = outAttr.shift();
                var segments = resolve.attr.split('.');
                var doc = response;

                // Descent in doc and look for segment.
                while(segments[0]) {
                  var field = segments.shift();

                  // If the path is not fully traversed, continue.
                  if(segments[0]) {
                    doc = doc[field];
                  }
                  else {// Replace field value with replacement object.
                    doc[field] = resolve.obj;
                  }
                }
              }

              // Update attributes.
              this.attr = response;
              this.metadata = null;// Reset.
              options.success && options.success(this, info);
            })
          }));
        }),
        error: options.error
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
     * @param {boolean} [doNotFlatten] If false, returns entity using reference syntax.
     * @returns {Object} JSON representation.
     */
    toJSON: function(doNotFlatten) {
      if(true === doNotFlatten) {
        // stringify and then parse again, so all attributes are actually plain
        // JSON. Otherwise, references will still be Kinvey.Entity-s.
        var result = JSON.parse(JSON.stringify(this.attr));
        this.metadata && (result._acl = this.metadata.toJSON()._acl);
        return result;
      }

      // Flatten entity by returning it in reference syntax.
      return {
        _type: 'KinveyRef',
        _collection: this.collection,
        _id: this.getId()
      };
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
     * Saves references.
     * 
     * @private
     * @param {Object} options
     * @param {function(outAttr)} options.success Success callback.
     * @param {function(error, info)} options.error Failure callback.
     * @param {Array} __obj List of objects already saved.
     */
    _saveReferences: function(options) {
      // To be able to save circular references, track already saved objects.
      var saved = options.__obj || [];

      // outAttr contains the path and replacement object of a reference.
      var outAttr = [];

      // To check for references, check each and every attribute.
      var stack = [];
      Object.keys(this.attr).forEach(function(attr) {
        if(this.attr[attr] instanceof Object) {
          stack.push({ attr: attr, doc: this.attr[attr] });
        }
      }, this);

      // Define function to check a single item in the stack. If a reference
      // is found, save it (asynchronously).
      var saveSingleReference = function() {
        // If there is more to check, do that first.
        if(stack[0]) {
          var item = stack.shift();
          var attr = item.attr;
          var doc = item.doc;// Always an object.

          // doc is an object. First case: doc is an entity.
          if(doc instanceof Kinvey.Entity) {
            // If entity is already saved, it is referenced circularly. In that
            // case, add it to outAttr directly and skip saving it again.
            if(-1 !== saved.indexOf(doc.__objectId)) {
              outAttr.push({ attr: attr, obj: doc });
              return saveSingleReference();// Proceed.
            }

            // Save doc.
            saved.push(doc.__objectId);
            doc.save(merge(options, {
              success: function(obj) {
                outAttr.push({ attr: attr, obj: obj });
                saveSingleReference();// Proceed.
              },
              error: options.error,
              __obj: saved// Pass tracking.
            }));
          }

          // Second case: doc is an array. Only immediate references are saved.
          else if(doc instanceof Array) {
            // Instead of calling a function for every member, filter array so
            // only references remain.
            var refs = [];
            for(var i in doc) {
              if(doc[i] instanceof Kinvey.Entity) {
                refs.push({ index: i, doc: doc[i] });
              }
            }

            // Define function to save the found references in the array.
            var saveArrayReference = function(i) {
              // If there is more to check, do that first.
              if(i < refs.length) {
                var index = refs[i].index;
                var member = refs[i].doc;

                // If entity is already saved, it is referenced circularly.
                // In that case, add it to outAttr directly and skip saving
                // it again.
                if(-1 !== saved.indexOf(member.__objectId)) {
                  outAttr.push({ attr: attr + '.' + index, obj: member });
                  return saveArrayReference(++i);// Proceed.
                }

                // Save member.
                saved.push(member.__objectId);
                member.save(merge(options, {
                  success: function(obj) {
                    outAttr.push({ attr: attr + '.' + index, obj: obj });
                    saveArrayReference(++i);// Proceed.
                  },
                  error: options.error,
                  __obj: saved// Pass tracking.
                }));
              }

              // Otherwise, array is traversed.
              else {
                saveSingleReference();// Proceed.
              }
            };
            saveArrayReference(0);// Trigger.
          }

          // Third and last case: doc is a plain object.
          else {
            // Check each and every attribute by adding them to the stack.
            Object.keys(doc).forEach(function(cAttr) {
              if(doc[cAttr] instanceof Object) {
                stack.push({ attr: attr + '.' + cAttr, doc: doc[cAttr] });
              }
            });
            saveSingleReference();// Proceed.
          }
        }

        // Otherwise, stack is empty and thus all references are saved.
        else {
          options.success(outAttr);
        }
      };
      saveSingleReference();// Trigger.
    }
  }, {
    /** @lends Kinvey.Entity */

    /**
     * Resolves references in attr according to entity definition.
     *
     * @private
     * @param {Object} map Entity mapping.
     * @param {Object} attr Attributes.
     * @param {Array} [resolve] Fields to resolve.
     * @param {Object} [options] Options.
     * @return {Object} Relational data structure.
     */
    _resolve: function(map, attr, resolve, options) {
      resolve = resolve ? resolve.slice(0) : [];// Copy by value.

      // Parse to be resolved references one-by-one. If there are no references,
      // there is no performance penalty :)
      while(resolve[0]) {
        var path = resolve.shift();
        var segments = path.split('.');
        var doc = attr;

        // Track path for entity mapping purposes.
        var currentPath = '';
        var currentMap = map;

        // Descent in doc and look for segment.
        while(segments[0]) {
          // (Top-level) field name of doc.
          var field = segments.shift();
          currentPath += (currentPath ? '.' : '') + field;
          var ClassDef = currentMap[currentPath] || Kinvey.Entity;

          // Check and resolve top-level reference. Otherwise: descent deeper.
          if(doc.hasOwnProperty(field) && null != doc[field]) {// doc does have field.
            // First case: field is a (resolved) reference.
            if('KinveyRef' === doc[field]._type || doc[field] instanceof Kinvey.Entity) {
              if('KinveyRef' === doc[field]._type) {// Unresolved reference.
                // Resolve only if actual object is embedded, or the to-be-resolved
                // reference is a attribute of the currently found reference.
                if(segments[0] || doc[field]._obj) {
                  // The actual object may not be embedded, so we need to set
                  // the object id explicitly (otherwise, save() will fail). 
                  var id = doc[field]._id;
                  doc[field] = new ClassDef(doc[field]._obj, doc[field]._collection, options);
                  doc[field].setId(id);
                }
                else {// The desired resolve doesn’t have its object embedded.
                  break;
                }
              }

              // Current path and map are to be reset relative to the new entity.
              currentPath = '';
              currentMap = doc[field].map;
              doc = doc[field].attr;
            }

            // Second case: field is an array.
            else if(doc[field] instanceof Array) {
              // Only immediate members will be checked are resolved.
              for(var i in doc[field]) {
                var member = doc[field][i];
                if(member && 'KinveyRef' === member._type && member._obj) {
                  doc[field][i] = new ClassDef(member._obj, member._collection, options);
                }
              }
            }

            // Third and last case: field is a plain object.
            else {
              doc = doc[field];
            }
          }
          else {// doc does not have field; skip reference.
            break;
          }
        }
      }

      // Attributes now contain all resolved references.
      return attr;
    }
  });

}());