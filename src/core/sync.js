const Promise = require('bluebird');
const Store = require('./stores/store');
const Query = require('./query');
const DataPolicy = require('./enums').DataPolicy;
const reduce = require('lodash/collection/reduce');
const enabledSymbol = Symbol();
const syncStoreName = process.env.KINVEY_SYNC_STORE_NAME || 'sync';

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

    const syncStore = new Store(syncStoreName, options);
    const promise = syncStore.find(null, options).then(syncModels => {
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

    const syncStore = new Store(syncStoreName, options);
    const query = new Query();
    query.greaterThan('size', 0);
    const promise = syncStore.find(query, options).then(syncModels => {
      const promises = syncModels.map(syncModel => {
        const store = new Store(syncModel.id, options);
        return store.push();
      });

      return Promise.all(promises);
    });

    return promise;
  }

  static sync(options = {}) {
    options.dataPolicy = DataPolicy.LocalOnly;

    const syncStore = new Store(syncStoreName, options);
    const promise = syncStore.find(null, options).then(syncModels => {
      const promises = syncModels.map(syncModel => {
        const store = new Store(syncModel.id, options);
        return store.sync();
      });

      return Promise.all(promises);
    });

    return promise;
  }

  static clear(query, options = {}) {
    options.dataPolicy = DataPolicy.LocalOnly;
    const syncStore = new Store(syncStoreName, options);
    const promise = syncStore.clear(query, options);
    return promise;
  }
}

// Set sync default state
Sync[enabledSymbol] = process.env.KINVEY_SYNC_DEFAULT_STATE || true;
module.exports = Sync;
