import Promise from 'babybird';
import { Query } from '../../query';
import { Aggregation } from '../../aggregation';
import IndexedDB from './adapters/indexeddb';
import { LocalStorage } from './adapters/localstorage';
import { Memory } from './adapters/memory';
import { WebSQL } from './adapters/websql';
import { KinveyError } from '../../errors';
import { Log } from '../../log';
import { KinveyMiddleware } from '../middleware';
import { HttpMethod, StatusCode } from '../../enums';
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
  constructor(name, adapters = [DBAdapter.IndexedDB, DBAdapter.WebSQL, DBAdapter.LocalStorage, DBAdapter.Memory]) {
    if (!isArray(adapters)) {
      adapters = [adapters];
    }

    forEach(adapters, adapter => {
      switch (adapter) {
        case DBAdapter.IndexedDB:
          if (IndexedDB.isSupported()) {
            this.adapter = new IndexedDB(name);
            return false;
          }

          break;
        case DBAdapter.LocalStorage:
          if (LocalStorage.isSupported()) {
            this.adapter = new LocalStorage(name);
            return false;
          }

          break;
        case DBAdapter.Memory:
          if (Memory.isSupported()) {
            this.adapter = new Memory(name);
            return false;
          }

          break;
        case DBAdapter.WebSQL:
          if (WebSQL.isSupported()) {
            this.adapter = new WebSQL(name);
            return false;
          }

          break;
        default:
          Log.warn(`The ${adapter} adapter is is not recognized.`);
      }

      return true;
    });

    if (!this.adapter) {
      if (Memory.isSupported()) {
        Log.error('Provided adapters are unsupported on this platform. ' +
          'Defaulting to StoreAdapter.Memory adapter.', adapters);
        this.adapter = new Memory(name);
      } else {
        Log.error('Provided adapters are unsupported on this platform.', adapters);
      }
    }
  }

  get objectIdPrefix() {
    return '';
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
      if (!entities) {
        return [];
      }

      return entities;
    }).then(entities => {
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
    const promise = this.find(collection, query).then(entities => entities.length);
    return promise;
  }

  group(collection, aggregation) {
    const promise = this.find(collection).then(entities => {
      if (!(aggregation instanceof Aggregation)) {
        aggregation = new Aggregation(result(aggregation, 'toJSON', aggregation));
      }

      if (entities.length > 0 && aggregation) {
        return aggregation.process(entities);
      }

      return null;
    });

    return promise;
  }

  findById(collection, id) {
    if (!isString(id)) {
      return Promise.reject(new KinveyError('id must be a string', id));
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
      let id = entity[idAttribute];
      const kmd = entity[kmdAttribute] || {};

      if (!id) {
        id = this.generateObjectId();
        kmd.local = true;
      }

      entity[idAttribute] = id;
      entity[kmdAttribute] = kmd;
      return entity;
    });

    return this.adapter.save(collection, entities).then(entities => {
      if (singular && entities.length > 0) {
        return entities[0];
      }

      return entities;
    });
  }

  remove(collection, query) {
    if (query && !(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    // Removing should not take the query sort, limit, and skip into account.
    if (query) {
      query.sort = null;
      query.limit = null;
      query.skip = 0;
    }

    const promise = this.find(collection, query).then(entities => {
      const promises = entities.map(entity => this.removeById(collection, entity[idAttribute]));
      return Promise.all(promises);
    }).then(responses => {
      const result = reduce(responses, (allEntities, entities) => {
        allEntities = allEntities.concat(entities);
        return allEntities;
      }, []);
      return result;
    });

    return promise;
  }

  removeById(collection, id) {
    if (!id) {
      return Promise.resolve(null);
    }

    if (!isString(id)) {
      return Promise.reject(new KinveyError('id must be a string', id));
    }

    const promise = this.adapter.removeById(collection, id);
    return promise;
  }
}

/**
 * @private
 */
export class CacheMiddleware extends KinveyMiddleware {
  constructor(adapters = [DBAdapter.IndexedDB, DBAdapter.WebSQL, DBAdapter.LocalStorage, DBAdapter.Memory]) {
    super('Kinvey Cache Middleware');
    this.adapters = adapters;
  }

  async handle(request) {
    request = await super.handle(request);
    const method = request.method;
    const query = request.query;
    const body = request.body;
    const db = new DB(request.appKey, this.adapters);
    let data;

    if (method === HttpMethod.GET) {
      if (request.entityId) {
        if (request.entityId === '_count') {
          data = await db.count(request.collectionName, query);
        } else if (request.entityId === '_group') {
          data = await db.group(request.collectionName, body);
        } else {
          data = await db.findById(request.collectionName, request.entityId);
        }
      } else {
        data = await db.find(request.collectionName, query);
      }
    } else if (method === HttpMethod.POST || method === HttpMethod.PUT) {
      data = await db.save(request.collectionName, body);
    } else if (method === HttpMethod.DELETE) {
      if (request.entityId) {
        data = await db.removeById(request.collectionName, request.entityId);
      } else {
        data = await db.remove(request.collectionName, query);
      }
    }

    request.response = {
      statusCode: method === HttpMethod.POST ? StatusCode.Created : StatusCode.Ok,
      headers: {},
      data: data
    };

    return request;
  }
}
