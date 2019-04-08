try {
  var path = require('path');
  require('nativescript-hook')(path.join(__dirname, '..')).preuninstall();
} catch (error) {
  // Catch the error
}
