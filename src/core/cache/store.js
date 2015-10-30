import StoreAdapter from '../enums/storeAdapter';
import { KinveyError } from '../errors';
import Query from '../query';
import Aggregation from '../aggregation';
import IndexedDBAdapter from './adapters/indexeddb';
import LocalStorageAdapter from './adapters/localstorage';
import WebSQLAdapter from './adapters/websql';
import Promise from 'bluebird';
import log from 'loglevel';
import assign from 'lodash/object/assign';
import result from 'lodash/object/result';
import isString from 'lodash/lang/isString';
import isArray from 'lodash/lang/isArray';
import isFunction from 'lodash/lang/isArray';
const validCollectionRegex = /^[a-zA-Z0-9\-]{1,128}/;

export default class Store {
  constructor(Adapters = [StoreAdapter.IndexedDB], dbInfo) {
    dbInfo = assign({
      name: 'kinvey',
      collection: 'data'
    }, dbInfo);

    if (!isString(dbInfo.name) || !validCollectionRegex.test(dbInfo.name)) {
      throw new KinveyError('The database name has an invalid format.', 'The database name must be a string containing only alphanumeric characters and dashes.');
    }

    if (!isString(dbInfo.collection) || !validCollectionRegex.test(dbInfo.collection)) {
      throw new KinveyError('The collection name has an invalid format.', 'The collection name must be a string containing only alphanumeric characters and dashes.');
    }

    if (!isArray(Adapters)) {
      Adapters = [Adapters];
    }

    for (let i = 0, len = Adapters.length; i < len; i++) {
      let Adapter = Adapters[i];

      if (isString(Adapter)) {
        switch (Adapter) {
        case StoreAdapter.IndexedDB:
          Adapter = IndexedDBAdapter;
          break;
        case StoreAdapter.LocalStorage:
          Adapter = LocalStorageAdapter;
          break;
        case StoreAdapter.WebSQL:
          Adapter = WebSQLAdapter;
          break;
        default:
          continue;
        }
      }

      if (Adapter.isSupported()) {
        this.adapter = new Adapter(dbInfo);
        break;
      }
    }

    if (!this.adapter) {
      throw new KinveyError('Please provide a supported storage adapter.');
    }
  }

  get objectIdPrefix() {
    return 'local_';
  }

  generateObjectId(length = 24) {
    const chars = 'abcdef0123456789';
    let result = '';

    for (let i = 0, j = chars.length; i < length; i += 1) {
      const pos = Math.floor(Math.random() * j);
      result += chars.substring(pos, pos + 1);
    }

    return `${this.objectIdPrefix}${result}`;
  }

  find(query) {
    if (query && !(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    return this.adapter.find(query);
  }

  count(query) {
    if (query && !(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    if (query) {
      query.sort(null).limit(null).skip(0);
    }

    return this.adapter.count(query);
  }

  findAndModify(id, fn) {
    if (!isString(id)) {
      log.warn(`${id} is not a string. Casting to a string value.`, id);
      id = String(id);
    }

    if (!isFunction(fn)) {
      return Promise.reject(new KinveyError('fn argument must be a function'));
    }

    return this.adapter.findAndModify(id, fn);
  }

  group(aggregation) {
    if (!(aggregation instanceof Aggregation)) {
      aggregation = new Aggregation(aggregation);
    }

    return this.adapter.group(aggregation);
  }

  get(id) {
    if (!isString(id)) {
      log.warn(`${id} is not a string. Casting to a string value.`, id);
      id = String(id);
    }

    return this.adapter.get(id);
  }

  save(doc) {
    if (isArray(doc)) {
      return this.batch(doc);
    }

    if (!doc) {
      return Promise.resolve(null);
    }

    doc._id = doc._id || this.generateObjectId();
    return this.adapter.save(doc);
  }

  batch(docs) {
    if (!isArray(docs)) {
      docs = [docs];
    }

    return this.adapter.batch(docs);
  }

  delete(id) {
    if (!isString(id)) {
      log.warn(`${id} is not a string. Casting to a string value.`, id);
      id = String(id);
    }

    return this.adapter.delete(id);
  }

  clean(query) {
    if (query && !(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    if (query) {
      query.sort(null).limit(null).skip(0);
    }

    return this.adapter.clean(query);
  }

  clear() {
    return this.adapter.clear();
  }
}
