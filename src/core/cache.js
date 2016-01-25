import { CacheAdapter } from './enums';
import Query from './query';
import Aggregation from './aggregation';
import IndexedDB from './persistence/indexeddb';
import LocalStorage from './persistence/localstorage';
import Memory from './persistence/memory';
import WebSQL from './persistence/websql';
import log from './log';
import result from 'lodash/object/result';
import reduce from 'lodash/collection/reduce';
import forEach from 'lodash/collection/forEach';
import isString from 'lodash/lang/isString';
import isArray from 'lodash/lang/isArray';
const objectIdPrefix = process.env.KINVEY_OBJECT_ID_PREFIX || 'local_';

export default class Cache {
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

  saveBulk(collection, docs = []) {
    if (!docs) {
      return Promise.resolve(null);
    }

    if (!isArray(docs)) {
      return this.save(collection, docs);
    }

    const promise = this.db.saveBulk(collection, docs);
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
