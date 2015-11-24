const StoreAdapter = require('./enums').StoreAdapter;
const Promise = require('bluebird');
const Query = require('./query');
const Aggregation = require('./aggregation');
const IndexedDB = require('./persistence/indexeddb');
const LocalStorage = require('./persistence/localstorage');
const Memory = require('./persistence/memory');
const WebSQL = require('./persistence/websql');
const log = require('loglevel');
const result = require('lodash/object/result');
const forEach = require('lodash/collection/forEach');
const isString = require('lodash/lang/isString');
const isArray = require('lodash/lang/isArray');
const objectIdPrefix = process.env.KINVEY_OBJECT_ID_PREFIX || 'local_';

class Store {
  constructor(dbName = 'kinvey', adapters = [StoreAdapter.Memory]) {
    if (!isArray(adapters)) {
      adapters = [adapters];
    }

    forEach(adapters, adapter => {
      switch (adapter) {
      case StoreAdapter.IndexedDB:
        if (IndexedDB.isSupported()) {
          this.db = new IndexedDB(dbName);
          return false;
        }

        break;
      case StoreAdapter.LocalStorage:
        if (LocalStorage.isSupported()) {
          this.db = new LocalStorage(dbName);
          return false;
        }

        break;
      case StoreAdapter.Memory:
        if (Memory.isSupported()) {
          this.db = new Memory(dbName);
          return false;
        }

        break;
      case StoreAdapter.WebSQL:
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
        log.error('Provided adapters are unsupported on this platform. Defaulting to StoreAdapter.Memory adapter.', adapters);
        this.db = new Memory(dbName);
      } else {
        log.error('Provided adapters are unsupported on this platform.', adapters);
      }
    }
  }

  get objectIdPrefix() {
    return objectIdPrefix;
  }

  generateObjectId(length = 24) {
    const chars = 'abcdef0123456789';
    let objectId = '';

    for (let i = 0, j = chars.length; i < length; i += 1) {
      const pos = Math.floor(Math.random() * j);
      objectId += chars.substring(pos, pos + 1);
    }

    return `${this.objectIdPrefix}${objectId}`;
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
        documents = query.process(documents);
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
    if (!(aggregation instanceof Aggregation)) {
      aggregation = new Aggregation(aggregation);
    }

    const query = new Query({ filter: aggregation.condition });
    const reduce = aggregation.reduce.replace(/function[\s\S]*?\([\s\S]*?\)/, '');
    aggregation.reduce = new Function(['doc', 'out'], reduce); // eslint-disable-line no-new-func

    const promise = this.find(collection, query).then(documents => {
      const groups = {};
      const response = [];

      forEach(documents, document => {
        const group = {};

        for (const name in aggregation.key) {
          if (aggregation.key.hasOwnProperty(name)) {
            group[name] = document[name];
          }
        }

        const key = JSON.stringify(group);
        if (!groups[key]) {
          groups[key] = group;

          for (const attr in aggregation.initial) {
            if (aggregation.initial.hasOwnProperty(attr)) {
              groups[key][attr] = aggregation.initial[attr];
            }
          }
        }

        aggregation.reduce(document, groups[key]);
      });

      for (const segment in groups) {
        if (groups.hasOwnProperty(segment)) {
          response.push(groups[segment]);
        }
      }

      return response;
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

  save(collection, document) {
    if (!document) {
      return Promise.resolve(null);
    }

    if (isArray(document)) {
      return this.saveBulk(collection, document);
    }

    const promise = this.db.save(collection, document);
    return promise;
  }

  saveBulk(collection, documents = []) {
    if (!isArray(documents)) {
      return this.save(collection, documents);
    }

    const promise = this.db.saveBulk(collection, documents);
    return promise;
  }

  delete(collection, id) {
    if (!id) {
      return Promise.resolve({
        count: 0,
        documents: []
      });
    }

    const promise = this.db.delete(collection, id);
    return promise;
  }

  deleteWhere(collection, query) {
    const promise = this.find(collection, query).then(documents => {
      const promises = documents.map(document => {
        return this.delete(collection, document._id);
      });

      return Promise.all(promises);
    });

    return promise;
  }
}

module.exports = Store;
