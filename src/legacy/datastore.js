const Collection = require('../core/collections/collection');
const Query = require('../core/query');
const Aggregation = require('../core/aggregation');
const Promise = require('bluebird');
const KinveyError = require('../core/errors').KinveyError;
const log = require('../core/log');
const map = require('lodash/collection/map');
const mapLegacyOptions = require('./utils').mapLegacyOptions;
const wrapCallbacks = require('./utils').wrapCallbacks;

class DataStore {
  static find(name, query, options) {
    options = mapLegacyOptions(options);

    if (query && !(query instanceof Query)) {
      const error = new KinveyError('query argument must be of type: Kinvey.Query');
      return wrapCallbacks(Promise.reject(error), options);
    }

    const collection = new Collection(name, options);
    const promise = collection.find(query, options).then(models => {
      return map(models, model => {
        return model.toJSON();
      });
    });
    return wrapCallbacks(promise, options);
  }

  static group(name, aggregation, options) {
    options = mapLegacyOptions(options);

    if (!(aggregation instanceof Aggregation)) {
      const error = new KinveyError('aggregation argument must be of type: Kinvey.Group');
      return wrapCallbacks(Promise.reject(error), options);
    }

    const collection = new Collection(name, options);
    const promise = collection.group(aggregation, options).then(models => {
      return map(models, model => {
        return model.toJSON();
      });
    });
    return wrapCallbacks(promise, options);
  }

  static count(name, query, options) {
    options = mapLegacyOptions(options);

    const collection = new Collection(name, options);
    const promise = collection.count(query, options);
    return wrapCallbacks(promise, options);
  }

  static get(name, id, options) {
    options = mapLegacyOptions(options);

    const collection = new Collection(name, options);
    const promise = collection.get(id, options).then(model => {
      return model.toJSON();
    });
    return wrapCallbacks(promise, options);
  }

  static save(name, document, options) {
    options = mapLegacyOptions(options);

    if (document._id) {
      log.warn('The document has an _id, updating instead.', arguments);
      return this.update(name, document, options);
    }

    const collection = new Collection(name, options);
    const promise = collection.create(document, options).then(model => {
      return model.toJSON();
    });
    return wrapCallbacks(promise, options);
  }

  static update(name, document, options) {
    options = mapLegacyOptions(options);

    if (!document._id) {
      const error = new KinveyError('document argument must contain: _id');
      return wrapCallbacks(Promise.reject(error), options);
    }

    const collection = new Collection(name, options);
    const promise = collection.update(document, options).then(model => {
      return model.toJSON();
    });
    return wrapCallbacks(promise, options);
  }

  static clean(name, query, options) {
    options = mapLegacyOptions(options);

    if (query && !(query instanceof Query)) {
      const error = new KinveyError('query argument must be of type: Kinvey.Query');
      return wrapCallbacks(Promise.reject(error), options);
    }

    const collection = new Collection(name, options);
    const promise = collection.clear(query, options);
    return wrapCallbacks(promise, options);
  }

  static destroy(name, id, options) {
    options = mapLegacyOptions(options);

    const collection = new Collection(name, options);
    const promise = collection.delete(id, options);
    return wrapCallbacks(promise, options);
  }
}

module.exports = DataStore;
