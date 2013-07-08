// `Storage` adapter for
// [localStorage](http://www.w3.org/TR/webstorage/#the-localstorage-attribute).
if('undefined' !== typeof localStorage) {
  var localStorageAdapter = {
    /**
     * @augments {Storage._destroy}
     */
    _destroy: function(key) {
      localStorage.removeItem(key);
      return Kinvey.Defer.resolve(null);
    },

    /**
     * @augments {Storage._get}
     */
    _get: function(key) {
      var value = localStorage.getItem(key);
      return Kinvey.Defer.resolve(value ? JSON.parse(value) : null);
    },

    /**
     * @augments {Storage._save}
     */
    _save: function(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
      return Kinvey.Defer.resolve(null);
    }
  };

  // Use `localStorage` adapter.
  Storage.use(localStorageAdapter);
}