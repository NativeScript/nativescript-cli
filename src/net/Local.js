(function() {

  // TODO exclude _count, _login etc.
  // TODO support for > 1 entity at the time (collections, queries etc.)

  /*globals window*/

  // Obtain reference to indexedDB object.
  var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
  var IDBTransaction = window.IDBTransaction || window.mozIDBTransaction || window.webkitIDBTransaction;

  // Define the Kinvey.Net.Local network adapter.
  Kinvey.Net.Local = Base.extend({
    data: null,
    operation: Kinvey.Net.READ,

    constructor: function(api, collection, id) {
      // IndexedDB doesn't allow dashes in collection names. Kinvey does not allow
      // underscores, so it is safe to swap the two.
      this.collection = collection.replace('-', '_');

      this.api = api;
      this.id = id;

      this.dbName = 'Kinvey.' + Kinvey.appKey;
    },

    send: function(options) {
      options || (options = {});
      options.success || (options.success = function() { });
      options.error || (options.error = function() { });

      var request = indexedDB.open(this.dbName);
      request.onsuccess = bind(this, function() {
        var db = request.result;
        switch(this.operation) {
          case Kinvey.Net.CREATE:
          case Kinvey.Net.UPDATE:
            if((db.objectStoreNames.contains && !db.objectStoreNames.contains(this.collection))
             || (db.objectStoreNames.indexOf && -1 === db.objectStoreNames.indexOf(this.collection))) {
              var version = db.version ? db.version + 1 : 1000;
              db.close();
              var request2 = indexedDB.open(this.dbName, version);
              request2.onupgradeneeded = bind(this, function() {
                var db = request2.result;
                db.createObjectStore(this.collection, {
                  autoIncrement: true,
                  keyPath: '_id'
                });
              });
              request2.onsuccess = bind(this, function() {
                var db = request2.result;
                
                if(db.setVersion && '' === db.version) {
                  var verReq = db.setVersion(version);
                  verReq.onsuccess = bind(this, function() {
                    request2.onupgradeneeded();
                    this._save(db, options);
                  });
                  verReq.onerror = function() {
                    options.error({ message: 'Unknown error' });
                  };
                }
                else {
                  this._save(db, options);
                }
              });
              request2.onerror = function() {
                options.error({ message: 'Unknown error' });
              };
            }
            else {
              this._save(db, options);
            }
            break;
          case Kinvey.Net.READ:
            this._read(db, options);
            break;
          case Kinvey.Net.DELETE:
            this._destroy(db, options);
            break;
          default:
            throw new Error('Operation ' + this.operation + ' is not supported');
        }
      });
      request.onerror = function() {
        options.error({ message: 'Unknown error' });
      };
    },

    _destroy: function(db, options) {
      // Check if store is available.
      if((db.objectStoreNames.contains && !db.objectStoreNames.contains(this.collection))
          || (db.objectStoreNames.indexOf && -1 === db.objectStoreNames.indexOf(this.collection))) {
        null != this.id ? options.error({ message: 'Not found' }) : options.success();
        return;
      }

      var store = db.transaction([this.collection], IDBTransaction.READ_WRITE).objectStore(this.collection);
      var transaction = store['delete'](this.id);
      transaction.onsuccess = function() {
        options.success();
      };
      transaction.onerror = function() {
        options.error({ message: 'Unknown error' });
      };
    },

    _read: function(db, options) {
      // Check if store is available.
      if((db.objectStoreNames.contains && !db.objectStoreNames.contains(this.collection))
          || (db.objectStoreNames.indexOf && -1 === db.objectStoreNames.indexOf(this.collection))) {
        options.error({ message: 'Not found' });
        return;
      }
      
      // Retrieve entity.
      var store = db.transaction([this.collection], 'readonly').objectStore(this.collection);
      var transaction = store.get(this.id);
      transaction.onsuccess = function() {
        if(null != transaction.result) {
          options.success(transaction.result);
        }
        else {
          options.error({ message: 'Not found' });
        }
      };
      transaction.onerror = function() {
        options.error({ message: 'Unknown error' });
      };
    },
    _save: function(db, options) {
      var store = db.transaction([this.collection], IDBTransaction.READ_WRITE).objectStore(this.collection);
      var transaction = store.put(this.data);
      transaction.onsuccess = bind(this, function() {
        this.data[store.keyPath] = transaction.result;
        options.success(this.data);
      });
      transaction.onerror = function() {
        options.error({ message: 'Unknown error' });
      };
    },

    setData: function(data) {
      this.data = data;
    },
    setOperation: function(operation) {
      this.operation = operation;
    },
    setQuery: function(query) { }
  });

}());