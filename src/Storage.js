(function() {

  /*globals localStorage*/

  // Define the Storage class. Simple wrapper around the localStorage interface.
  var Storage = {
    get: function(key) {
      var value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    },
    set: function(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    },
    remove: function(key) {
      localStorage.removeItem(key);
    }
  };

}());