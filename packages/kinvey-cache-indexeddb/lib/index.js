"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.register = register;

var _kinveyCache = require("kinvey-cache");

var IndexedDB = _interopRequireWildcard(require("./indexeddb"));

function register() {
  (0, _kinveyCache.register)(IndexedDB);
}