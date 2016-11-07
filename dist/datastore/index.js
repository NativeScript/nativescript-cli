'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UserStore = exports.SyncStore = exports.NetworkStore = exports.FileStore = exports.DataStoreType = exports.CacheStore = undefined;

var _cachestore = require('./src/cachestore');

var _cachestore2 = _interopRequireDefault(_cachestore);

var _datastore = require('./src/datastore');

var _datastore2 = _interopRequireDefault(_datastore);

var _filestore = require('./src/filestore');

var _filestore2 = _interopRequireDefault(_filestore);

var _networkstore = require('./src/networkstore');

var _networkstore2 = _interopRequireDefault(_networkstore);

var _syncstore = require('./src/syncstore');

var _syncstore2 = _interopRequireDefault(_syncstore);

var _userstore = require('./src/userstore');

var _userstore2 = _interopRequireDefault(_userstore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.CacheStore = _cachestore2.default;
exports.DataStoreType = _datastore.DataStoreType;
exports.FileStore = _filestore2.default;
exports.NetworkStore = _networkstore2.default;
exports.SyncStore = _syncstore2.default;
exports.UserStore = _userstore2.default;
exports.default = _datastore2.default;