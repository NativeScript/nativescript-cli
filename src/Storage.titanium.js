(function() {

  // Define the Storage class.
  var Storage = {
    get: function(key) {
      var value = Titanium.App.Properties.getString(key);
      return value ? JSON.parse(value) : null;
    },
    set: function(key, value) {
      Titanium.App.Properties.setString(key, JSON.stringify(value));
    },
    remove: function(key) {
      Titanium.App.Properties.removeProperty(key);
    }
  };

}());