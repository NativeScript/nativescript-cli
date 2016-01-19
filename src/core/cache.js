const CacheAdapter = require('./enums').CacheAdapter;
import Query from './query';
const Aggregation = require('./aggregation');
const IndexedDB = require('./persistence/indexeddb');
const LocalStorage = require('./persistence/localstorage');
const Memory = require('./persistence/memory');
const WebSQL = require('./persistence/websql');
const log = require('./log');
const result = require('lodash/object/result');
const reduce = require('lodash/collection/reduce');
const forEach = require('lodash/collection/forEach');
const isString = require('lodash/lang/isString');
const isArray = require('lodash/lang/isArray');
const objectIdPrefix = process.env.KINVEY_OBJECT_ID_PREFIX || 'local_';

class Cache {
  constructor(dbName = 'kinvey', adapters = [CacheAdapter.Memory]) {
    if (!isArray(adapters)) {
      adapters = [adapters];
    }

    forEach(adapters, adapter => {
      switch (adapter) {
        case CacheAdapter.IndexedDB:
          if (IndexedDB.isSupported()) {
            this.db = new IndexedDB(dbName);
            return false;
          }

          break;
        case CacheAdapter.LocalStorage:
          if (LocalStorage.isSupported()) {
            this.db = new LocalStorage(dbName);
            return false;
          }

          break;
        case CacheAdapter.Memory:
          if (Memory.isSupported()) {
            this.db = new Memory(dbName);
            return false;
          }

          break;
        case CacheAdapter.WebSQL:
          if (WebSQL.isSupported()) {
            this.db = new WebSQL(dbName);
            return false;
          }

          break;
        default:
          log.warn(`The ${adapter} adapter is is not recognized.`);
      }
    });

    if (!this.db) {
      if (Memory.isSupported()) {
        log.error('Provided adapters are unsupported on this platform. ' +
          'Defaulting to StoreAdapter.Memory adapter.', adapters);
        this.db = new Memory(dbName);
      } else {
        log.error('Provided adapters are unsupported on this platform.', adapters);
      }
    }
  }

  get objectIdPrefix() {
    return objectIdPrefix;
  }

  isLocalObjectId(id) {
    return id.indexOf(this.objectIdPrefix) === 0 ? true : false;
  }

  find(collection, query) {
    const promise = this.db.find(collection).then(documents => {
      if (query && !(query instanceof Query)) {
        query = new Query(result(query, 'toJSON', query));
      }

      if (documents.length > 0 && query) {
        documents = query._process(documents);
      }

      return documents;
    });

    return promise;
  }

  count(collection, query) {
    const promise = this.find(collection, query).then(documents => {
      return documents.length;
    });

    return promise;
  }

  group(collection, aggregation) {
    const promise = this.find(collection).then(documents => {
      if (!(aggregation instanceof Aggregation)) {
        aggregation = new Aggregation(result(aggregation, 'toJSON', aggregation));
      }

      return aggregation.process(documents);
    });

    return promise;
  }

  get(collection, id) {
    if (!isString(id)) {
      log.warn(`${id} is not a string. Casting to a string value.`, id);
      id = String(id);
    }

    const promise = this.db.get(collection, id);
    return promise;
  }

  save(collection, doc) {
    if (!doc) {
      return Promise.resolve(null);
    }

    if (isArray(doc)) {
      return this.saveBulk(collection, doc);
    }

    const promise = this.db.save(collection, doc);
    return promise;
  }

  saveBulk(collection, documents = []) {
    if (!isArray(documents)) {
      return this.save(collection, documents);
    }

    const promise = this.db.saveBulk(collection, documents);
    return promise;
  }

  remove(collection, id) {
    if (!id) {
      return Promise.resolve({
        count: 0,
        documents: []
      });
    }

    const promise = this.db.remove(collection, id);
    return promise;
  }

  removeWhere(collection, query) {
    if (query && !(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    // Removing should not take the query sort, limit, and skip into account.
    if (query) {
      query.sort(null).limit(null).skip(0);
    }

    const promise = this.find(collection, query).then(documents => {
      const promises = documents.map(document => {
        return this.remove(collection, document._id);
      });

      return Promise.all(promises);
    }).then(responses => {
      return reduce(responses, (result, response) => {
        result.count += response.count;
        result.documents.concat(response.documents);
        return result;
      }, {
        count: 0,
        documents: []
      });
    });

    return promise;
  }
}

module.exports = Cache;
