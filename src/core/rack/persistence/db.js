import Query from '../../query';
import Aggregation from '../../aggregation';
import { IndexedDB } from './adapters/indexeddb';
import { LocalStorage } from './adapters/localstorage';
import { Memory } from './adapters/memory';
import { WebSQL } from './adapters/websql';
import log from '../../log';
import map from 'lodash/map';
import result from 'lodash/result';
import reduce from 'lodash/reduce';
import forEach from 'lodash/forEach';
import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';

/**
 * @private
 * Enum for DB Adapters.
 */
const DBAdapter = {
  IndexedDB: 'IndexedDB',
  LocalStorage: 'LocalStorage',
  Memory: 'Memory',
  WebSQL: 'WebSQL'
};
Object.freeze(DBAdapter);
export { DBAdapter };


/**
 * @private
 */
export class DB {
  constructor(dbName = 'kinvey', adapters = [DBAdapter.Memory]) {
    if (!isArray(adapters)) {
      adapters = [adapters];
    }

    forEach(adapters, adapter => {
      switch (adapter) {
        case DBAdapter.IndexedDB:
          if (IndexedDB.isSupported()) {
            this.adapter = new IndexedDB(dbName);
            return false;
          }

          break;
        case DBAdapter.LocalStorage:
          if (LocalStorage.isSupported()) {
            this.adapter = new LocalStorage(dbName);
            return false;
          }

          break;
        case DBAdapter.Memory:
          if (Memory.isSupported()) {
            this.adapter = new Memory(dbName);
            return false;
          }

          break;
        case DBAdapter.WebSQL:
          if (WebSQL.isSupported()) {
            this.adapter = new WebSQL(dbName);
            return false;
          }

          break;
        default:
          log.warn(`The ${adapter} adapter is is not recognized.`);
      }
    });

    if (!this.adapter) {
      if (Memory.isSupported()) {
        log.error('Provided adapters are unsupported on this platform. ' +
          'Defaulting to StoreAdapter.Memory adapter.', adapters);
        this.adapter = new Memory(dbName);
      } else {
        log.error('Provided adapters are unsupported on this platform.', adapters);
      }
    }
  }

  get objectIdPrefix() {
    return '';
  }

  isLocalObjectId(id) {
    return id.indexOf(this.objectIdPrefix) === 0 ? true : false;
  }

  generateObjectId(length = 24) {
    const chars = 'abcdef0123456789';
    let objectId = '';

    for (let i = 0, j = chars.length; i < length; i++) {
      const pos = Math.floor(Math.random() * j);
      objectId += chars.substring(pos, pos + 1);
    }

    objectId = `${this.objectIdPrefix}${objectId}`;
    return objectId;
  }

  find(collection, query) {
    const promise = this.adapter.find(collection).then(entities => {
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

    const promise = this.adapter.findById(collection, id);
    return promise;
  }

  save(collection, entities = []) {
    let singular = false;

    if (!entities) {
      return Promise.resolve(null);
    }

    if (!isArray(entities)) {
      singular = true;
      entities = [entities];
    }

    entities = map(entities, entity => {
      let _id = entity[idAttribute];
      const kmd = entity[kmdAttribute] || {};

      if (!_id) {
        _id = this.generateObjectId();
        kmd.local = true;
      }

      delete kmd.lmt;
      entity[idAttribute] = _id;
      entity[kmdAttribute] = kmd;
      return entity;
    });

    return this.adapter.save(collection, entities).then(data => {
      if (singular && data.length > 0) {
        return data[0];
      }

      return data;
    });
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
        return this.removeById(collection, entity[idAttribute]);
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

    const promise = this.adapter.removeById(collection, id);
    return promise;
  }
}
