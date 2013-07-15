// `Storage` adapter for
// [localStorage](http://www.w3.org/TR/webstorage/#the-localstorage-attribute).
if('undefined' !== typeof localStorage) {
  // The storage methods are executed in the background. Therefore, implement a
  // queue to force the background processes to execute serially.
  var storagePromise = Kinvey.Defer.resolve(null);

  /**
   * @private
   * @namespace
   */
  var localStorageAdapter = {
    /**
     * @augments {Storage._destroy}
     */
    _destroy: function(key) {
      // Remove the item on our turn.
      storagePromise = storagePromise.then(function() {
        localStorage.removeItem(key);
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
        var value = localStorage.getItem(key);
        return Kinvey.Defer.resolve(value ? JSON.parse(value) : null);
      });
      return storagePromise;
    },

    /**
     * @augments {Storage._save}
     */
    _save: function(key, value) {
      // Save the item on our turn.
      storagePromise = storagePromise.then(function() {
        localStorage.setItem(key, JSON.stringify(value));
        return Kinvey.Defer.resolve(null);
      });
      return storagePromise;
    }
  };

  // Use `localStorage` adapter.
  Storage.use(localStorageAdapter);
}