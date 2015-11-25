const Promise = require('bluebird');
const Collection = require('./collections/collection');
const Query = require('./query');
const DataPolicy = require('./enums').DataPolicy;
const reduce = require('lodash/collection/reduce');
const enabledSymbol = Symbol();
const syncCollectionName = process.env.KINVEY_SYNC_COLLECTION_NAME || 'sync';

class Sync {
  static isEnabled() {
    return Sync[enabledSymbol];
  }

  static enable() {
    Sync[enabledSymbol] = true;
  }

  static disable() {
    Sync[enabledSymbol] = false;
  }

  static count(options = {}) {
    options.dataPolicy = DataPolicy.LocalOnly;

    const syncCollection = new Collection(syncCollectionName, options);
    const promise = syncCollection.find(null, options).then(syncModels => {
      return reduce(syncModels, function(result, syncModel) {
        return result + syncModel.get('size');
      }, 0);
    }).catch(() => {
      return 0;
    });

    return promise;
  }

  static push(options = {}) {
    options.dataPolicy = DataPolicy.LocalOnly;

    const syncCollection = new Collection(syncCollectionName, options);
    const query = new Query();
    query.greaterThan('size', 0);
    const promise = syncCollection.find(query, options).then(syncModels => {
      const promises = syncModels.map(syncModel => {
        const collection = new Collection(syncModel.id, options);
        return collection.push();
      });

      return Promise.all(promises);
    });

    return promise;
  }

  static sync(options = {}) {
    options.dataPolicy = DataPolicy.LocalOnly;

    const syncCollection = new Collection(syncCollectionName, options);
    const promise = syncCollection.find(null, options).then(syncModels => {
      const promises = syncModels.map(syncModel => {
        const collection = new Collection(syncModel.id, options);
        return collection.sync();
      });

      return Promise.all(promises);
    });

    return promise;
  }

  static clear(query, options = {}) {
    options.dataPolicy = DataPolicy.LocalOnly;
    options.skipSync = true;

    const syncCollection = new Collection(syncCollectionName, options);
    const promise = syncCollection.clear(query, options);
    return promise;
  }
}

// Set sync default state
Sync[enabledSymbol] = process.env.KINVEY_SYNC_DEFAULT_STATE || true;
module.exports = Sync;
