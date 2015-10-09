import Serializer from './serializer';
import assign from 'lodash/object/assign';
import when from 'when';
import localStorage from 'humble-localstorage';

export default class LocalStorageAdapter {
  constructor(dbInfo = {}) {
    dbInfo = assign({
      name: 'kinvey',
      collection: 'data'
    }, dbInfo);

    this.keyPrefix = `${dbInfo.name}.${dbInfo.collection}`;
  }

  generateKey(id) {
    return `${this.keyPrefix}.${id}`;
  }

  find() {

  }

  count() {

  }

  findAndModify() {

  }

  group() {

  }

  batch() {

  }

  clean() {

  }

  clear() {

  }

  get(id) {
    const value = localStorage.getItem(this.generateKey(id));
    const serializer = new Serializer();
    const promise = serializer.deserialize(value);
    return promise;
  }

  save(doc) {
    if (!doc) {
      return when.resolve(null);
    }

    const serializer = new Serializer();
    const promise = serializer.serialize(doc).then(value => {
      try {
        localStorage.setItem(this.generateKey(doc._id), value);
        return doc;
      } catch (err) {
        // Make error specific
        if (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
          throw err;
        }

        throw err;
      }
    });

    return promise;
  }

  delete(id) {
    const promise = when.promise(resolve => {
      localStorage.removeItem(this.generateKey(id));
      resolve();
    });
    return promise;
  }

  static isSupported() {
    const kinvey = 'kinvey';

    try {
      localStorage.setItem(kinvey, kinvey);
      localStorage.removeItem(kinvey);
      return true;
    } catch (err) {
      return false;
    }
  }
}
