import CoreObject from './object';
import DataStore from './datastore';
import LocalDataStore from './localDataStore';

class Query extends CoreObject {
  constructor(collection) {
    this.collection = collection;
  }

  get useLocalDataStore() {
    return this._useLocalDataStore === true ? true : false;
  }

  set useLocalDataStore(useLocalDataStore = false) {
    this._useLocalDataStore = useLocalDataStore;
  }

  find(options = {}) {
    let promise;

    if (this.useLocalDataStore) {
      promise = LocalDataStore.find(this.collection, options);
    } else {
      promise = DataStore.find(this.collection, options);
    }

    return promise;
  }

  get(docId, options = {}) {
    return docId;
  }

  execute() {
    return null;
  }
}

export default Query;
