"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.get = get;
exports.StorageProvider = void 0;

var _config = require("../kinvey/config");

var _kinvey = _interopRequireDefault(require("../errors/kinvey"));

var indexedDB = _interopRequireWildcard(require("./indexeddb"));

var memory = _interopRequireWildcard(require("./memory"));

var webSQL = _interopRequireWildcard(require("./websql"));

var StorageProvider = {
  IndexedDB: 'IndexedDB',
  Memory: 'Memory',
  WebSQL: 'WebSQL'
}; // eslint-disable-next-line import/prefer-default-export

exports.StorageProvider = StorageProvider;

function get() {
  var _getConfig = (0, _config.get)(),
      _getConfig$storage = _getConfig.storage,
      storage = _getConfig$storage === void 0 ? StorageProvider.WebSQL : _getConfig$storage;

  if (storage === StorageProvider.IndexedDB) {
    return indexedDB;
  } else if (storage === StorageProvider.Memory) {
    return memory;
  } else if (storage === StorageProvider.WebSQL) {
    return webSQL;
  }

  throw new _kinvey.default('You must override the default cache store.');
}