const Collection = require('../core/collections/collection');
const Query = require('../core/query');
const Aggregation = require('../core/aggregation');
const Promise = require('bluebird');
const KinveyError = require('../core/errors').KinveyError;
const log = require('loglevel');
const forEach = require('lodash/collection/forEach');
const transformOptions = require('./utils').transformOptions;
const wrapCallbacks = require('./utils').wrapCallbacks;

class DataStore {
  static find(name, query, options) {
    if (query && !(query instanceof Query)) {
      const error = new KinveyError('query argument must be of type: Kinvey.Query');
      return wrapCallbacks(Promise.reject(error), options);
    }

    const collection = new Collection(name, transformOptions(options));
    const promise = collection.find(query, transformOptions(options)).then(models => {
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

    const collection = new Collection(name, transformOptions(options));
    const promise = collection.group(aggregation, transformOptions(options));
    return wrapCallbacks(promise, options);
  }

  static count(name, query, options) {
    const collection = new Collection(name, transformOptions(options));
    const promise = collection.count(query, transformOptions(options));
    return wrapCallbacks(promise, options);
  }

  static get(name, id, options) {
    const collection = new Collection(name, transformOptions(options));
    const promise = collection.get(id, transformOptions(options)).then(model => {
      return model.toJSON();
    });
    return wrapCallbacks(promise, options);
  }

  static save(name, document, options) {
    if (document._id) {
      log.warn('The document has an _id, updating instead.', arguments);
      return this.update(name, document, options);
    }

    const collection = new Collection(name, transformOptions(options));
    const promise = collection.save(document, transformOptions(options)).then(model => {
      return model.toJSON();
    });
    return wrapCallbacks(promise, options);
  }

  static update(name, document, options) {
    if (!document._id) {
      const error = new KinveyError('document argument must contain: _id');
      return wrapCallbacks(Promise.reject(error), options);
    }

    const collection = new Collection(name, transformOptions(options));
    const promise = collection.update(document, transformOptions(options)).then(model => {
      return model.toJSON();
    });
    return wrapCallbacks(promise, options);
  }

  static clean(name, query, options) {
    if (query && !(query instanceof Query)) {
      const error = new KinveyError('query argument must be of type: Kinvey.Query');
      return wrapCallbacks(Promise.reject(error), options);
    }

    const collection = new Collection(name, transformOptions(options));
    const promise = collection.clear(query, transformOptions(options));
    return wrapCallbacks(promise, options);
  }

  static destroy(name, id, options) {
    const collection = new Collection(name, transformOptions(options));
    const promise = collection.delete(id, transformOptions(options));
    return wrapCallbacks(promise, options);
  }
}

module.exports = DataStore;
