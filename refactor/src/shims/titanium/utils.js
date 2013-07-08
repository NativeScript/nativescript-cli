// `Storage` adapter for Titanium.
var TiAppStorage = {
  /**
   * @augments {Storage._destroy}
   */
  _destroy: function(key) {
    Titanium.App.Properties.removeProperty(key);
    return Kinvey.Defer.resolve(null);
  },

  /**
   * @augments {Storage._get}
   */
  _get: function(key) {
    var value = Titanium.App.Properties.getObject(key, null);
    return Kinvey.Defer.resolve(value);
  },

  /**
   * @augments {Storage._save}
   */
  _save: function(key, value) {
    Titanium.App.Properties.setObject(key, value);
    return Kinvey.Defer.resolve(null);
  }
};

// Use the adapter.
Storage.use(TiAppStorage);