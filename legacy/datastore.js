import { DataStore as CoreDataStore } from '../src/stores/datastore';
import { DataStoreType } from '../src/enums';
import { wrapCallbacks } from './utils';

function getDataStoreInstance(collection, options = {}) {
  let store = CoreDataStore.getInstance(collection);

  if (options.offline && !options.fallback) {
    store = CoreDataStore.getInstance(collection, DataStoreType.Sync);
  } else {
    store = CoreDataStore.getInstance(collection, DataStoreType.Network);
  }

  return store;
}

export class DataStore {
  static find(collection, query, options = {}) {
    const store = getDataStoreInstance(collection, options);
    const promise = store.find(query, options);
    return wrapCallbacks(promise, options);
  }

  static get(collection, id, options = {}) {
    const store = getDataStoreInstance(collection, options);
    const promise = store.findById(id, options);
    return wrapCallbacks(promise, options);
  }

  static save(collection, entity, options = {}) {
    const store = getDataStoreInstance(collection, options);
    const promise = store.save(entity, options);
    return wrapCallbacks(promise, options);
  }

  static update(collection, entity, options = {}) {
    const store = getDataStoreInstance(collection, options);
    const promise = store.save(entity, options);
    return wrapCallbacks(promise, options);
  }

  static clean(collection, query, options = {}) {
    const store = getDataStoreInstance(collection, options);
    const promise = store.remove(query, options);
    return wrapCallbacks(promise, options);
  }

  static destroy(collection, id, options = {}) {
    const store = getDataStoreInstance(collection, options);
    const promise = store.removeById(id, options);
    return wrapCallbacks(promise, options);
  }

  static count(collection, query, options = {}) {
    const store = getDataStoreInstance(collection, options);
    const promise = store.count(query, options);
    return wrapCallbacks(promise, options);
  }

  static group(collection, aggregation, options = {}) {
    const store = getDataStoreInstance(collection, options);
    const promise = store.group(aggregation, options);
    return wrapCallbacks(promise, options);
  }
}
