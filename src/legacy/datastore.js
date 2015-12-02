const Collection = require('../core/collections/collection');
const Query = require('../core/query');
const Aggregation = require('../core/aggregation');
const Promise = require('bluebird');
const KinveyError = require('../core/errors').KinveyError;
const DataPolicy = require('../core/enums').DataPolicy;
const log = require('loglevel');
const forEach = require('lodash/collection/forEach');
const wrapCallbacks = require('./utils').wrapCallbacks;

function normalizeOptions(options = {}) {
  if (options.offline) {
    if (options.fallback) {
      options.dataPolicy = DataPolicy.LocalFirst;
    } else {
      options.dataPolicy = DataPolicy.LocalOnly;
    }
  } else {
    options.dataPolicy = DataPolicy.NetworkOnly;
  }

  return options;
}

class DataStore {
  static find(name, query, options) {
    if (query && !(query instanceof Query)) {
      const error = new KinveyError('query argument must be of type: Kinvey.Query');
      return wrapCallbacks(Promise.reject(error), options);
    }

    const collection = new Collection(name, normalizeOptions(options));
    const promise = collection.find(query, normalizeOptions(options)).then(models => {
      const documents = [];

      forEach(models, model => {
        documents.push(model.toJSON());
      });

      return documents;
    });
    return wrapCallbacks(promise, options);
  }

  static group(name, aggregation, options) {
    if (!(aggregation instanceof Aggregation)) {
      const error = new KinveyError('aggregation argument must be of type: Kinvey.Group');
      return wrapCallbacks(Promise.reject(error), options);
    }

    const collection = new Collection(name, normalizeOptions(options));
    const promise = collection.group(aggregation, normalizeOptions(options));
    return wrapCallbacks(promise, options);
  }

  static count(name, query, options) {
    const collection = new Collection(name, normalizeOptions(options));
    const promise = collection.count(query, normalizeOptions(options));
    return wrapCallbacks(promise, options);
  }

  static get(name, id, options) {
    const collection = new Collection(name, normalizeOptions(options));
    const promise = collection.get(id, normalizeOptions(options)).then(model => {
      return model.toJSON();
    });
    return wrapCallbacks(promise, options);
  }

  static save(name, document, options) {
    if (document._id) {
      log.warn('The document has an _id, updating instead.', arguments);
      return this.update(name, document, options);
    }

    const collection = new Collection(name, normalizeOptions(options));
    const promise = collection.save(document, normalizeOptions(options)).then(model => {
      return model.toJSON();
    });
    return wrapCallbacks(promise, options);
  }

  static update(name, document, options) {
    if (!document._id) {
      const error = new KinveyError('document argument must contain: _id');
      return wrapCallbacks(Promise.reject(error), options);
    }

    const collection = new Collection(name, normalizeOptions(options));
    const promise = collection.update(document, normalizeOptions(options)).then(model => {
      return model.toJSON();
    });
    return wrapCallbacks(promise, options);
  }

  static clean(name, query, options) {
    if (query && !(query instanceof Query)) {
      const error = new KinveyError('query argument must be of type: Kinvey.Query');
      return wrapCallbacks(Promise.reject(error), options);
    }

    const collection = new Collection(name, normalizeOptions(options));
    const promise = collection.clear(query, normalizeOptions(options));
    return wrapCallbacks(promise, options);
  }

  static destroy(name, id, options) {
    const collection = new Collection(name, normalizeOptions(options));
    const promise = collection.delete(id, normalizeOptions(options));
    return wrapCallbacks(promise, options);
  }
}

module.exports = DataStore;
