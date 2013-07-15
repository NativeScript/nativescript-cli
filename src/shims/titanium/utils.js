// `Storage` adapter for Titanium.

// The storage methods are executed in the background. Therefore, implement a
// queue to force the background processes to execute serially.
var storagePromise = Kinvey.Defer.resolve(null);

/**
 * @private
 * @namespace
 */
var TiAppStorage = {
  /**
   * @augments {Storage._destroy}
   */
  _destroy: function(key) {
    // Remove the item on our turn.
    storagePromise = storagePromise.then(function() {
      Titanium.App.Properties.removeProperty(key);
      return Kinvey.Defer.resolve(null);
    });
    return storagePromise;
  },

  /**
   * @augments {Storage._get}
   */
  _get: function(key) {
    // Retrieve the item on our turn.
    storagePromise = storagePromise.then(function() {
      var value = Titanium.App.Properties.getObject(key, null);
      return Kinvey.Defer.resolve(value);
    });
    return storagePromise;
  },

  /**
   * @augments {Storage._save}
   */
  _save: function(key, value) {
    // Save the item on our turn.
    storagePromise = storagePromise.then(function() {
      Titanium.App.Properties.setObject(key, value);
      return Kinvey.Defer.resolve(null);
    });
    return storagePromise;
  }
};

// Use the adapter.
Storage.use(TiAppStorage);