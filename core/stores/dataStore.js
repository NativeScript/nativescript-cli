'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _networkStore = require('./networkStore');

var _networkStore2 = _interopRequireDefault(_networkStore);

var _cacheStore = require('./cacheStore');

var _cacheStore2 = _interopRequireDefault(_cacheStore);

var _syncStore = require('./syncStore');

var _syncStore2 = _interopRequireDefault(_syncStore);

var _enums = require('../enums');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var dataStoresMap = new Map();

var DataStore = function () {
  function DataStore() {
    _classCallCheck(this, DataStore);
  }

  _createClass(DataStore, null, [{
    key: 'getInstance',

    /**
     * Returns an instance of the Store class based on the type provided.
     *
     * @param  {string}       name                      Name of the collection.
     * @param  {StoreType}    [type=StoreType.Cache]    Type of store to return.
     * @return {Store}                                  Store
     */
    value: function getInstance(name) {
      var type = arguments.length <= 1 || arguments[1] === undefined ? _enums.DataStoreType.Cache : arguments[1];

      var store = dataStoresMap.get(name + '_' + type);

      if (!store) {
        switch (type) {
          case _enums.DataStoreType.Sync:
            store = new _syncStore2.default(name);
            break;
          case _enums.DataStoreType.Network:
            store = new _networkStore2.default(name);
            break;
          case _enums.DataStoreType.Cache:
          default:
            store = new _cacheStore2.default(name);
        }

        dataStoresMap.set(name + '_' + type, store);
      }

      return store;
    }
  }]);

  return DataStore;
}();

exports.default = DataStore;