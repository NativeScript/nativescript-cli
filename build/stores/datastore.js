'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DataStore = exports.DataStoreType = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _syncstore = require('./syncstore');

var _networkstore = require('./networkstore');

var _userstore = require('./userstore');

var _filestore = require('./filestore');

var _cachestore = require('./cachestore');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Enum for DataStore types.
 */
var DataStoreType = {
  Sync: 'Sync',
  Cache: 'Cache',
  Network: 'Network',
  User: 'User',
  File: 'File'
};
Object.freeze(DataStoreType);
exports.DataStoreType = DataStoreType;

var DataStore = exports.DataStore = function () {
  function DataStore() {
    _classCallCheck(this, DataStore);
  }

  _createClass(DataStore, null, [{
    key: 'getInstance',

    /**
     * Returns an instance of the Store class based on the type provided.
     *
     * @param  {string}       [name]                      Name of the collection.
     * @param  {StoreType}    [type=DataStoreType.Cache]  Type of store to return.
     * @return {Object}                                   Store
     */
    value: function getInstance(name) {
      var type = arguments.length <= 1 || arguments[1] === undefined ? DataStoreType.Cache : arguments[1];

      var store = void 0;

      switch (type) {
        case DataStoreType.Sync:
          store = new _syncstore.SyncStore(name);
          break;
        case DataStoreType.Network:
          store = new _networkstore.NetworkStore(name);
          break;
        case DataStoreType.User:
          store = new _userstore.UserStore();
          break;
        case DataStoreType.File:
          store = new _filestore.FileStore();
          break;
        case DataStoreType.Cache:
        default:
          store = new _cachestore.CacheStore(name);
      }

      return store;
    }
  }]);

  return DataStore;
}();
//# sourceMappingURL=datastore.js.map
