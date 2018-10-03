"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.collection = collection;
exports.clearCache = clearCache;
exports.DataStoreType = void 0;

var _kinveyApp = require("kinvey-app");

var _kinveyCache = require("kinvey-cache");

var _networkstore = _interopRequireDefault(require("./networkstore"));

var _cachestore = _interopRequireDefault(require("./cachestore"));

const DataStoreType = {
  Cache: 'Cache',
  Network: 'Network',
  Sync: 'Sync'
};
exports.DataStoreType = DataStoreType;

function collection(collectionName, type = DataStoreType.Cache, options = {}) {
  if (collectionName == null || typeof collectionName !== 'string') {
    throw new Error('A collection name is required and must be a string.');
  }

  const _getConfig = (0, _kinveyApp.getConfig)(),
        appKey = _getConfig.appKey;

  let datastore;

  if (type === DataStoreType.Network) {
    datastore = new _networkstore.default(appKey, collectionName);
  } else if (type === DataStoreType.Cache) {
    datastore = new _cachestore.default(appKey, collectionName, options.tag, Object.assign({}, options, {
      autoSync: true
    }));
  } else if (type === DataStoreType.Sync) {
    datastore = new _cachestore.default(appKey, collectionName, options.tag, Object.assign({}, options, {
      autoSync: false
    }));
  } else {
    throw new Error('Unknown data store type.');
  }

  return datastore;
}

async function clearCache() {
  const _getConfig2 = (0, _kinveyApp.getConfig)(),
        appKey = _getConfig2.appKey;

  await (0, _kinveyCache.clearAll)(appKey);
}