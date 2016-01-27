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
    const promise = this.db.find(collection).then(entities => {
      if (query && !(query instanceof Query)) {
        query = new Query(result(query, 'toJSON', query));
      }

      if (entities.length > 0 && query) {
        entities = query._process(entities);
      }

      return entities;
    });

    return promise;
  }

  count(collection, query) {
    const promise = this.find(collection, query).then(entities => {
      return entities.length;
    });

    return promise;
  }

  group(collection, aggregation) {
    const promise = this.find(collection).then(entities => {
      if (!(aggregation instanceof Aggregation)) {
        aggregation = new Aggregation(result(aggregation, 'toJSON', aggregation));
      }

      return aggregation.process(entities);
    });

    return promise;
  }

  findById(collection, id) {
    if (!isString(id)) {
      log.warn(`${id} is not a string. Casting to a string value.`, id);
      id = String(id);
    }

    const promise = this.db.findById(collection, id);
    return promise;
  }

  save(collection, entity) {
    if (!entity) {
      return Promise.resolve(null);
    }

    if (isArray(entity)) {
      return this.saveBulk(collection, entity);
    }

    const promise = this.db.save(collection, entity);
    return promise;
  }

  saveBulk(collection, entities = []) {
    if (!entities) {
      return Promise.resolve(null);
    }

    if (!isArray(entities)) {
      return this.save(collection, entities);
    }

    const promise = this.db.saveBulk(collection, entities);
    return promise;
  }

  remove(collection, query) {
    if (query && !(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    // Removing should not take the query sort, limit, and skip into account.
    if (query) {
      query.sort(null).limit(null).skip(0);
    }

    const promise = this.find(collection, query).then(entities => {
      const promises = entities.map(entity => {
        return this.removeById(collection, entity._id);
      });

      return Promise.all(promises);
    }).then(responses => {
      return reduce(responses, (result, response) => {
        result.count += response.count;
        result.entities.concat(response.entities);
        return result;
      }, {
        count: 0,
        entities: []
      });
    });

    return promise;
  }

  removeById(collection, id) {
    if (!id) {
      return Promise.resolve({
        count: 0,
        entities: []
      });
    }

    const promise = this.db.removeById(collection, id);
    return promise;
  }
}
