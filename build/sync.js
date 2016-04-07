'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Sync = undefined;

var _babybird = require('babybird');

var _babybird2 = _interopRequireDefault(_babybird);

var _datastore = require('./stores/datastore');

var _query = require('./query');

var _enums = require('./enums');

var _reduce = require('lodash/reduce');

var _reduce2 = _interopRequireDefault(_reduce);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var syncCollectionName = process.env.KINVEY_SYNC_COLLECTION_NAME || 'sync';
var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
var enabled = process.env.KINVEY_SYNC_DEFAULT_STATE || true;

var Sync = {
  isEnabled: function isEnabled() {
    return enabled;
  },
  enable: function enable() {
    enabled = true;
  },
  disable: function disable() {
    enabled = false;
  },
  count: function count(query, options) {
    var syncStore = _datastore.DataStore.getInstance(syncCollectionName, _enums.DataStoreType.Sync);
    var promise = syncStore.find(query, options).then(function (syncData) {
      return (0, _reduce2.default)(syncData, function (result, data) {
        return result + data.size;
      }, 0);
    });
    return promise;
  },
  push: function push(options) {
    var syncStore = _datastore.DataStore.getInstance(syncCollectionName, _enums.DataStoreType.Sync);
    var query = new _query.Query();
    query.greaterThan('size', 0);
    var promise = syncStore.find(query, options).then(function (syncData) {
      var promises = syncData.map(function (data) {
        var store = _datastore.DataStore.getInstance(data[idAttribute], _enums.DataStoreType.Sync);
        return store.push();
      });
      return _babybird2.default.all(promises);
    });
    return promise;
  },
  sync: function sync() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var syncStore = _datastore.DataStore.getInstance(syncCollectionName, _enums.DataStoreType.Sync);
    var promise = syncStore.find(null, options).then(function (syncData) {
      var promises = syncData.map(function (data) {
        var store = _datastore.DataStore.getInstance(data[idAttribute], _enums.DataStoreType.Sync);
        return store.sync();
      });
      return _babybird2.default.all(promises);
    });
    return promise;
  }
};

exports.Sync = Sync;