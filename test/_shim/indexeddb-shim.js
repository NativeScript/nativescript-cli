// This shim is a concatenated and slighly altered version of:
// https://github.com/axemclion/IndexedDB

(function(window) {

// XXX native implementations use DOMStringList, which has a contains method.
Array.prototype.contains = function(item) {
  return -1 !== this.indexOf(item);
};

window.idbModules = {};
  (function(idbModules){
    /**
     * A utility method to callback onsuccess, onerror, etc as soon as the calling function's context is over
     * @param {Object} fn
     * @param {Object} context
     * @param {Object} argArray
     */
    function callback(fn, context, argArray, func){
      //window.setTimeout(function(){
        (typeof context[fn] === "function") && context[fn].apply(context, argArray);
        (typeof func === "function") && func();
      //}, 1);
    }
    
    /**
     * Throws a new DOM Exception,
     * @param {Object} name
     * @param {Object} message
     * @param {Object} error
     */
    function throwDOMException(name, message, error){
      console.log(name, message, error);
      var e = new DOMException.constructor(0, message);
      e.name = name;
      e.message = message;
      e.stack = arguments.callee.caller;
      throw e;
    }
    
    idbModules["util"] = {
      "throwDOMException": throwDOMException,
      "callback": callback
    }
  })(idbModules);
  (function(idbModules){
    /**
     * A dummy implementation of the Structured Cloning Algorithm
     * This just converts to a JSON string
     */
    var Sca = (function(){
      return {
        "encode": function(val){
          return JSON.stringify(val);
        },
        "decode": function(val){
          return JSON.parse(val);
        }
      }
    }());
    idbModules["Sca"] = Sca;
  }(idbModules));
  (function(idbModules){
    /**
     * Encodes the keys and values based on their types. This is required to maintain collations
     */
    var Key = (function(){
      return {
        encode: function(key){
          // TODO The keys should be numbers, as they need to be compared
          var prefix = "5";
          switch (typeof key) {
            case "number":
              prefix = 1;
              break;
            case "string":
              prefix = 2;
              break;
            case "boolean":
              prefix = 3;
              break;
            case "object":
              prefix = 4;
              break;
            case "undefined":
              prefix = 5;
              break;
            default:
              prefix = 6;
              break;
          }
          return prefix + "-" + JSON.stringify(key);
        },
        decode: function(key){
          return JSON.parse(key.substring(2));
        }
      }
    }());
    idbModules["Key"] = Key;
  }(idbModules));
  (function(idbModules, undefined){

    var Event = function(type, debug){
      var e = document.createEvent("Event");
      e.initEvent(type, true, true);
      e.debug = debug;
      return e;
    }
    
    idbModules.Event = Event;
  }(idbModules));
  (function(idbModules){

    /**
     * The IDBRequest Object that is returns for all async calls
     * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#request-api
     */
    var IDBRequest = function(){
      this.onsuccess = this.onerror = this.result = this.error = this.source = this.transaction = null;
      this.readyState = "pending";
    };
    /**
     * The IDBOpen Request called when a database is opened
     */
    var IDBOpenRequest = function(){
      this.onblocked = this.onupgradeneeded = null;
    }
    IDBOpenRequest.prototype = IDBRequest;
    
    idbModules["IDBRequest"] = IDBRequest;
    idbModules["IDBOpenRequest"] = IDBOpenRequest;
    
  }(idbModules));
  (function(idbModules, undefined){
    /**
     * The IndexedDB KeyRange object
     * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#dfn-key-range
     * @param {Object} lower
     * @param {Object} upper
     * @param {Object} lowerOpen
     * @param {Object} upperOpen
     */
    var IDBKeyRange = function(lower, upper, lowerOpen, upperOpen){
      this.lower = lower;
      this.upper = upper;
      this.lowerOpen = lowerOpen;
      this.upperOpen = upperOpen;
    }
    
    IDBKeyRange.only = function(value){
      return new IDBKeyRange(value, value, true, true);
    };
    
    IDBKeyRange.lowerBound = function(value, open){
      return new IDBKeyRange(value, undefined, open, undefined);
    };
    IDBKeyRange.upperBound = function(value){
      return new IDBKeyRange(undefined, value, undefined, open);
    };
    IDBKeyRange.bound = function(lower, upper, lowerOpen, upperOpen){
      return new IDBKeyRange(lower, upper, lowerOpen, upperOpen);
    };
    
    window.IDBKeyRange = idbModules.IDBKeyRange = IDBKeyRange;
    
  }(idbModules));
  (function(idbModules, undefined){
    /**
     * The IndexedDB Cursor Object
     * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBCursor
     * @param {Object} range
     * @param {Object} direction
     * @param {Object} idbObjectStore
     * @param {Object} cursorRequest
     */
    function IDBCursor(range, direction, idbObjectStore, cursorRequest){
      this.__range = range;
      this.__idbObjectStore = idbObjectStore;
      this.__req = cursorRequest;
      
      this.key = undefined;
      this.direction = direction;
      this.source = this.idbObjectStore;
      
      if (!this.__idbObjectStore.transaction.__active) idbModules.util.throwDOMException("TransactionInactiveError - The transaction this IDBObjectStore belongs to is not active.");
      
      // Setting this to -1 as continue will set it to 0 anyway
      this.__offset = -1;
      this["continue"]();
    }
    
    IDBCursor.prototype.__find = function(key, tx, success, error){
      var me = this;
      var sql = ["SELECT * FROM ", me.__idbObjectStore.name];
      var sqlValues = [];
      if (me.__range && (me.__range.lower || me.__range.upper)) {
        sql.push("WHERE");
        if (me.__range.lower) {
          sql.push("key " + (me.__range.lowerOpen ? "<=" : "<") + " ?");
          sqlValues.push(me.__range.lower);
        }
        (me.__range.lower && me.__range.upper) && sql.push("AND");
        if (me.__range.upper) {
          sql.push("key " + (me.__range.upperOpen ? ">=" : ">") + " ?");
          sqlValues.push(me.__range.upper);
        }
      }
      
      if (typeof key !== "undefined") {
        sql.push((me.__range && (me.__range.lower || me.__range.upper)) ? "AND" : "WHERE")
        sql.push("key = ?");
        sqlValues.push(idbModules.Key.encode(key));
        sql.push("LIMIT 1");
      } else {
        sql.push("LIMIT 1 OFFSET " + me.__offset);
      }
      console.log(sql.join(" "), sqlValues);
      tx.executeSql(sql.join(" "), sqlValues, function(tx, data){
        if (data.rows.length === 1) {
          var key = idbModules.Key.decode(data.rows.item(0).key);
          var val = idbModules.Sca.decode(data.rows.item(0).value);
          success(key, val);
        } else {
          console.log("Reached end of cursors");
          success(undefined, undefined);
        }
      }, function(tx, data){
        console.log("Could not execute Cursor.continue");
        error(data);
      });
    };
    
    IDBCursor.prototype["continue"] = function(key){
      var me = this;
      this.__idbObjectStore.transaction.__addToTransactionQueue(function(tx, args, success, error){
        me.__offset++;
        me.__find(key, tx, function(key, val){
          me.key = key, me.value = val;
          success(typeof me.key !== "undefined" ? me : undefined, me.__req);
        }, function(data){
          error(data);
        });
      });
    };
    
    IDBCursor.prototype.advance = function(count){
      if (count <= 0) {
        idbModules.util.throwDOMException("Type Error - Count is invalid - 0 or negative", count);
      }
      var me = this;
      this.__idbObjectStore.transaction.__addToTransactionQueue(function(tx, args, success, error){
        me.__offset += count;
        me.__find(key, tx, function(key, value){
          me.__offset++;
          me.key = key, me.value = value;
          success(me, me.__req);
        }, function(data){
          error(data);
        })
      });
    };
    
    IDBCursor.prototype.update = function(valueToUpdate){
      var me = this;
      return this.__idbObjectStore.transaction.__addToTransactionQueue(function(tx, args, success, error){
        me.__find(undefined, tx, function(key, value){
          var sql = "UPDATE " + me.__idbObjectStore.name + " SET value = ? WHERE key = ?";
          console.log(sql, valueToUpdate, key);
          tx.executeSql(sql, [idbModules.Sca.encode(valueToUpdate), idbModules.Key.encode(key)], function(tx, data){
            if (data.rowsAffected === 1) {
              success(key);
            } else {
              error("No rowns with key found" + key);
            }
          }, function(tx, data){
            error(data);
          })
        }, function(data){
          error(data);
        });
      });
    };
    
    IDBCursor.prototype["delete"] = function(){
      var me = this;
      return this.__idbObjectStore.transaction.__addToTransactionQueue(function(tx, args, success, error){
        me.__find(undefined, tx, function(key, value){
          var sql = "DELETE FROM  " + me.__idbObjectStore.name + " WHERE key = ?";
          console.log(sql, key);
          tx.executeSql(sql, [idbModules.Key.encode(key)], function(tx, data){
            if (data.rowsAffected === 1) {
              success(undefined);
            } else {
              error("No rowns with key found" + key);
            }
          }, function(tx, data){
            error(data);
          })
        }, function(data){
          error(data);
        });
      });
    };
    
    idbModules["IDBCursor"] = IDBCursor;
  }(idbModules));
  (function(idbModules, undefined){
    /**
     * IDB Index
     * http://www.w3.org/TR/IndexedDB/#idl-def-IDBIndex
     * @param {Object} indexName
     * @param {Object} keyPath
     * @param {Object} optionalParameters
     * @param {Object} transaction
     */
    function IDBIndex(indexName, keyPath, optionalParameters, transaction, ready){
      this.indexName = indexName;
      this.keyPath = keyPath;
      this.optionalParameters = optionalParameters;
      this.transaction = transaction;
      this.__setReadyState(ready);
    };
    
    IDBIndex.prototype.__setReadyState = function(state){
      this.__ready = state;
    }
    
    IDBIndex.prototype.openCursor = function(range, direction){
    
    };
    
    IDBIndex.prototype.openKeyCursor = function(range, direction){
    
    };
    
    IDBIndex.prototype.get = function(key){
    
    };
    
    IDBIndex.prototype.getKey = function(key){
    
    };
    
    IDBIndex.prototype.count = function(key){
    
    };
    
    idbModules["IDBIndex"] = IDBIndex;
  }(idbModules));
  (function(idbModules){

    /**
     * IndexedDB Object Store
     * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBObjectStore
     * @param {Object} name
     * @param {Object} transaction
     */
    var IDBObjectStore = function(name, idbTransaction, ready){
      this.name = name;
      this.transaction = idbTransaction;
      this.__setReadyState(ready);
      this.indexNames = [];
    };
    
    /**
     * Need this flag as createObjectStore is synchronous. So, we simply return when create ObjectStore is called
     * but do the processing in the background. All other operations should wait till ready is set
     * @param {Object} val
     */
    IDBObjectStore.prototype.__setReadyState = function(val){
      this.__ready = (typeof ready === "undefined") ? true : false;
      var me = this;
    };
    
    /**
     * Called by all operations on the object store, waits till the store is ready, and then performs the operation
     * @param {Object} callback
     */
    IDBObjectStore.prototype.__waitForReady = function(callback){
      if (this.__ready) {
        callback();
      } else {
        console.log("Waiting for objectstore to be ready");
        var me = this;
        window.setTimeout(function(){
          me.__waitForReady(callback);
        }, 100);
      }
    }
    
    /**
     * Gets (and optionally caches) the properties like keyPath, autoincrement, etc for this objectStore
     * @param {Object} callback
     */
    IDBObjectStore.prototype.__getStoreProps = function(tx, callback){
      var me = this;
      this.__waitForReady(function(){
        if (me.__storeProps) {
          callback(me.__storeProps);
        } else {
          tx.executeSql("SELECT * FROM __sys__ where name = ?", [me.name], function(tx, data){
            if (data.rows.length !== 1) {
              callback();
            } else {
              me.__storeProps = data.rows.item(0);
              callback(me.__storeProps);
            }
          }, function(){
            callback();
          });
        }
      });
    };
    
    /**
     * From the store properties and object, extracts the value for the key in hte object Store
     * If the table has auto increment, get the next in sequence
     * @param {Object} props
     * @param {Object} value
     * @param {Object} key
     */
    IDBObjectStore.prototype.__deriveKey = function(tx, value, key, callback){
      function getNextAutoIncKey(){
        tx.executeSql("SELECT * FROM sqlite_sequence where name like ?", [me.name], function(tx, data){
          if (data.rows.length !== 1) {
            idbModules.util.throwDOMException(0, "Data Error - Could not get the auto increment value for key, no auto Inc value returned", data.rows);
          } else {
            callback(data.rows.item(0).seq);
          }
        }, function(tx, error){
          idbModules.util.throwDOMException(0, "Data Error - Could not get the auto increment value for key", error);
        });
      }
      
      var me = this;
      me.__getStoreProps(tx, function(props){
        if (!props) idbModules.util.throwDOMException(0, "Data Error - Could not locate defination for this table", props);
        
        if (props.keyPath) {
          if (typeof key !== "undefined") {
            idbModules.util.throwDOMException(0, "Data Error - The object store uses in-line keys and the key parameter was provided", props);
          }
          if (value) {
            try {
              var primaryKey = eval("value['" + props.keyPath + "']");
              if (!primaryKey) {
                if (props.autoInc === "true") {
                  getNextAutoIncKey();
                } else {
                  idbModules.util.throwDOMException(0, "Data Error - Could not eval key from keyPath", e);
                }
              } else {
                callback(primaryKey);
              }
            } catch (e) {
              idbModules.util.throwDOMException(0, "Data Error - Could not eval key from keyPath", e);
            }
          } else {
            idbModules.util.throwDOMException(0, "Data Error - KeyPath was specified, but value was not", e);
          }
        } else {
          if (typeof key !== "undefined") {
            callback(key);
          } else {
            if (props.autoInc === "false") {
              idbModules.util.throwDOMException(0, "Data Error - The object store uses out-of-line keys and has no key generator and the key parameter was not provided. ", props);
            } else {
              // Looks like this has autoInc, so lets get the next in sequence and return that.
              getNextAutoIncKey();
            }
          }
        }
      });
    };
    
    IDBObjectStore.prototype.__insertData = function(tx, value, primaryKey, success, error){
      var paramMap = {};
      if (typeof primaryKey !== "undefined") {
        paramMap["key"] = idbModules.Key.encode(primaryKey);
      }
      var indexes = JSON.parse(this.__storeProps.indexes);
      for (var key in indexes) {
        try {
          paramMap[indexes[key].columnName] = idbModules.Key.encode(eval("value['" + indexes[key].keyPath + "']"));
        } catch (e) {
          error(e);
        }
      }
      var sqlStart = ["INSERT INTO ", this.name, "("];
      var sqlEnd = [" VALUES ("];
      var sqlValues = [];
      for (key in paramMap) {
        sqlStart.push(key + ",");
        sqlEnd.push("?,");
        sqlValues.push(paramMap[key]);
      }
      // removing the trailing comma
      sqlStart.push("value )");
      sqlEnd.push("?)")
      sqlValues.push(idbModules.Sca.encode(value));
      
      // XXX Fixed leak of variable.
      var sql = sqlStart.join(" ") + sqlEnd.join(" ");
      
      console.log("SQL for adding", sql, sqlValues);
      tx.executeSql(sql, sqlValues, function(tx, data){
        success(primaryKey);
      }, function(tx, err){
        error(err);
      });
    }
    
    IDBObjectStore.prototype.add = function(value, key){
      var me = this;
      return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
        me.__deriveKey(tx, value, key, function(primaryKey){
          me.__insertData(tx, value, primaryKey, success, error);
        });
      });
    };
    
    IDBObjectStore.prototype.put = function(value, key){
      var me = this;
      return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
        me.__deriveKey(tx, value, key, function(primaryKey){
          // First try to delete if the record exists
          var sql = "DELETE FROM " + me.name + " where key = ?";
          tx.executeSql(sql, [idbModules.Key.encode(primaryKey)], function(tx, data){
            console.log("Did the row with the", primaryKey, "exist? ", data.rowsAffected);
            me.__insertData(tx, value, primaryKey, success, error);
          }, function(tx, err){
            error(err);
          });
        });
      });
    };
    
    IDBObjectStore.prototype.get = function(key){
      // TODO Key should also be a key range
      var me = this;
      return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
        me.__waitForReady(function(){
          var primaryKey = idbModules.Key.encode(key);
          console.log("Fetching", me.name, primaryKey);
          tx.executeSql("SELECT * FROM " + me.name + " where key = ?", [primaryKey], function(tx, data){
            // XXX console.log below accessed a property which may not exist.
//            console.log("Fetched data", data.rows.item(0));
            console.log('Fetched data', data);
            try {
              success(JSON.parse(data.rows.item(0).value));
            } catch (e) {
              // XXX disabled logging error message, as error is common when no result is found.
//              console.log(e)
              // If no result is returned, or error occurs when parsing JSON
              success(undefined);
            }
          }, function(tx, err){
            error(err);
          });
        });
      });
    }
    
    IDBObjectStore.prototype["delete"] = function(key){
      // TODO key should also support key ranges
      var me = this;
      return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
        me.__waitForReady(function(){
          var primaryKey = idbModules.Key.encode(key);
          console.log("Fetching", me.name, primaryKey);
          tx.executeSql("DELETE FROM " + me.name + " where key = ?", [primaryKey], function(tx, data){
            console.log("Deleted from database", data.rowsAffected);
            success();
          }, function(tx, err){
            error(err);
          });
        });
      });
    }
    
    IDBObjectStore.prototype.clear = function(){
      var me = this;
      return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
        me.__waitForReady(function(){
          var primaryKey = idbModules.Key.encode(key);
          console.log("Fetching", me.name, primaryKey);
          tx.executeSql("DELETE FROM " + me.name, [], function(tx, data){
            console.log("Cleared all records from database", data.rowsAffected);
            success();
          }, function(tx, err){
            error(err);
          });
        });
      });
    }
    
    IDBObjectStore.prototype.count = function(){
      var me = this;
      return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
        me.__waitForReady(function(){
          var sql = "SELECT * FROM " + me.name + ((key !== "undefined") ? " WHERE key = ?" : "");
          var sqlValues = [];
          key && sqlValues.push(idbModules.Key.encode(key))
          tx.executeSql(sql, sqlValues, function(tx, data){
            success(data.rows.length);
          }, function(tx, err){
            error(err);
          });
        });
      });
    }
    
    IDBObjectStore.prototype.openCursor = function(range, direction){
      var cursorRequest = new idbModules.IDBRequest();
      var cursor = new idbModules.IDBCursor(range, direction, this, cursorRequest);
      return cursorRequest;
    }
    
    IDBObjectStore.prototype.createIndex = function(indexName, keyPath, optionalParameters){
      var me = this;
      optionalParameters = optionalParameters || {};
      var result = new idbModules.IDBIndex(me.name, me.transaction, false);
      
      var transaction = me.transaction;
      transaction.__addToTransactionQueue(function(tx, args, success, failure){
        me.__waitForReady(function(){
          me.__getStoreProps(tx, function(){
            function error(){
              idbModules.util.throwDOMException(0, "Could not create new index", arguments);
            }
            
            if (me.transaction.mode !== 2) {
              idbModules.util.throwDOMException(0, "Invalid State error, not a version transaction", me.transaction);
            }
            var indexes = JSON.parse(me.__storeProps.indexes);
            if (typeof indexes[indexName] != "undefined") {
              idbModules.util.throwDOMException(0, "Index already exists on store", indexes);
            }
            var columnName = indexName;
            indexes[indexName] = {
              "columnName": columnName,
              "keyPath": keyPath,
              "optionalParams": optionalParameters
            };
            // For this index, first create a column
            var sql = ["ALTER TABLE", me.name, "ADD", columnName, "BLOB"].join(" ");
            console.log(sql);
            tx.executeSql(sql, [], function(tx, data){
              // Once a column is created, put existing records into the index
              tx.executeSql("SELECT * FROM " + me.name, [], function(tx, data){
                (function initIndexForRow(i){
                  if (i < data.rows.length) {
                    try {
                      var value = idbModules.Sca.decode(data.rows.item(i).value);
                      var indexKey = eval("value['" + keyPath + "']");
                      tx.executeSql("UPDATE " + me.name + " set " + columnName + " = ? where key = ?", [indexKey, data.rows.item(i).key], function(tx, data){
                        initIndexForRow(i + 1);
                      }, error);
                    } catch (e) {
                      // Not a valid value to insert into index, so just continue
                      initIndexForRow(i + 1);
                    }
                  } else {
                    tx.executeSql("UPDATE __sys__ set indexes = ? where name = ?", [JSON.stringify(indexes), me.name], function(){
                      result.__setReadyState(true);
                      success(result);
                    }, error);
                  }
                })(0);
              }, error);
            }, error);
          });
        });
      });
      
      IDBObjectStore.prototype.deleteIndex = function(indexName){
        transaction.__addToTransactionQueue(function(tx, args, success, failure){
          me.__waitForReady(function(){
            me.__getStoreProps(tx, function(){
              var indexes = JSON.parse(me.__storeProps.indexes);
              if (typeof indexes[indexName] === "undefined") {
                idbModules.util.throwDOMException(0, "Index does not  exist on store", indexes);
              }
              tx.executeSql("UPDATE __sys__ set indexes = ? where name = ?", [JSON.stringify(indexes), me.name], function(){
                result.__setReadyState(true);
                success(result);
              }, error);
            });
          });
        });
      };
      
      // The IndexedDB Specification needs us to return an Object Store immediatly, but WebSQL does not create and return the store immediatly
      // Hence, this can technically be unusable, and we hack around it, by setting the ready value to false
      me.indexNames.push(indexName);
      return result;
    };
    
    idbModules["IDBObjectStore"] = IDBObjectStore;
  }(idbModules));
  (function(idbModules){

    /**
     * The IndexedDB Transaction
     * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBTransaction
     * @param {Object} storeNames
     * @param {Object} mode
     * @param {Object} db
     */
    var IDBTransaction = function(storeNames, mode, db){
      this.mode = mode;
      this.storeNames = typeof storeNames === "string" ? [storeNames] : storeNames;
      for (var i = 0; i < this.storeNames.length; i++) {
        if (db.objectStoreNames.indexOf(storeNames[i]) === -1) {
          idbModules.util.throwDOMException(0, "The operation failed because the requested database object could not be found. For example, an object store did not exist but was being opened.", storeNames);
        }
      }
      this.__active = true;
      this.__running = false;
      this.__requests = [];
      this.__aborted = false;
      this.db = db;
      this.error = null;
      this.onabort = this.onerror = this.oncomplete = null;
      var me = this;
    };
    
    IDBTransaction.prototype.__executeRequests = function(){
      if (this.__running) {
        return;
      }
      this.__running = true;
      var me = this;
      window.setTimeout(function(){
        !me.__active && idbModules.util.throwDOMException(0, "A request was placed against a transaction which is currently not active, or which is finished", me.__active);
        // Start using the version transaction
        me.db.__db.transaction(function(tx){
          me.__tx = tx;
          var q = null, i = 0;
          try {
            function executeRequest(){
              if (i >= me.__requests.length) {
                me.__active = false; // All requests in the transaction is done
                me.__requests = [];
                return;
              }
              q = me.__requests[i];
              q.op(tx, q["args"], success, error);
            };
            
            function success(result, req){
              if (req) {
                // Need to do this in case of cursors
                q.req = req;
              }
              q.req.readyState = "done";
              q.req.result = result;
              delete q.req.error;
              var e = idbModules.Event("success");
              idbModules.util.callback("onsuccess", q.req, [e]);
              i++;
              executeRequest();
            }
            
            function error(errorVal){
              q.req.readyState = "done";
              q.req.error = "DOMError";
              var e = idbModules.Event("error", arguments);
              idbModules.util.callback("onerror", q.req, [e]);
              i++;
              executeRequest();
            };
            
            executeRequest();
          } catch (e) {
          
          }
        }, function(){
          // Error callback
        }, function(){
          // Transaction completed
        });
      }, 1);
    }
    
    IDBTransaction.prototype.__addToTransactionQueue = function(callback, args){
      !this.__active && idbModules.util.throwDOMException(0, "A request was placed against a transaction which is currently not active, or which is finished.", this.__active);
      var request = new idbModules.IDBRequest();
      request.source = this.db;
      this.__requests.push({
        "op": callback,
        "args": args,
        "req": request
      });
      // Start the queue for executing the requests
      this.__executeRequests();
      return request;
    };
    
    IDBTransaction.prototype.objectStore = function(objectStoreName){
      return new idbModules.IDBObjectStore(objectStoreName, this);
    };
    
    IDBTransaction.prototype.abort = function(){
      !me.__active && idbModules.util.throwDOMException(0, "A request was placed against a transaction which is currently not active, or which is finished", me.__active);
      
    };
    
    IDBTransaction.prototype.READ_ONLY = 0;
    IDBTransaction.prototype.READ_WRITE = 1;
    IDBTransaction.prototype.VERSION_CHANGE = 2;
    
    window.IDBTransaction = idbModules["IDBTransaction"] = IDBTransaction;
  }(idbModules));
  (function(idbModules){

    /**
     * IDB Database Object
     * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#database-interface
     * @param {Object} db
     */
    var IDBDatabase = function(db, name, version, storeProperties){
      this.__db = db, this.version = version, this.__storeProperties = storeProperties;
      this.objectStoreNames = [];
      for (var i = 0; i < storeProperties.rows.length; i++) {
        this.objectStoreNames.push(storeProperties.rows.item(i).name);
      }
      this.name = name;
      this.onabort = this.onerror = this.onversionchange = null;
    };
    
    IDBDatabase.prototype.createObjectStore = function(storeName, createOptions){
      var me = this;
      createOptions = createOptions || {};
      createOptions.keyPath = createOptions.keyPath || null;
      var result = new idbModules.IDBObjectStore(storeName, me.__versionTransaction, false);
      
      var transaction = me.__versionTransaction;
      transaction.__addToTransactionQueue(function(tx, args, success, failure){
        function error(){
          idbModules.util.throwDOMException(0, "Could not create new object store", arguments);
        }
        
        if (!me.__versionTransaction) {
          idbModules.util.throwDOMException(0, "Invalid State error", me.transaction);
        }
        //key INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE
        var sql = ["CREATE TABLE", storeName, "(key BLOB", createOptions.autoIncrement ? ", inc INTEGER PRIMARY KEY AUTOINCREMENT" : "PRIMARY KEY", ", value BLOB)"].join(" ");
        console.log(sql);
        tx.executeSql(sql, [], function(tx, data){
          tx.executeSql("INSERT INTO __sys__ VALUES (?,?,?,?)", [storeName, createOptions.keyPath, createOptions.autoIncrement ? true : false, JSON.stringify({})], function(){
            result.__setReadyState(true);
            success(result);
          }, error);
        }, error);
      });
      
      // The IndexedDB Specification needs us to return an Object Store immediatly, but WebSQL does not create and return the store immediatly
      // Hence, this can technically be unusable, and we hack around it, by setting the ready value to false
      me.objectStoreNames.push(storeName);
      return result;
    };
    
    IDBDatabase.prototype.deleteObjectStore = function(storeName){
      var error = function(){
        idbModules.util.throwDOMException(0, "Could not delete ObjectStore", arguments);
      }
      var me = this;
      me.objectStoreNames.indexOf(storeName) === -1 && error("Object Store does not exist");
      me.objectStoreNames.splice(me.objectStoreNames.indexOf(storeName), 1);
      
      var transaction = me.__versionTransaction;
      transaction.__addToTransactionQueue(function(tx, args, success, failure){
        if (!me.__versionTransaction) {
          idbModules.util.throwDOMException(0, "Invalid State error", me.transaction);
        }
        me.__db.transaction(function(tx){
          tx.executeSql("SELECT * FROM __sys__ where name = ?", [storeName], function(tx, data){
            if (data.rows.length > 0) {
              tx.executeSql("DROP TABLE " + storeName, [], function(){
                tx.executeSql("DELETE FROM __sys__ WHERE name = ?", [storeName], function(){
                }, error);
              }, error);
            }
          });
        });
      });
    };
    
    IDBDatabase.prototype.close = function(){
      // Don't do anything coz the database automatically closes
    };
    
    IDBDatabase.prototype.transaction = function(storeNames, mode){
      var transaction = new idbModules.IDBTransaction(storeNames, mode, this);
      return transaction;
    };
    
    idbModules["IDBDatabase"] = IDBDatabase;
  })(idbModules);
  (function(idbModules){
    var DEFAULT_DB_SIZE = 4 * 1024 * 1024;
    
    // The sysDB to keep track of version numbers for databases
    var sysdb = window.openDatabase("__sysdb__", 1, "System Database", DEFAULT_DB_SIZE);
    sysdb.transaction(function(tx){
      tx.executeSql("SELECT * FROM dbVersions", [], function(t, data){
        // dbVersions already exists
      }, function(){
        // dbVersions does not exist, so creating it
        sysdb.transaction(function(tx){
          tx.executeSql("CREATE TABLE IF NOT EXISTS dbVersions (name VARCHAR(255), version INT);", [], function(){
          }, function(){
            idbModules.util.throwDOMException("Could not create table __sysdb__ to save DB versions");
          });
        });
      });
    }, function(){
      // sysdb Transaction failed
      idbModules.util.throwDOMException("Could not create table __sysdb__ to save DB versions");
    });
    
    idbModules["shimIndexedDB"] = {
      /**
       * The IndexedDB Method to create a new database and return the DB
       * @param {Object} name
       * @param {Object} version
       */
      open: function(name, version){
        var req = new idbModules.IDBOpenRequest();
        var calledDbCreateError = false;
        function dbCreateError(){
          if (calledDbCreateError) {
            return;
          }
          var e = idbModules.Event("error", arguments);
          req.readyState = "done";
          req.error = "DOMError";
          idbModules.util.callback("onerror", req, [e]);
          calledDbCreateError = true
        }
        
        function openDB(oldVersion){
          var db = window.openDatabase(name, 1, name, DEFAULT_DB_SIZE);
          req.readyState = "done";

          // XXX Version is optional, otherwise use latest.
          if('undefined' === typeof version) {
            version = oldVersion;
          }

          if (version <= 0 || oldVersion > version) {
            idbModules.util.throwDOMException(0, "An attempt was made to open a database using a lower version than the existing version.", version);
          }
          db.transaction(function(tx){
            tx.executeSql("CREATE TABLE IF NOT EXISTS __sys__ (name VARCHAR(255), keyPath VARCHAR(255), autoInc BOOLEAN, indexes BLOB)", [], function(){
              tx.executeSql("SELECT * FROM __sys__", [], function(tx, data){
                var e = idbModules.Event("success");
                req.source = req.result = new idbModules.IDBDatabase(db, name, version, data);
                if (oldVersion < version) {
                  sysdb.transaction(function(systx){
                    systx.executeSql("UPDATE dbVersions set version = ? where name = ?", [version, name], function(){
                      var e = idbModules.Event("success");
                      e.oldVersion = oldVersion, e.newVersion = version;
                      req.transaction = req.result.__versionTransaction = new idbModules.IDBTransaction([], 2, req.source);
                      idbModules.util.callback("onupgradeneeded", req, [e], function(){
                        idbModules.util.callback("onsuccess", req, [e]);
                      });
                    }, dbCreateError);
                  }, dbCreateError);
                } else {
                  idbModules.util.callback("onsuccess", req, [e]);
                }
              }, dbCreateError);
            }, dbCreateError);
          }, dbCreateError);
        };
        
        sysdb.transaction(function(tx){
          tx.executeSql("SELECT * FROM dbVersions where name = ?", [name], function(tx, data){
            if (data.rows.length === 0) {
              // Database with this name does not exist
              tx.executeSql("INSERT INTO dbVersions VALUES (?,?)", [name, version || 1], function(){
                openDB(1);
              }, dbCreateError);
            } else {
              openDB(data.rows.item(0).version);
            }
          }, dbCreateError);
        }, dbCreateError);
        return req;
      },
      
      "deleteDatabase": function(name){
        var req = new idbModules.IDBOpenRequest();
        var calledDBError = false;
        function dbError(msg){
          if (calledDBError) {
            return;
          }
          req.readyState = "done";
          req.error = "DOMError";
          var e = idbModules.Event("error");
          e.message = msg;
          e.debug = arguments;
          idbModules.util.callback("onerror", req, [e]);
          calledDBError = true;
        }
        var version = null;
        function deleteFromDbVersions(){
          sysdb.transaction(function(systx){
            systx.executeSql("DELETE FROM dbVersions where name = ? ", [name], function(){
              req.result = undefined;
              var e = idbModules.Event("success");
              e.newVersion = null, e.oldVersion = version;
              idbModules.util.callback("onsuccess", req, [e]);
            }, dbError);
          }, dbError);
        }
        sysdb.transaction(function(systx){
          systx.executeSql("SELECT * FROM dbVersions where name = ?", [name], function(tx, data){
            if (data.rows.length === 0) {
              dbError("Database does not exist");
              return;
            }
            var version = data.rows.item(0).version;
            var db = window.openDatabase(name, 1, name, DEFAULT_DB_SIZE);
            db.transaction(function(tx){
              tx.executeSql("SELECT * FROM __sys__", [], function(tx, data){
                var tables = data.rows;
                (function deleteTables(i){
                  if (i >= tables.length) {
                    // If all tables are deleted, delete the housekeeping tables
                    tx.executeSql("DROP TABLE __sys__", [], function(){
                      // Finally, delete the record for this DB from sysdb
                      deleteFromDbVersions();
                    }, dbError);
                  } else {
                    // Delete all tables in this database, maintained in the sys table
                    tx.executeSql("DROP TABLE " + tables.item(i).name, [], function(){
                      deleteTables(i + 1);
                    }, function(){
                      deleteTables(i + 1);
                    });
                  }
                }(0));
              }, function(e){
                // __sysdb table does not exist, but that does not mean delete did not happen
                deleteFromDbVersions();
              });
            }, dbError);
          });
        }, dbError);
        return req;
      },
      "cmp": function(key1, key2){
        return idbModules.Key.encode(key1) > idbModules.Key.encode(key2) ? 1 : key1 == key2 ? 0 : -1;
      }
    };
    
    window.indexedDB = idbModules["shimIndexedDB"];
  })(idbModules);

}(window));