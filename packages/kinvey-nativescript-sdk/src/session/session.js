"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.get = get;
exports.set = set;
exports.remove = remove;

var _nativescriptSecureStorage = require("nativescript-secure-storage");

var _utils = require("./utils");

var secureStorage = new _nativescriptSecureStorage.SecureStorage();

function get() {
  var key = (0, _utils.getKey)();
  var session = secureStorage.getSync({
    key: key
  });

  if (session) {
    return JSON.parse(session);
  }

  return null;
}

function set(session) {
  var key = (0, _utils.getKey)();
  return secureStorage.setSync({
    key: key,
    value: JSON.stringify(session)
  });
}

function remove() {
  var key = (0, _utils.getKey)();
  return secureStorage.removeSync({
    key: key
  });
}