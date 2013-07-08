// Keep all data in memory.
var dataStorage = {};

// `Storage` adapter for [Node.js](http://nodejs.org/).
var MemoryStorage = {
  /**
   * @augments {Storage._destroy}
   */
  _destroy: function(key) {
    delete dataStorage[key];
    return Kinvey.Defer.resolve(null);
  },

  /**
   * @augments {Storage._get}
   */
  _get: function(key) {
    return Kinvey.Defer.resolve(dataStorage[key] || null);
  },

  /**
   * @augments {Storage._save}
   */
  _save: function(key, value) {
    dataStorage[key] = value;
    return Kinvey.Defer.resolve(null);
  }
};

// Use memory adapter.
Storage.use(MemoryStorage);