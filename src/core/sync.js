import DataStore from './stores/dataStore';
import Query from './query';
import { DataStoreType } from './enums';
import reduce from 'lodash/reduce';
const enabledSymbol = Symbol();
const syncCollectionName = process.env.KINVEY_SYNC_COLLECTION_NAME || 'sync';

const Sync = {
  isEnabled() {
    return Sync[enabledSymbol];
  },

  enable() {
    Sync[enabledSymbol] = true;
  },

  disable() {
    Sync[enabledSymbol] = false;
  },

  count(query, options) {
    const syncStore = DataStore.getInstance(syncCollectionName, DataStoreType.Sync);
    const promise = syncStore.find(query, options).then(syncData => {
      return reduce(syncData, function (result, data) {
        return result + data.size;
      }, 0);
    });
    return promise;
  },

  push(options) {
    const syncStore = DataStore.getInstance(syncCollectionName, DataStoreType.Sync);
    const query = new Query();
    query.greaterThan('size', 0);
    const promise = syncStore.find(query, options).then(syncData => {
      const promises = syncData.map(data => {
        const store = DataStore.getInstance(data._id, DataStoreType.Sync);
        return store.push();
      });
      return Promise.all(promises);
    });
    return promise;
  },

  sync(options = {}) {
    const syncStore = DataStore.getInstance(syncCollectionName, DataStoreType.Sync);
    const promise = syncStore.find(null, options).then(syncData => {
      const promises = syncData.map(data => {
        const store = DataStore.getInstance(data._id, DataStoreType.Sync);
        return store.sync();
      });
      return Promise.all(promises);
    });
    return promise;
  }
};

// Set sync default state
Sync[enabledSymbol] = process.env.KINVEY_SYNC_DEFAULT_STATE || true;
export default Sync;
