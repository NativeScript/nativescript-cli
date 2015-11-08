// jscs:disable requireCamelCaseOrUpperCaseIdentifiers

const PouchDB = require('pouchdb');
const StoreAdapter = require('./enums/storeAdapter');
const KinveyError = require('./errors').KinveyError;
const Promise = require('bluebird');
const Query = require('./query');
const Aggregation = require('./aggregation');
const IndexedDBAdapter = require('pouchdb/lib/adapters/idb');
const WebSQLAdapter = require('pouchdb/lib/adapters/websql');
const Loki = require('lokijs');
const log = require('loglevel');
const find = require('lodash/collection/find');
const clone = require('lodash/lang/clone');
const result = require('lodash/object/result');
const forEach = require('lodash/collection/forEach');
const isString = require('lodash/lang/isString');
const isArray = require('lodash/lang/isArray');
const protectedKeys = ['_id', '_rev'];
require('pouchdb/extras/memory');
require('pouchdb/extras/localstorage');

function serialize(doc) {
  doc = clone(doc, true);

  for (const key in doc) {
    if (doc.hasOwnProperty(key) && key.indexOf('_') === 0 && protectedKeys.indexOf(key) === -1) {
      doc[`${key.substring(1, key.length)}_`] = doc[key];
      delete doc[key];
    }
  }

  return doc;
}

function deserialize(doc) {
  doc = clone(doc, true);

  for (const key in doc) {
    if (doc.hasOwnProperty(key) && key.indexOf('_') === key.length - 1) {
      doc[`_${key.substring(0, key.length - 1)}`] = doc[key];
      delete doc[key];
    }
  }

  return doc;
}

class LocalStorageAdapter {
  valid() {
    const kinvey = 'kinvey';
    try {
      localStorage.setItem(kinvey, kinvey);
      localStorage.removeItem(kinvey);
      return true;
    } catch (e) {
      return false;
    }
  }
}

class PouchDBAdapter {
  constructor() {

  }

  loadDatabase(name, done) {
    return this.db.get(name).then(doc => {
      done(doc.data);
      return doc;
    });
  }

  saveDatabase(name, data, done) {
    return this.db.get(name).then(doc => {
      if (!doc) {
        doc = {
          _id: name
        };
      }

      doc.data = data;
      return this.db.save(doc).then(response => {
        if (response.error) {
          throw new KinveyError('An error occurred trying to save the document.', doc, response);
        }

        doc._rev = response.rev;
        done(doc);
        return doc;
      });
    });
  }
}

class Store {
  constructor(name = 'Kinvey', adapters = [StoreAdapter.Memory]) {
    let dbAdapter;

    if (!isArray(adapters)) {
      adapters = [adapters];
    }

    forEach(adapters, adapter => {
      switch (adapter) {
      case StoreAdapter.IndexedDB:
        if (IndexedDBAdapter.valid()) {
          dbAdapter = adapter;
          return false;
        }

        break;
      case StoreAdapter.LocalStorage:
        if (LocalStorageAdapter.valid()) {
          dbAdapter = adapter;
          return false;
        }

        break;
      case StoreAdapter.Memory:
        dbAdapter = adapter;
        return false;
      case StoreAdapter.WebSQL:
        if (WebSQLAdapter.valid()) {
          dbAdapter = adapter;
          return false;
        }

        break;
      default:
        log.warn(`${adapter} adapter is unsupported. Please use a supported store adapter.`, StoreAdapter);
      }
    });

    if (!dbAdapter) {
      log.warn('Provided adapters are unsupported on this platform. Defaulting to StoreAdapter.Memory.', adapters);
      dbAdapter = StoreAdapter.Memory;
    }

    this.db = new PouchDB(name, {
      auto_compaction: true,
      adapter: dbAdapter
    });
    this.db.viewCleanup();

    this.cache = new Loki(name);
    const collections = this.cache.listCollections();

    if (collections.indexOf(name) === -1) {
      this.cache.addCollection(name);
    }

    // if (dbAdapter !== StoreAdapter.Memory) {
    //   this.cache = new PouchDB(name, {
    //     auto_compaction: true,
    //     adapter: StoreAdapter.Memory
    //   });
    //   this.cache.viewCleanup();
    //   this.syncHandler = this.cache.sync(this.db, { live: true });
    //
    //   // this.syncHandler.on('change', info => {
    //   //   console.log('changed', info);
    //   // }).on('paused', () => {
    //   //   console.log('paused');
    //   // }).on('active', () => {
    //   //   console.log('active');
    //   // }).on('denied', info => {
    //   //   console.log('denied', info);
    //   // }).on('complete', info => {
    //   //   console.log('complete', info);
    //   // }).on('error', err => {
    //   //   console.error('error', err);
    //   // });
    // } else {
    //   this.cache = this.db;
    // }
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

  sync() {
    return this.cache.sync(this.db);
  }

  cancelSync() {
    if (this.syncHandler) {
      this.syncHandler.cancel();
    }
  }

  find(query) {
    if (query && !(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    const promise = this.cache.allDocs({ include_docs: true }).then(response => {
      let docs = [];

      forEach(response.rows, row => {
        docs.push(deserialize(row.doc));
      });

      if (query) {
        docs = query.process(docs);
      }

      return docs;
    });

    return promise;
  }

  count(query) {
    const promise = this.find(query).then(docs => {
      return docs.length;
    });

    return promise;
  }

  group(aggregation) {
    if (!(aggregation instanceof Aggregation)) {
      aggregation = new Aggregation(aggregation);
    }

    const query = new Query({ filter: aggregation.condition });
    const reduce = aggregation.reduce.replace(/function[\s\S]*?\([\s\S]*?\)/, '');
    aggregation.reduce = new Function(['doc', 'out'], reduce);

    const promise = this.find(query).then(docs => {
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

  get(id) {
    if (!isString(id)) {
      log.warn(`${id} is not a string. Casting to a string value.`, id);
      id = String(id);
    }

    const promise = this.cache.get(id).then(doc => {
      return deserialize(doc);
    });
    return promise;
  }

  findAndModify(id, fn) {
    if (!isFunction(fn)) {
      return Promise.reject(new KinveyError('fn argument must be a function.'));
    }

    const promise = this.get(id).then(doc => {
      return fn(doc);
    }).then(doc => {
      return this.save(doc);
    });

    return promise;
  }

  save(doc) {
    if (isArray(doc)) {
      return this.saveBulk(doc);
    }

    if (!doc) {
      return Promise.resolve(null);
    }

    if (!doc._id) {
      doc._id = this.generateObjectId();
    }

    const serializedDoc = serialize(doc);
    const promise = this.cache.put(serializedDoc).then(response => {
      if (response.error) {
        throw new KinveyError('An error occurred trying to save the document.', doc, response);
      }

      doc._id = response.id;
      doc._rev = response.rev;
      return doc;
    });

    return promise;
  }

  saveBulk(docs = []) {
    const serializedDocs = [];

    if (!isArray(docs)) {
      return this.save(docs);
    }

    forEach(docs, doc => {
      if (!doc._id) {
        doc._id = this.generateObjectId();
      }

      serializedDocs.push(serialize(doc));
    });

    const promise = this.cache.bulkDocs(serializedDocs).then(responses => {
      const results = [];

      forEach(responses, response => {
        if (response.ok) {
          const doc = find(docs, doc => {
            return doc._id === response.id;
          });

          doc._id = response.id;
          doc._rev = response.rev;
          results.push(doc);
        }
      });

      return results;
    });

    return promise;
  }

  remove(id) {
    if (!id) {
      return Promise.resolve({
        count: 0,
        documents: []
      });
    }

    if (isArray(id)) {
      const query = new Query();
      query.contains('_id', id);
      return this.clear(query);
    }

    const promise = this.get(id).then(doc => {
      const serializedDoc = serialize(doc);
      return this.cache.remove(doc).then(response => {
        if (response.error) {
          throw new KinveyError('An error occurred trying to remove the document.', doc, response);
        }

        return {
          count: 1,
          documents: [doc]
        };
      });
    });

    return promise;
  }

  removeBulk(docs = []) {
    const serializedDocs = [];

    if (!isArray(docs)) {
      return this.remove(docs);
    }

    forEach(docs, doc => {
      doc._deleted = true;
      serializedDocs.push(serialize(doc));
    });

    const promise = this.cache.bulkDocs(serializedDocs).then(responses => {
      const results = {
        count: 0,
        documents: []
      };

      forEach(responses, response => {
        if (response.ok) {
          const doc = find(docs, doc => {
            return doc._id === response.id;
          });

          results.count = result.count + 1;
          results.documents.push(doc);
        }
      });

      return results;
    });

    return promise;
  }

  clear(query) {
    const promise = this.find(query).then(docs => {
      return this.removeBulk(docs);
    });

    return promise;
  }

  destroy() {
    const promise = this.cache.destroy().then(response => {
      if (response.error) {
        throw new KinveyError('An error occurred trying to destroy the database.', response);
      }

      return null;
    });

    return promise;
  }

  static enableDebug() {
    PouchDB.debug.enable('*');
  }

  static disableDebug() {
    PouchDB.debug.disable();
  }
}

module.exports = Store;
