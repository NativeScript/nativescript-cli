"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DataStoreCache = void 0;

var _kinveyCache = require("kinvey-cache");

class DataStoreCache extends _kinveyCache.Cache {
  constructor(appKey, collectionName, tag = '') {
    if (tag && !/^[a-zA-Z0-9-]+$/.test(tag)) {
      throw new Error('A tag can only contain letters, numbers, and "-".');
    }

    super(`${appKey}${tag}`, collectionName);
  }

}

exports.DataStoreCache = DataStoreCache;