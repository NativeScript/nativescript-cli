"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.get = get;
exports.set = set;
exports.remove = remove;

var _utils = require("./utils");

function get() {
  var key = (0, _utils.getKey)();
  var session = window.localStorage.getItem(key);

  if (session) {
    return JSON.parse(session);
  }

  return null;
}

function set(session) {
  var key = (0, _utils.getKey)();
  window.localStorage.setItem(key, JSON.stringify(session));
  return true;
}

function remove() {
  var key = (0, _utils.getKey)();
  window.localStorage.removeItem(key);
  return true;
}