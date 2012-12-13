(function() {

  // Grab database implementation.
  var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || {};

  // Define the Database class.
  var Database = Base.extend({
    /**
     * Creates a new database.
     * 
     * @name Database
     * @constructor
     * @private
     * @param {string} collection Collection name.
     */
    constructor: function(collection) {
      this.name = 'Kinvey.' + Kinvey.appKey;// Unique per app.
      this.collection = collection;
    },

    /** @lends Database# */

    // As a convenience, implement the store interface.

    /**
     * Aggregates objects in database.
     * 
     * @param {Object} aggregation Aggregation object.
     * @param {Object} [options]
     */
    aggregate: function(aggregation, options) {
      options = this._options(options);

      // Open transaction.
      this._transaction(Database.AGGREGATION_STORE, Database.READ_ONLY, bind(this, function(txn) {
        // Retrieve aggregation.
        var key = this._getKey(aggregation);
        var req = txn.objectStore(Database.AGGREGATION_STORE).get(key);

        // Handle transaction status.
        txn.oncomplete = function() {
          // If result is null, return an error.
          var result = req.result;
          if(result) {
            options.success(result.response, { cached: true });
          }
          else {
            options.error(Kinvey.Error.DATABASE_ERROR, 'Aggregation is not in database.');
          }
        };
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.DATABASE_ERROR, txn.error || 'Failed to execute transaction.');
        };
      }), options.error);
    },

    /**
     * Queries the database for a specific object.
     * 
     * @param {string} id Object id.
     * @param {Object} [options]
     */
    query: function(id, options) {
      options = this._options(options);

      // Open transaction.
      this._transaction(this.collection, Database.READ_ONLY, bind(this, function(txn) {
        // Retrieve object.
        var req = txn.objectStore(this.collection).get(id);

        // Handle transaction status.
        txn.oncomplete = bind(this, function() {
          // If result is null, return a not found error.
          var result = req.result;
          if(result) {
            // Resolve references before returning.
            this._resolve(result, options.resolve, function() {
              options.success(result, { cached: true });
            });
          }
          else {
            options.error(Kinvey.Error.ENTITY_NOT_FOUND, 'This entity could not be found.');
          }
        });
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.DATABASE_ERROR, txn.error || 'Failed to execute transaction.');
        };
      }), options.error);
    },

    /**
     * Queries the database for multiple objects.
     * 
     * @param {Object} query Query object.
     * @param {Object} [options]
     */
    queryWithQuery: function(query, options) {
      options = this._options(options);

      // Open transaction.
      this._transaction([this.collection, Database.QUERY_STORE], Database.READ_ONLY, bind(this, function(txn) {
        // Prepare response.
        var response = [];

        // Retrieve query.
        var key = this._getKey(query);
        var req = txn.objectStore(Database.QUERY_STORE).get(key);
        req.onsuccess = bind(this, function() {
          var result = req.result;
          if(result) {
            // Open store.
            var store = txn.objectStore(this.collection);

            // Retrieve objects.
            result.response.forEach(function(id, i) {
              var req = store.get(id);
              req.onsuccess = function() {
                response[i] = req.result;// Insert in order.
              };
            });
          }
        });

        // Handle transaction status.
        txn.oncomplete = bind(this, function() {
          if(req.result) {
            // Remove undefined (non-existant objects) array members.
            response = response.filter(function(value) {
              return 'undefined' !== typeof value;
            });

            // Resolve references before returning.
            var pending = response.length;
            if(0 !== pending) {// Items found.
              response.forEach(function(object) {
                this._resolve(object, options.resolve, function() {
                  !--pending && options.success(response, { cached: true });
                });
              }, this);
            }
            else {// No items found, return directly.
              options.success(response, { cached: true });
            }
          }
          else {
            options.error(Kinvey.Error.DATABASE_ERROR, 'Query is not in database.');
          }
        });
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.DATABASE_ERROR, txn.error || 'Failed to execute transaction.');
        };
      }), options.error);
    },

    /**
     * Removes object from the database.
     * 
     * @param {Object} object Object to be removed.
     * @param {Object} [options]
     */
    remove: function(object, options) {
      options = this._options(options);

      // Open transaction. Only open transaction store if we need it.
      var stores = [this.collection];
      !options.silent && stores.push(Database.TRANSACTION_STORE);
      this._transaction(stores, Database.READ_WRITE, bind(this, function(txn) {
        // Open store.
        var store = txn.objectStore(this.collection);

        // Retrieve object, to see if there is any metadata we need.
        var req = store.get(object._id);
        req.onsuccess = bind(this, function() {
          var result = req.result || object;

          // Remove object and add transaction.
          store['delete'](result._id);
          !options.silent && this._addTransaction(txn.objectStore(Database.TRANSACTION_STORE), result);
        });

        // Handle transaction status.
        txn.oncomplete = function() {
          options.success(null, { cached: true });
        };
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.DATABASE_ERROR, txn.error || 'Failed to execute transaction.');
        };
      }), options.error);
    },

    /**
     * Removes multiple objects from the database.
     * 
     * @param {Object} query Query object.
     * @param {Object} [options]
     */
    removeWithQuery: function(query, options) {
      // First, retrieve all items, so we can remove them one by one.
      this.queryWithQuery(query, merge(options, {
        success: bind(this, function(list) {
          // Open transaction. Only open transaction store if we need it.
          var stores = [this.collection, Database.QUERY_STORE];
          !options.silent && stores.push(Database.TRANSACTION_STORE);
          this._transaction(stores, Database.READ_WRITE, bind(this, function(txn) {
            // Remove query.
            var key = this._getKey(query);
            txn.objectStore(Database.QUERY_STORE)['delete'](key);

            // Remove objects and add transaction.
            var store = txn.objectStore(this.collection);
            list.forEach(function(object) {
              store['delete'](object._id);
            });
            !options.silent && this._addTransaction(txn.objectStore(Database.TRANSACTION_STORE), list);

            // Handle transaction status.
            txn.oncomplete = function() {
              options.success(null, { cached: true });
            };
            txn.onabort = txn.onerror = function() {
              options.error(Kinvey.Error.DATABASE_ERROR, txn.error || 'Failed to execute transaction.');
            };
          }), options.error);
        })
      }));
    },

    /**
     * Saves object to the database.
     * 
     * @param {Object} object Object to be saved.
     * @param {Object} [options]
     */
    save: function(object, options) {
      options = this._options(options);

      // Open transaction. Only open transaction store if we need it.
      var stores = [this.collection];
      !options.silent && stores.push(Database.TRANSACTION_STORE);
      this._transaction(stores, Database.READ_WRITE, bind(this, function(txn) {
        // Open store.
        var store = txn.objectStore(this.collection);

        // Store object in store. If entity is new, assign an ID. This is done
        // manually to overcome IndexedDBs approach to only assigns integers.
        object._id || (object._id = this._getRandomId());

        // Retrieve object to see if there is any metadata we need.
        var req = store.get(object._id);
        req.onsuccess = bind(this, function() {
          var result = req.result;
          if(result) {
            null == object._acl && result._acl && (object._acl = result._acl);
            null == object._kmd && result._kmd && (object._kmd = result._kmd);
          }

          // Save object and add transaction.
          txn.objectStore(this.collection).put(object);
          !options.silent && this._addTransaction(txn.objectStore(Database.TRANSACTION_STORE), object);
        });

        // Handle transaction status.
        txn.oncomplete = function() {
          options.success(object, { cached: true });
        };
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.DATABASE_ERROR, txn.error || 'Failed to execute transaction.');
        };
      }), options.error);
    },

    // Data management.

    /**
     * Clears the entire database.
     * 
     * @param {Object} [options]
     */
    clear: function(options) {
      options = this._options(options);

      // Delete all collections through a mutation operation.
      this._mutate(function(db) {
        var store;
        while(null !== (store = db.objectStoreNames.item(0))) {
          db.deleteObjectStore(store);
        }
     }, function() {
       // Success callback should be called without arguments.
       options.success();
     }, options.error);
    },

    /**
     * Retrieves multiple objects at once.
     * 
     * @param {Array} list List of object ids.
     * @param {Object} [options]
     */
    multiQuery: function(list, options) {
      options = this._options(options);

      // Open transaction.
      this._transaction(this.collection, Database.READ_ONLY, bind(this, function(txn) {
        // Prepare response.
        var response = {};

        // Open store.
        var store = txn.objectStore(this.collection);

        // Retrieve objects.
        list.forEach(function(id) {
          var req = store.get(id);
          req.onsuccess = function() {
            response[id] = req.result || null;
          };
        });

        // Handle transaction status.
        txn.oncomplete = function() {
          options.success(response, { cached: true });
        };
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.DATABASE_ERROR, txn.error || 'Failed to execute transaction.');
        };
      }), options.error);
    },

    /**
     * Removes multiple objects at once.
     * 
     * @param {Array} list List of object ids.
     * @param {Object} [options]
     */
    multiRemove: function(list, options) {
      options = this._options(options);

      // Open transaction.
      this._transaction(this.collection, Database.READ_WRITE, bind(this, function(txn) {
        // Open store.
        var store = txn.objectStore(this.collection);

        // Remove objects.
        list.forEach(function(id) {
          store['delete'](id);
        });

        // Handle transaction status.
        txn.oncomplete = function() {
          options.success(null, { cached: true });
        };
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.DATABASE_ERROR, txn.error || 'Failed to execute transaction.');
        };
      }), options.error);
    },

    /**
     * Writes data to database.
     * 
     * @param {string} type Data type.
     * @param {*} key Data key.
     * @param {*} data Data.
     * @param {Object} [options]
     */
    put: function(type, key, data, options) {
      // Do not record transactions.
      options = merge(options, { silent: true });

      // Take advantage of store methods.
      switch(type) {
        case 'aggregate':
          this._putAggregation(key, data, options);
          break;
        case 'query':// query, remove and save.
          null !== data ? this._putSave(data, options) : this.remove(key, options);
          break;
        case 'queryWithQuery':// queryWithQuery and removeWithQuery.
          null !== data ? this._putQueryWithQuery(key, data, options) : this.removeWithQuery(key, options);
          break;
      }
    },

    /**
     * Writes aggregation to database.
     * 
     * @private
     * @param {Object} aggregation Aggregation object.
     * @param {Array} response Aggregation.
     * @param {Object} [options]
     */
    _putAggregation: function(aggregation, response, options) {
      options = this._options(options);

      // Open transaction.
      this._transaction(Database.AGGREGATION_STORE, Database.READ_WRITE, bind(this, function(txn) {
        // Open store.
        var store = txn.objectStore(Database.AGGREGATION_STORE);

        // Save or delete aggregation.
        var key = this._getKey(aggregation);
        null !== response ? store.put({
          aggregation: key,
          response: response
        }) : store['delete'](key);

        // Handle transaction status.
        txn.oncomplete = function() {
          options.success(response);
        };
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.DATABASE_ERROR, txn.error || 'Failed to execute transaction.');
        };
      }), options.error);
    },

    /**
     * Writes query and resulting objects to database.
     * 
     * @private
     * @param {Object} query Query object.
     * @param {Array} response Response.
     * @param {Object} [options]
     */
    _putQueryWithQuery: function(query, response, options) {
      options = this._options(options);

      // Define handler to save the query and its result.
      var result = [];// Result is a list of object ids.
      var progress = bind(this, function() {
        // Open transaction.
        this._transaction(Database.QUERY_STORE, Database.READ_WRITE, bind(this, function(txn) {
          // Save query and its results.
          txn.objectStore(Database.QUERY_STORE).put({
            query: this._getKey(query),
            response: result
          });
  
          // Handle transaction status.
          txn.oncomplete = function() {
            options.success(response);
          };
          txn.onabort = txn.onerror = function() {
            options.error(Kinvey.Error.DATABASE_ERROR, txn.error || 'Failed to execute transaction.');
          };
        }), options.error);
      });

      // Quick way out, return if no objects are to be saved.
      var pending = response.length;
      if(0 === response.length) {
        return progress();
      }

      // Save objects (in parallel).
      response.forEach(function(object, i) {
        this.put('query', null, object, merge(options, {
          success: function(response) {
            result[i] = response._id;// Insert in order.
            !--pending && progress();
          },
          error: function() {
            !--pending && progress();
          }
        }));
      }, this);
    },

    /**
     * Writes object to database.
     * 
     * @private
     * @param {Object} object Object.
     * @param {Object} options Options.
     */
    _putSave: function(object, options) {
      // Extract references from object, if specified.
      if(options.resolve && options.resolve.length) {
        this._saveReferences(object, options.resolve, bind(this, function(response) {
          this.save(response, merge(options, { resolve: [], silent: true }));
        }));
        return;
      }

      // No references, save at once. Always silent.
      this.save(object, merge(options, { silent: true }));
    },

    // Transaction management.

    /**
     * Returns pending transactions.
     * 
     * @param {object} [options]
     */
    getTransactions: function(options) {
      options = this._options(options);

      // Open transaction.
      this._transaction(Database.TRANSACTION_STORE, Database.READ_ONLY, bind(this, function(txn) {
        // Prepare response.
        var response = {};

        // Open store.
        var store = txn.objectStore(Database.TRANSACTION_STORE);

        // If this instance is tied to a particular collection, retrieve
        // transactions for that collection only.
        if(Database.TRANSACTION_STORE !== this.collection) {
          var req = store.get(this.collection);
          req.onsuccess = bind(this, function() {
            var result = req.result;
            result && (response[this.collection] = result.transactions);
          });
        }
        else {// Iterate over all collections, and collect their transactions.
          var it = store.openCursor();
          it.onsuccess = function() {
            var cursor = it.result;
            if(cursor) {
              var result = cursor.value;
              response[result.collection] = result.transactions;

              // Proceed.
              cursor['continue']();
            }
          };
        }

        // Handle transaction status.
        txn.oncomplete = function() {
          options.success(response);
        };
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.DATABASE_ERROR, txn.error || 'Failed to execute transaction.');
        };
      }), options.error);
    },

    /**
     * Removes transactions.
     * 
     * @param {Object} transactions
     * @param {Object} [options]
     */
    removeTransactions: function(transactions, options) {
      options = this._options(options);

      // Open transaction.
      this._transaction(Database.TRANSACTION_STORE, Database.READ_WRITE, bind(this, function(txn) {
        // Open store.
        var store = txn.objectStore(Database.TRANSACTION_STORE);

        // Retrieve transactions for this collection.
        var req = store.get(this.collection);
        req.onsuccess = bind(this, function() {
          var result = req.result;
          if(result) {
            // Remove all committed transactions.
            transactions.forEach(function(id) {
              delete result.transactions[id];
            });

            // Update store.
            Object.keys(result.transactions).length ? store.put(result) : store['delete'](this.collection);
          }
        });

        // Handle transaction status.
        txn.oncomplete = function() {
          options.success(transactions, { cached: true });
        };
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.DATABASE_ERROR, txn.error || 'Failed to execute transaction.');
        };
      }), options.error);
    },

    /**
     * Adds a transaction for object to transaction store.
     * 
     * @private
     * @param {IDBObjectStore} store Transaction store.
     * @param {Array|Object} objects Object(s) under transaction.
     */
    _addTransaction: function(store, objects) {
      objects instanceof Array || (objects = [objects]);

      // Append new transactions to this collection.
      var req = store.get(this.collection);
      req.onsuccess = bind(this, function() {
        var result = req.result || {
          collection: this.collection,
          transactions: {}
        };

        // Add and save transaction. Add timestamp as value.
        objects.forEach(function(object) {
          result.transactions[object._id] = object._kmd ? object._kmd.lmt : null;
        });
        store.put(result);
      });
    },

    // Reference resolve methods.

    /**
     * Resolves object references.
     * 
     * @private
     * @param {Object} object
     * @param {Array} resolve Fields to resolve.
     * @param {function(response)} complete Complete callback.
     */
    _resolve: function(object, resolve, complete) {
      resolve = resolve ? resolve.slice(0) : [];// Copy by value.

      // Define function to resolve all desired references.
      var resolveSingleReference = bind(this, function() {
        if(resolve[0]) {// If there is more to be resolved, do that first.
          var segments = resolve.shift().split('.');
          this._resolveSingleSegment(segments, object, resolveSingleReference);
        }
        else {// All desired references are resolved.
          complete(object);
        }
      });
      resolveSingleReference();// Trigger.
    },

    /**
     * Resolves a single reference in a document.
     * 
     * @private
     * @param {Array} segments Field path to be resolved.
     * @param {Object} doc Document to search in.
     * @param {function()} complete Complete callback.
     */
    _resolveSingleSegment: function(segments, doc, complete) {
      // If the path is not fully traversed, do that first.
      if(segments[0]) {
        var field = segments.shift();

        // Check and resolve top-level reference. Otherwise: descent deeper.
        if(doc.hasOwnProperty(field) && null != doc[field]) {
          // First case: field is a (unresolved) reference.
          if('KinveyRef' === doc[field]._type && null != doc[field]._collection && null != doc[field]._id) {
            if('undefined' === typeof doc[field]._obj) {// Unresolved reference.
              // Query for reference.
              var db = this.collection === doc[field]._collection ? this : new Database(doc[field]._collection);
              db.query(doc[field]._id, {
                resolve: [segments.join('.')],// Relative to reference.
                success: function(response) {
                  doc[field]._obj = response;
                  complete();// Proceed.
                },
                error: function() {// Reference could not be resolved.
                  doc[field]._obj = null;
                  complete();// Proceed.
                }
              });
              return;// Terminate, proceed after query() completes.
            }

            // Already resolved reference, descent into.
            if(null !== doc[field]._obj) {// Resolved reference, descent into.
              this._resolveSingleSegment(segments, doc[field]._obj, complete);
            }
            else {// Resolved reference is null, dead-end.
              complete();
            }
          }

          // Second case: field is an array. Only immediate members are resolved.
          else if(doc[field] instanceof Array) {
            // Define function to resolve a member in the aray.
            var resolveArrayReference = bind(this, function(i) {
              // If there is more to resolve, do that first.
              if(i < doc[field].length) {
                var member = doc[field][i];
                if(null != member && 'KinveyRef' === member._type && null != member._collection && null != member._id && 'undefined' === typeof member._obj) {
                  // Unresolved reference found, resolve.
                  var db = this.collection === member._collection ? this : new Database(member._collection);
                  db.query(member._id, {
                    success: function(response) {
                      doc[field][i]._obj = response;
                      resolveArrayReference(++i);// Proceed.
                    },
                    error: function() {// Reference could not be resolved.
                      doc[field][i]._obj = null;
                      resolveArrayReference(++i);// Proceed.
                    }
                  });
                }
                else {// Not a reference.
                  resolveArrayReference(++i);// Proceed.
                }
              }

              // Otherwise, array is traversed.
              else {
                complete();// Proceed.
              }
            });
            return resolveArrayReference(0);// Trigger.
          }

          // Third and last case: field is a scalar or plain object. Descent.
          else {
            this._resolveSingleSegment(segments, doc[field], complete);
          }
        }
        else {// doc does not have field, skip reference.
          complete();
        }
      }
      else {// Path is fully traversed, all work has been done.
        complete();
      }
    },

    /**
     * Extract and saves references from object attributes.
     * 
     * @private
     * @param {Object} object Attributes.
     * @param {Array} references List of references.
     * @param {function(response)} complete Complete callback.
     */
    _saveReferences: function(object, references, complete) {
      // Because references could be nested, first search for all references
      // and store them in a stack.
      var stack = [];

      // If there are references to resolve, do that first.
      while(references[0]) {
        var segments = references.shift().split('.');
        var doc = object;

        // Descent into doc.
        while(segments[0]) {
          var field = segments.shift();

          if(doc.hasOwnProperty(field) && null != doc[field]) {
            // First case: field is a embedded document.
            if('KinveyRef' === doc[field]._type && null != doc[field]._collection && null != doc[field]._id && null != doc[field]._obj) {
              if(-1 === stack.indexOf(doc[field])) {// Add to stack (once).
                stack.push(doc[field]);
              }

              // Descent into document.
              doc = doc[field]._obj;
            }

            // Second case: field is an array. Only save immediate members.
            else if(doc[field] instanceof Array) {
              for(var i in doc[field]) {
                var member = doc[field][i];
                if(null != member && 'KinveyRef' === member._type && null != member._collection && null != member._id && null != member._obj) {
                  stack.push(doc[field][i]);// Add to stack.
                }
              }
            }
            
            // Third case: field is a plain object.
            else if(doc[field] instanceof Object) {
              doc = doc[field];// Descent into doc.
            }
          }
        }
      }

      // All references are now in stack. Save them by starting with the last
      // item. This will ensure nested references are saved first, so we can
      // remove the _obj property afterwards.
      var save = bind(this, function(i) {
        if(i >= 0) {// If the stack is not empty yet, save.
          var item = stack[i];

          // Save item.
          var db = this.collection === item._collection ? this : new Database(item._collection);
          db.put('query', null, item._obj, {
            success: function() {
              delete item._obj;// Delete embedded document.
              save(--i);
            },
            error: function() {// Delete embedded document.
              delete item._obj;
              save(--i);
            }
          });
        }
        else {// Stack is empty, return object without embedded references.
          complete(object);
        }
      });
      save(stack.length - 1);// Trigger.
    },

    // IndexedDB convenience methods.

    /**
     * Returns a random id. Actually, this method concatenates the current
     * timestamp with a random string.
     * 
     * @return {string} Random id.
     */
    _getRandomId: function() {
      return new Date().getTime().toString() + Math.random().toString(36).substring(2, 12);
    },

    /**
     * Returns key.
     * 
     * @private
     * @param {Object} object
     * @return {string} Key.
     */
    _getKey: function(object) {
      object.collection = this.collection;
      return JSON.stringify(object);
    },

    /**
     * Returns schema for database store.
     * 
     * @private
     * @param {string} store Store name.
     * @return {Object} Schema.
     */
    _getSchema: function(store) {
      // Map defining primary key for metadata stores. If the store is not
      // a metadata store, simply return _id (see below).
      var key = {};
      key[Database.TRANSACTION_STORE] = 'collection';
      key[Database.AGGREGATION_STORE] = 'aggregation';
      key[Database.QUERY_STORE] = 'query';

      // Return schema.
      return {
        name: store,
        options: { keyPath: key[store] || '_id' }
      };
    },

    /**
     * Mutates the database schema.
     * 
     * @private
     * @param {function()} upgrade Upgrade callback.
     * @param {function(database)} success Success callback.
     * @param {function(error)} error Failure callback.
     */
    _mutate: function(upgrade, success, error) {
      this._open(null, null, bind(this, function(database) {
        var version = parseInt(database.version || 0, 10) + 1;
        this._open(version, upgrade, success, error);
      }), error);
    },

    /**
     * Opens the database.
     * 
     * @private
     * @param {integer} [version] Database version.
     * @param {function()} [update] Upgrade callback.
     * @param {function(database)} success Success callback.
     * @param {function(error)} error Failure callback.
     */
    _open: function(version, upgrade, success, error) {
      // Extend success callback to handle method concurrency.
      var fnSuccess = success;
      success = bind(this, function(db) {
        // If idle, handle next request in queue.
        if(Database.isIdle) {
          var next = Database.queue.shift();
          next && this._open.apply(this, next);
        }
        fnSuccess(db);
      });

      // Reuse if possible.
      if(null != Database.instance && (null == version || Database.instance.version === version)) {
        return success(Database.instance);
      }

      // Concurrency control, allow only one request at the time, queue others.
      if(!Database.isIdle) {
        return Database.queue.push(arguments);
      }
      Database.isIdle = false;

      // If we only want to change the version, check for outdated setVersion.
      var req;
      if(Database.instance && Database.instance.setVersion) {// old.
        req = Database.instance.setVersion(version);
        req.onsuccess = function() {
          upgrade(Database.instance);

          // @link https://groups.google.com/a/chromium.org/forum/?fromgroups#!topic/chromium-html5/VlWI87JFKMk
          var txn = req.result;
          txn.oncomplete = function() {
            // We're done, reset flag.
            Database.isIdle = true;
            success(Database.instance);
          };
        };
        req.onblocked = req.onerror = function() {
          error(Kinvey.Error.DATABASE_ERROR, req.error || 'Mutation error.');
        };
        return;
      }

      // If no version is specified, use the latest version.
      if(null == version) {
        req = indexedDB.open(this.name);
      }
      else {// open specific version
        req = indexedDB.open(this.name, version);
      }

      // Handle database status.
      req.onupgradeneeded = function() {
        Database.instance = req.result;
        upgrade && upgrade(Database.instance);
      };
      req.onsuccess = bind(this, function() {
        Database.instance = req.result;

        // Handle versionchange when another process alters it.
        Database.instance.onversionchange = function() {
          if(Database.instance) {
            Database.instance.close();
            Database.instance = null;
          }
        };

        // We're done, reset flag.
        Database.isIdle = true;
        success(Database.instance);
      });
      req.onblocked = req.onerror = function() {
        error(Kinvey.Error.DATABASE_ERROR, 'Failed to open the database.');
      };
    },

    /**
     * Returns complete options object.
     * 
     * @param {Object} options Options.
     * @return {Object} Options.
     */
    _options: function(options) {
      options || (options = {});

      // Create convenient error handler shortcut.
      var fnError = options.error || function() { };
      options.error = function(error, description) {
        fnError({
          error: error,
          description: description || error,
          debug: ''
        }, { cached: true });
      };
      options.success || (options.success = function() { });

      return options;
    },

    /**
     * Opens transaction for store(s).
     * 
     * @private
     * @param {Array|string} stores Store name(s).
     * @param {string} mode Transaction mode.
     * @param {function(transaction)} success Success callback.
     * @param {function(error)} error Failure callback.
     */
    _transaction: function(stores, mode, success, error) {
      !(stores instanceof Array) && (stores = [stores]);

      // Open database.
      this._open(null, null, bind(this, function(db) {
        // Make sure all stores exist.
        var missingStores = [];
        stores.forEach(function(store) {
          if(!db.objectStoreNames.contains(store)) {
            missingStores.push(store);
          }
        });

        // Create missing stores.
        if(0 !== missingStores.length) {
          this._mutate(bind(this, function(db) {
            missingStores.forEach(function(store) {
              // Since another process may already have created the store
              // concurrently, check again whether the store exists.
              if(!db.objectStoreNames.contains(store)) {
                var schema = this._getSchema(store);
                db.createObjectStore(schema.name, schema.options);
              }
            }, this);
          }), function(db) {// Return a transaction.
            success(db.transaction(stores, mode));
          }, error);
        }
        else {// Return a transaction.
          success(db.transaction(stores, mode));
        }
      }), error);
    }
  }, {
    /** @lends Database */

    // Transaction modes.
    READ_ONLY: IDBTransaction.READ_ONLY || 'readonly',
    READ_WRITE: IDBTransaction.READ_WRITE || 'readwrite',

    // Stores.
    AGGREGATION_STORE: '_aggregations',
    QUERY_STORE: '_queries',
    TRANSACTION_STORE: '_transactions',

    // Concurrency mechanism to queue database open requests.
    isIdle: true,
    queue: [],

    // For performance reasons, keep one database open for the whole app.
    instance: null
  });

}());