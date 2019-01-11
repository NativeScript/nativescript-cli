"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.get = get;
exports.set = set;

var _config = require("./config");

/**
 * The version of your app. It will sent with Kinvey API requests
 * using the X-Kinvey-Api-Version header.
 *
 * @return {string} The version of your app.
 */
function get() {
  var config = (0, _config.get)();
  return config.appVersion;
}
/**
 * Set the version of your app. It will sent with Kinvey API requests
 * using the X-Kinvey-Api-Version header.
 *
 * @param  {string} appVersion  App version.
 */


function set(appVersion) {
  var config = (0, _config.get)();
  config.appVersion = appVersion;
  (0, _config.set)(config);
  return true;
}