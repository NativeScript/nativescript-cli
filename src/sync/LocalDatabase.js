(function() {

  /*globals window*/

  // Grab native implementation.
  var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  var IDBTransaction = window.IDBTransaction || window.mozIDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;

  // Define the Database class.
  var LocalDatabase = Base.extend({
    /**
     * Creates a new database.
     * 
     * @name Kinvey.Database
     * @constructor
     * @param {string} name Database name.
     * @param {Object} [options]
     * @param {function(db)} [options.success] Success callback.
     * @param {function(error)} [options.error] Failure callback.
     * @throws {Error} On unsupported client.
     */
    constructor: function(name, options) {
      if('undefined' === typeof indexedDB) {
        throw new Error('indexedDB is not supported');
      }
      options || (options = {});
      this.name = name;

      // Open database.
      var request = indexedDB.open(this.name);
      request.onsuccess = bind(this, function() {
        // Save database handle.
        this.db = request.result;
        this.db.onversionchange = bind(this, function() {
          this.db.close();
        });
        options.success && options.success(this);
      });
      request.onerror = request.onblocked = function() {
        options.error && options.error({
          error: request.error,
          message: request.error
        });
      };
    },

    /** @lends LocalDatabase# */

    /**
     * Destroys entity.
     * 
     * @param {string} collection Collection.
     * @param {string} id Entity id.
     * @param {Object} [options]
     * @param {function()} [options.success] Success callback.
     * @param {function(error)} [options.error] Failure callback.
     */
    destroy: function(collection, id, options) {
      options || (options = {});
      options.success || (options.success = function() { });
      options.error || (options.error = function() { });

      // First pass; check whether collection exists.
      var c = this._collection(collection);
      if(!this.db.objectStoreNames.contains(c)) {
        options.success();
        return;
      }

      // Second pass, check whether entity exists.
      var store = this.db.transaction([c], IDBTransaction.READ_WRITE).objectStore(c);
      var tnx = store['delete'](id);
      tnx.onsuccess = function() {
        options.success();
      };
      tnx.onerror = function() {
        options.error({
          error: tnx.error,
          message: tnx.error
        });
      };
    },

    /**
     * Loads entity by id.
     * 
     * @param {string} collection Collection.
     * @param {string} id Entity id.
     * @param {Object} [options]
     * @param {function(entity)} [options.success] Success callback.
     * @param {function(error)} [options.error] Failure callback.
     */
    load: function(collection, id, options) {
      options || (options = {});
      options.success || (options.success = function() { });
      options.error || (options.error = function() { });

      // First pass; check whether collection exists.
      var c = this._collection(collection);
      if(!this.db.objectStoreNames.contains(c)) {
        // Collection does not exist, so neither does the entity.
        options.error({
          error: 'Not found',
          message: 'Not found'
        });
        return;
      }

      // Second pass, check whether entity exists.
      var store = this.db.transaction([c], IDBTransaction.READ_ONLY).objectStore(c);
      var tnx = store.get(id);
      tnx.onsuccess = tnx.onerror = function() {
        // success callback is also fired when entity is not found. Check here.
        null != tnx.result ? options.success(tnx.result) : options.error({
          error: tnx.error || 'Not found',
          message: tnx.error || 'Not found'
        });
      };
    },

    /**
     * Saves entity to collection.
     * 
     * @param {string} collection Collection.
     * @param {Object} entity Entity.
     * @param {Object} [options]
     * @param {function(entity)} [options.success] Success callback.
     * @param {function(error)} [options.error] Failure callback.
     */
    save: function(collection, entity, options) {
      options || (options = {});
      options.success || (options.success = function() { });
      options.error || (options.error = function() { });
  
      // First pass, create collection if not existant. This operation can only be
      // performed in a versionchange transaction.
      var c = this._collection(collection);
      if(!this.db.objectStoreNames.contains(c)) {
        // Create collection by incrementing the database version.
        this._migrate(bind(this, function() {
          this.db.createObjectStore(c, { keyPath: '_id' });
        }), {
          success: bind(this, function() {
            // Migration complete, proceed with saving the entity.
            this._save(collection, entity, options);
          }),
          error: options.error
        });
      }
      else {
        // Collection already exists, proceed with saving the entity instantly.
        this._save(collection, entity, options);
      }
    },

    /**
     * Returns formatted collection name. This is required because indexedDB does
     * not allow dashes in collection names. Replace with underscore instead.
     * 
     * @private
     * @param {string} collection
     * @return {string} Collection name.
     */
    _collection: function(collection) {
      return collection.replace('-', '_');
    },

    /**
     * Returns a generated id.
     * 
     * @private
     * @returns {string} Id.
     */
    _getId: function() {
      return new Date().getTime().toString();
    },

    /**
     * Migrates database by executing a command, which is supposed to alter the
     * databases schema.
     * 
     * @private
     * @param {function()} command Migrating command.
     * @param {Object} options
     * @param {function()} options.success Success callback.
     * @param {function(error)} options.error Failure callback.
     */
    _migrate: function(command, options) {
      // Increment version number by one.
      var version = parseInt(this.db.version || 0, 10) + 1;

      // An earlier version of the spec defined setVersion as the way to migrate.
      // Later versions however use an onupgradeneeded event. We support both.
      if(this.db.setVersion) {
        var verReq = this.db.setVersion(version);
        verReq.onsuccess = function() {
          command();
          options.success();
        };
        verReq.onerror = function() {
          options.error({
            error: verReq.error,
            message: verReq.error
          });
        };
      }
      else {
        // Reopen the database with a different version, and migrate when the
        // onupgradeneeded event is invoked.
        var request = indexedDB.open(this.name, version);
        request.onupgradeneeded = bind(this, function() {
          this.db = request.result;// refresh.
          command();
        });
        request.onsuccess = bind(this, function() {
          // onversionchange is called if another thread migrates the same
          // database. Avoid blocking by closing the database.
          this.db.onversionchange = bind(this, function() {
            this.db.close();
          });
          options.success();
        });
        request.onerror = request.onblocked = function() {
          options.error({
            error: request.error,
            message: request.error
          });
        };
      }
    },

    /**
     * Saves entity to collection. At this point, the collection exists.
     * 
     * @private
     * @param {string} collection Collection.
     * @param {Object} entity Entity.
     * @param {Object} options
     * @param {function(entity)} options.success Success callback.
     * @param {function(error)} options.error Failure callback.
     */
    _save: function(collection, entity, options) {
      var c = this._collection(collection);
      var store = this.db.transaction([c], IDBTransaction.READ_WRITE).objectStore(c);

      // If entity is new, generate an ID for it.
      if(null == entity._id) {
        entity._id = this._getId();
      }

      // Save to collection.
      var tnx = store.put(entity);
      tnx.onsuccess = function() {
        options.success(entity);
      };
      tnx.onerror = function() {
        options.error({
          error: tnx.error,
          message: tnx.error
        });
      };
    }
  });

}());