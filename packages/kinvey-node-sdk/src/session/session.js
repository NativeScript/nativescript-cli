"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.get = get;
exports.set = set;
exports.remove = remove;

var _utils = require("./utils");

var STORE = new Map();

function get() {
  var key = (0, _utils.getKey)();
  return STORE.get(key);
}

function set(session) {
  var key = (0, _utils.getKey)();
  STORE.set(key, session);
  return true;
}

function remove() {
  var key = (0, _utils.getKey)();
  STORE.delete(key);
  return true;
}