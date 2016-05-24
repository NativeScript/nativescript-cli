/* eslint-disable no-underscore-dangle */
import { Query } from '../../query';
import { Aggregation } from '../../aggregation';
import IndexedDB from './adapters/indexeddb';
import { LocalStorage } from './adapters/localstorage';
import { Memory } from './adapters/memory';
import { WebSQL } from './adapters/websql';
import { KinveyError, NotFoundError } from '../../errors';
import { Log } from '../../log';
import { KinveyMiddleware } from '../middleware';
import { RequestMethod } from '../../requests/request';
import { StatusCode } from '../../requests/response';
import Queue from 'promise-queue';
import map from 'lodash/map';
import result from 'lodash/result';
import reduce from 'lodash/reduce';
import forEach from 'lodash/forEach';
import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';
Queue.configure(Promise);
const queue = new Queue(1, Infinity);

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
          'Defaulting to the Memory adapter.', adapters);
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

  async find(collection, query) {
    try {
      let entities = await this.adapter.find(collection);

      if (!entities) {
        return [];
      }

      if (query && !(query instanceof Query)) {
        query = new Query(result(query, 'toJSON', query));
      }

      if (entities.length > 0 && query) {
        entities = query._process(entities);
      }

      return entities;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return [];
      }

      throw error;
    }
  }

  async count(collection, query) {
    const entities = await this.find(collection, query);
    return { count: entities.length };
  }

  async group(collection, aggregation) {
    const entities = await this.find(collection);

    if (!(aggregation instanceof Aggregation)) {
      aggregation = new Aggregation(result(aggregation, 'toJSON', aggregation));
    }

    if (entities.length > 0 && aggregation) {
      return aggregation.process(entities);
    }

    return null;
  }

  async findById(collection, id) {
    try {
      if (!isString(id)) {
        throw new KinveyError('id must be a string', id);
      }

      return this.adapter.findById(collection, id);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return undefined;
      }

      throw error;
    }
  }

  save(collection, entities = []) {
    return queue.add(async () => {
      let singular = false;

      if (!entities) {
        return null;
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

      entities = await this.adapter.save(collection, entities);

      if (singular && entities.length > 0) {
        return entities[0];
      }

      return entities;
    });
  }

  async remove(collection, query) {
    if (query && !(query instanceof Query)) {
      query = new Query(query);
    }

    // Removing should not take the query sort, limit, and skip into account.
    if (query) {
      query.sort = null;
      query.limit = null;
      query.skip = 0;
    }

    const entities = await this.find(collection, query);
    const responses = await Promise.all(entities.map(entity => this.removeById(collection, entity[idAttribute])));
    return reduce(responses, (entities, entity) => {
      entities.push(entity);
      return entities;
    }, []);
  }

  removeById(collection, id) {
    return queue.add(() => {
      if (!id) {
        return undefined;
      }

      if (!isString(id)) {
        throw new KinveyError('id must be a string', id);
      }

      return this.adapter.removeById(collection, id);
    });
  }

  clear() {
    return queue.add(() => this.adapter.clear());
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
    const { method, query, body, appKey, collection, entityId } = request;
    const db = new DB(appKey, this.adapters);
    let data;

    if (method === RequestMethod.GET) {
      if (entityId) {
        if (entityId === '_count') {
          data = await db.count(collection, query);
        } else if (entityId === '_group') {
          data = await db.group(collection, body);
        } else {
          data = await db.findById(collection, request.entityId);
        }
      } else {
        data = await db.find(collection, query);
      }
    } else if (method === RequestMethod.POST || method === RequestMethod.PUT) {
      data = await db.save(collection, body);
    } else if (method === RequestMethod.DELETE) {
      if (collection && entityId) {
        data = await db.removeById(collection, entityId);
      } else if (!collection) {
        data = await db.clear();
      } else {
        data = await db.remove(collection, query);
      }
    }

    request.response = {
      statusCode: method === RequestMethod.POST ? StatusCode.Created : StatusCode.Ok,
      headers: {},
      data: data
    };

    if (!data) {
      request.response.statusCode = StatusCode.Empty;
    }

    return request;
  }
}
