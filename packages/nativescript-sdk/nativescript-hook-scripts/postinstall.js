try {
  var path = require('path');
  require('nativescript-hook')(path.join(__dirname, '..')).postinstall();
} catch (error) {
  // Catch the error
}
