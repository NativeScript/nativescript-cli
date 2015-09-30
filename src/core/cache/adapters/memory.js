import assign from 'lodash/object/assign';
import when from 'when';
const data = {};

export default class MemoryAdapter {
  constructor(dbInfo = {}) {
    dbInfo = assign({
      name: 'kinvey',
      collection: 'data'
    }, dbInfo);

    data[dbInfo.name] = data[dbInfo.name] || {};
    this.collection = data[dbInfo.name][dbInfo.collection] = data[dbInfo.name][dbInfo.collection] || {};
  }

  find(query) {

  }

  count(query) {

  }

  findAndModify(id, fn) {

  }

  group(aggregation) {

  }

  batch(docs) {

  }

  clean(query) {

  }

  clear() {

  }

  get(id) {
    const promise = when.resolve().then(() => {
      return this.collection[id];
    });
    return promise;
  }

  save(doc) {
    const promise = when.promise((resolve) => {
      if (!doc) {
        return resolve(null);
      }

      this.collection[doc._id] = doc;
      resolve(doc);
    });

    return promise;
  }

  delete(id) {
    const promise = when.resolve().then(() => {
      delete this.collection[id];
    });
    return promise;
  }

  static isSupported() {
    return true;
  }
}
