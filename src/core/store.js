const StoreAdapter = require('./enums').StoreAdapter;
const KinveyError = require('./errors').KinveyError;
const Promise = require('bluebird');
const Query = require('./query');
const Aggregation = require('./aggregation');
const NotFoundError = require('./errors').NotFoundError;
const IndexedDB = require('./persistence/indexeddb');
const LocalStorage = require('./persistence/localstorage');
const Memory = require('./persistence/memory');
const platform = require('../utils/platform');
const Loki = require('lokijs');
const log = require('loglevel');
const result = require('lodash/object/result');
const forEach = require('lodash/collection/forEach');
const pluck = require('lodash/collection/pluck');
const isString = require('lodash/lang/isString');
const isArray = require('lodash/lang/isArray');
const isFunction = require('lodash/lang/isFunction');
const defaultDatabaseName = 'kinvey';
const dbLoaded = {};

const indexedDB = new Loki(defaultDatabaseName, {
  adapter: new IndexedDB()
});

const localStorage = new Loki(defaultDatabaseName, {
  adapter: new LocalStorage()
});

const memory = new Loki(defaultDatabaseName, {
  adapter: new Memory()
});

class Store {
  constructor(name = 'data', adapters = [StoreAdapter.Memory]) {
    this.dbName = name;
    this.dbLoaded = false;

    if (!isArray(adapters)) {
      adapters = [adapters];
    }

    forEach(adapters, adapter => {
      switch (adapter) {
      case StoreAdapter.IndexedDB:
        if (IndexedDB.isSupported()) {
          this.db = indexedDB;
          return false;
        }

        break;
      case StoreAdapter.LocalStorage:
        if (LocalStorage.isSupported()) {
          this.db = localStorage;
          return false;
        }

        break;
      case StoreAdapter.Memory:
        if (Memory.isSupported()) {
          this.db = memory;
          return false;
        }

        break;
      default:
        log.warn(`The ${adapter} adapter is is not recognized.`);
      }
    });

    if (!this.db) {
      log.error('Provided adapters are unsupported on this platform. Defaulting to StoreAdapter.Memory adapter.', adapters);
      this.db = memory;
    }
  }

  get objectIdPrefix() {
    return 'local_';
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

  isDatabaseLoaded() {
    if (dbLoaded[this.dbName]) {
      return true;
    }

    return false;
  }

  loadDatabase(force = false) {
    if (!this.isDatabaseLoaded() || force) {
      const promise = new Promise(resolve => {
        this.db.loadDatabase({
          dbname: this.dbName
        }, () => {
          dbLoaded[this.dbName] = true;
          resolve(this.isDatabaseLoaded());
        });
      });

      return promise;
    }

    return Promise.resolve(this.isDatabaseLoaded());
  }

  saveDatabase() {
    const promise = new Promise(resolve => {
      this.db.saveDatabase({
        dbname: this.dbName
      }, () => {
        resolve();
      });
    });

    return promise;
  }

  getCollection(name) {
    return this.db.getCollection(name);
  }

  addCollection(name) {
    const collection = this.getCollection(name);

    if (collection) {
      return collection;
    }

    return this.db.addCollection(name, { indices: ['_id', '_kmd'] });
  }

  find(name, query) {
    const promise = this.loadDatabase().then(() => {
      const collection = this.addCollection(name);

      if (query && !(query instanceof Query)) {
        query = new Query(result(query, 'toJSON', query));
      }

      let docs = collection.find();

      if (docs.length > 0 && query) {
        docs = query.process(docs);
      }

      return docs;
    });

    return promise;
  }

  count(name, query) {
    const promise = this.find(name, query).then(docs => {
      return docs.length;
    });

    return promise;
  }

  group(name, aggregation) {
    if (!(aggregation instanceof Aggregation)) {
      aggregation = new Aggregation(aggregation);
    }

    const query = new Query({ filter: aggregation.condition });
    const reduce = aggregation.reduce.replace(/function[\s\S]*?\([\s\S]*?\)/, '');
    aggregation.reduce = new Function(['doc', 'out'], reduce); // eslint-disable-line no-new-func

    const promise = this.find(name, query).then(docs => {
      const groups = {};
      const response = [];

      forEach(docs, doc => {
        const group = {};

        for (const name in aggregation.key) {
          if (aggregation.key.hasOwnProperty(name)) {
            group[name] = doc[name];
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

        aggregation.reduce(doc, groups[key]);
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

  get(name, id) {
    if (!isString(id)) {
      log.warn(`${id} is not a string. Casting to a string value.`, id);
      id = String(id);
    }

    //
    // const query = new Query();
    // query.contains('_id', [id]);
    // const promise = this.find(name, query).then(docs => {
    //   return docs.length === 1 ? docs[0] : null;
    // });
    // return promise;

    const promise = this.loadDatabase().then(() => {
      const collection = this.addCollection(name);
      const query = new Query();
      query.contains('_id', [id]);

      let docs = collection.find(query.toJSON().filter);
      return docs.length === 1 ? docs[0] : null;
    });

    return promise;
  }

  findAndModify(name, id, fn) {
    if (!isFunction(fn)) {
      return Promise.reject(new KinveyError('fn argument must be a function.'));
    }

    const promise = this.get(name, id).then(doc => {
      return fn(doc);
    }).then(doc => {
      return this.save(name, doc);
    });

    return promise;
  }

  save(name, doc) {
    const promise = this.loadDatabase().then(() => {
      if (!doc) {
        return null;
      }

      if (isArray(doc)) {
        return this.saveBulk(name, doc);
      }

      if (!doc._id) {
        doc._id = this.generateObjectId();
      }

      const collection = this.addCollection(name);

      if (doc.$loki) {
        return collection.update(doc);
      }

      return collection.insert(doc);
    });

    return promise;
  }

  saveBulk(name, docs = []) {
    const promises = [];

    if (!isArray(docs)) {
      return this.save(name, docs);
    }

    forEach(docs, doc => {
      promises.push(this.save(name, doc));
    });

    const promise = Promise.all(promises);
    return promise;
  }

  remove(name, id) {
    if (!id) {
      return Promise.resolve({
        count: 0,
        documents: []
      });
    }

    if (isArray(id)) {
      const query = new Query();
      query.contains('_id', id);
      return this.removeWhere(name, query);
    }

    const promise = this.get(name, id).then(doc => {
      if (!doc) {
        throw new NotFoundError();
      }

      const collection = this.addCollection(name);
      collection.remove(doc);

      return {
        count: 1,
        documents: [doc]
      };
    });

    return promise;
  }

  removeBulk(name, ids = []) {
    const promises = [];

    if (!isArray(ids)) {
      return this.remove(name, ids);
    }

    forEach(ids, id => {
      promises.push(this.remove(name, id));
    });

    const promise = Promise.all(promises);
    return promise;
  }

  removeWhere(name, query) {
    const promise = this.find(name, query).then(docs => {
      return this.removeBulk(name, pluck(docs, '_id'));
    });
    return promise;
  }
}

module.exports = Store;
