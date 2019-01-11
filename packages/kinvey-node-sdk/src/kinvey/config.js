"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.get = get;
exports.set = set;
exports.remove = remove;

var _kinvey = _interopRequireDefault(require("../errors/kinvey"));

var map = new Map();
var appKey;

function getKey() {
  if (appKey) {
    return "".concat(appKey, ".config");
  }

  return undefined;
}

function get() {
  var key = getKey();

  if (key) {
    var config = map.get(key);

    if (config) {
      return config;
    }
  }

  throw new _kinvey.default('You have not initialized the Kinvey SDK.');
}

function set(config) {
  if (config && config.appKey) {
    appKey = config.appKey;
    var key = getKey();
    map.set(key, config);
    return true;
  }

  return false;
}

function remove() {
  var key = getKey();

  if (key) {
    map.delete(key);
    return true;
  }

  return false;
}