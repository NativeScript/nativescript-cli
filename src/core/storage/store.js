// jscs:disable requireCamelCaseOrUpperCaseIdentifiers

const PouchDB = require('pouchdb');
const StoreAdapter = require('../enums/storeAdapter');
const KinveyError = require('../errors').KinveyError;
const Promise = require('bluebird');
const Query = require('../query');
const IndexedDBAdapter = require('pouchdb/lib/adapters/idb');
const WebSQLAdapter = require('pouchdb/lib/adapters/websql');
const log = require('loglevel');
const find = require('lodash/collection/find');
const forEach = require('lodash/collection/forEach');
const isString = require('lodash/lang/isString');
const isArray = require('lodash/lang/isArray');
require('pouchdb/extras/memory');

function serialize(doc) {
  for (const key in doc) {
    if (doc.hasOwnProperty(key) && key.indexOf('_') === 0 && key !== '_id') {
      doc[`${key.substring(1, key.length)}_`] = doc[key];
      delete doc[key];
    }
  }

  return doc;
}

function deserialize(doc) {
  for (const key in doc) {
    if (doc.hasOwnProperty(key) && key.indexOf('_') === key.length - 1) {
      doc[`_${key.substring(0, key.length - 1)}`] = doc[key];
      delete doc[key];
    }
  }

  return doc;
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
        case StoreAdapter.WebSQL:
          if (WebSQLAdapter.valid()) {
            dbAdapter = adapter;
            return false;
          }

          break;
      }
    });

    if (!dbAdapter) {
      log.warn('Provided adapters are unsupported. Defaulting to StoreAdapter.Memory.', adapters);
      dbAdapter = StoreAdapter.Memory;
    }

    this.db = new PouchDB(name, {
      auto_compaction: true,
      adapter: dbAdapter
    });

    if (dbAdapter !== StoreAdapter.Memory) {
      this.cache = new PouchDB(name, {
        auto_compaction: true,
        adapter: StoreAdapter.Memory
      });
      this.syncHandler = this.cache.sync(this.db, { live: true });
    } else {
      this.cache = this.db;
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
      return this.batch(doc);
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

  saveBuld(docs) {
    const serializeDocs = [];

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
      var result = [];

      forEach(responses, response => {
        if (response.ok) {
          const doc = find(docs, doc => {
            return doc._id === response.id;
          });

          doc._id = response.id;
          doc._rev = response.rev;
          result.push(doc);
        }
      });

      return result;
    });
  }

  remove(doc) {
    if (!doc) {
      return Promise.resolve({
        count: 0,
        documents: []
      });
    }

    if (isArray(doc)) {
      return this.removeBulk(doc);
    }

    if (!doc._id) {
      return Promise.reject(new KinveyError('doc must have an _id property to be removed.', doc));
    }

    if (!doc._rev) {
      return Promise.reject(new KinveyError('doc must have a _rev property to be removed.', doc));
    }

    const serializedDoc = serialize(doc);
    const promise = this.cache.remove(doc).then(response => {
      if (response.error) {
        throw new KinveyError('An error occurred trying to remove the document.', doc, response);
      }

      return {
        count: 1,
        documents: [doc]
      };
    });

    return promise;
  }

  removeBulk(docs) {
    const serializeDocs = [];

    if (!isArray(docs)) {
      return this.remove(docs);
    }

    forEach(docs, doc => {
      doc._deleted = true;
      serializedDocs.push(serialize(doc));
    });

    const promise = this.cache.bulkDocs(serializeDocs).then(responses => {
      var result = {
        count: 0,
        documents: []
      };

      forEach(responses, response => {
        if (response.ok) {
          const doc = find(docs, doc => {
            return doc._id === response.id;
          });

          result.count = result.count + 1;
          result.documents.push(doc);
        }
      });

      return result;
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

  static enabledDebug() {
    PouchDB.debug.enable('*');
  }

  static disableDebug() {
    PouchDB.debug.disable();
  }
}

module.exports = Store;
