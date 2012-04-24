(function() {

  // Define the Storage class.
  // For the time being, this class does not implement any "real" storage.
  var cache = {};
  var Storage = {
    get: function(key) {
      var value = cache[key];
      return value ? JSON.parse(value) : null;
    },
    set: function(key, value) {
      cache[key] = JSON.stringify(value);
    },
    remove: function(key) {
      delete cache[key];
    }
  };

}());