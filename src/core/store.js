const StoreAdapter = require('./enums').StoreAdapter;
const KinveyError = require('./errors').KinveyError;
const Promise = require('bluebird');
const Query = require('./query');
const Aggregation = require('./aggregation');
const NotFoundError = require('./errors').NotFoundError;
const IndexedDB = require('./persistence/indexeddb');
const platform = require('../utils/platform');
const Loki = require('lokijs');
const log = require('loglevel');
const result = require('lodash/object/result');
const forEach = require('lodash/collection/forEach');
const pluck = require('lodash/collection/pluck');
const isString = require('lodash/lang/isString');
const isArray = require('lodash/lang/isArray');
const isFunction = require('lodash/lang/isFunction');
const databaseName = 'kinvey';

const loki = new Loki(databaseName, {
  env: process.env.KINVEY_LOKI_ENV || 'NODEJS',
  autosave: true,
  autosaveInterval: 1000,
  autoload: true,
  autoloadCallback: function() {
    console.log('db loaded');
  },
  persistenceMethod: 'adapter',
  persistenceAdapter: new IndexedDB(databaseName)
});

// class LocalStorageAdapter {
//   valid() {
//     const kinvey = 'kinvey';
//     try {
//       localStorage.setItem(kinvey, kinvey);
//       localStorage.removeItem(kinvey);
//       return true;
//     } catch (e) {
//       return false;
//     }
//   }
// }

class Store {
  constructor(name = 'data', adapters = [StoreAdapter.Memory]) {
    this.collection = loki.getCollection(name);

    if (!this.collection) {
      this.collection = loki.addCollection(name, { indices: ['_id', '_kmd'] });
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

  find(query) {
    const promise = new Promise(resolve => {
      if (query && !(query instanceof Query)) {
        query = new Query(result(query, 'toJSON', query));
      }

      let docs = this.collection.find();

      if (docs.length > 0 && query) {
        docs = query.process(docs);
      }

      resolve(docs);
    });

    return promise;
  }

  count(collection, query) {
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
    aggregation.reduce = new Function(['doc', 'out'], reduce); // eslint-disable-line no-new-func

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

    const query = new Query();
    query.contains('_id', [id]);
    const promise = this.find(query).then(docs => {
      return docs.length === 1 ? docs[0] : null;
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
    let promise;

    if (!doc) {
      return Promise.resolve(null);
    }

    if (isArray(doc)) {
      return this.saveBulk(doc);
    }

    if (!doc._id) {
      doc._id = this.generateObjectId();
    }

    promise = new Promise(resolve => {
      if (doc.$loki) {
        return resolve(this.collection.update(doc));
      }

      resolve(this.collection.insert(doc));
    });

    return promise;
  }

  saveBulk(docs = []) {
    const promises = [];

    if (!isArray(docs)) {
      return this.save(docs);
    }

    forEach(docs, doc => {
      promises.push(this.save(doc));
    });

    const promise = Promise.all(promises);
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
      return this.removeWhere(query);
    }

    const promise = this.get(id).then(doc => {
      if (!doc) {
        throw new NotFoundError();
      }

      this.collection.remove(doc);
      return {
        count: 1,
        documents: [doc]
      };
    });

    return promise;
  }

  removeBulk(ids = []) {
    const promises = [];

    if (!isArray(ids)) {
      return this.remove(ids);
    }

    forEach(ids, id => {
      promises.push(this.remove(id));
    });

    const promise = Promise.all(promises);
    return promise;
  }

  removeWhere(query) {
    const promise = this.find(query).then(docs => {
      return this.removeBulk(pluck(docs, '_id'));
    });
    return promise;
  }
}

module.exports = Store;
