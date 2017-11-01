/* eslint-disable */
var replace = require('replace-in-file');

module.exports = function() {
  return replace({
    files: './core/live/live-service.js',
    from: /require\('pubnub'\);/g,
    to: "require('pubnub/lib/nativescript');"
  })
    .then(changes => {
      console.log('Modified files:', changes.join(', '));
    })
    .catch(error => {
      console.log('Error occurred:', error);
    });
}
