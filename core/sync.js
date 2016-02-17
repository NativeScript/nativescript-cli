'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _dataStore = require('./stores/dataStore');

var _dataStore2 = _interopRequireDefault(_dataStore);

var _query = require('./query');

var _query2 = _interopRequireDefault(_query);

var _enums = require('./enums');

var _reduce = require('lodash/reduce');

var _reduce2 = _interopRequireDefault(_reduce);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var enabledSymbol = Symbol();
var syncCollectionName = process.env.KINVEY_SYNC_COLLECTION_NAME || 'sync';

var Sync = {
  isEnabled: function isEnabled() {
    return Sync[enabledSymbol];
  },
  enable: function enable() {
    Sync[enabledSymbol] = true;
  },
  disable: function disable() {
    Sync[enabledSymbol] = false;
  },
  count: function count(query, options) {
    var syncStore = _dataStore2.default.getInstance(syncCollectionName, _enums.DataStoreType.Sync);
    var promise = syncStore.find(query, options).then(function (syncData) {
      return (0, _reduce2.default)(syncData, function (result, data) {
        return result + data.size;
      }, 0);
    });
    return promise;
  },
  push: function push(options) {
    var syncStore = _dataStore2.default.getInstance(syncCollectionName, _enums.DataStoreType.Sync);
    var query = new _query2.default();
    query.greaterThan('size', 0);
    var promise = syncStore.find(query, options).then(function (syncData) {
      var promises = syncData.map(function (data) {
        var store = _dataStore2.default.getInstance(data._id, _enums.DataStoreType.Sync);
        return store.push();
      });
      return Promise.all(promises);
    });
    return promise;
  },
  sync: function sync() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var syncStore = _dataStore2.default.getInstance(syncCollectionName, _enums.DataStoreType.Sync);
    var promise = syncStore.find(null, options).then(function (syncData) {
      var promises = syncData.map(function (data) {
        var store = _dataStore2.default.getInstance(data._id, _enums.DataStoreType.Sync);
        return store.sync();
      });
      return Promise.all(promises);
    });
    return promise;
  }
};

// Set sync default state
Sync[enabledSymbol] = process.env.KINVEY_SYNC_DEFAULT_STATE || true;
exports.default = Sync;