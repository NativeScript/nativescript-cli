(function() {

  // Utilities.
  var fs = require('fs');
  var filename = __dirname + '/.kinvey';

  // Load cache.
  var cache = {};// container.
  try {
    cache = JSON.parse(fs.readFileSync(filename, 'utf8'));
  }
  catch(_) {
    // Will fail when file does not exist, or is malformed.
  }

  // Define the Storage class.
  var Storage = {
    get: function(key) {
      return cache[key] || null;
    },
    set: function(key, value) {
      cache[key] = value.toJSON();

      // Update file cache.
      fs.writeFileSync(filename, JSON.stringify(cache), 'utf8');
    },
    remove: function(key) {
      delete cache[key];

      // Update file cache.
      fs.writeFileSync(filename, JSON.stringify(cache), 'utf8');
    }
  };

}());