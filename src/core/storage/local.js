import Query from '../query';
import KinveyError from '../errors/error';
import StorageDriver from '../enums/storageDriver';
import MemoryDriver from './drivers/memory';
import localforage from 'localforage';
import when from 'when';
import assign from 'lodash/object/assign';
import isString from 'lodash/lang/isString';

// Define the memory driver
localforage.defineDriver(MemoryDriver);

export default class LocalStorage {
  constructor(options = {}) {
    if (!isString(options.collection)) {
      // TO DO: log warning
      options.collection = String(options.collection);
    }

    options = assign({
      name: options.collection,
      driver: process.env.KINVEY_PLATFORM_ENV === 'node' ? StorageDriver.Memory : [StorageDriver.WebSQL, StorageDriver.IndexedDB, StorageDriver.LocalStorage, StorageDriver.Memory]
    }, options);

    this.store = localforage.createInstance(options);
  }

  find(query) {
    if (query && !(query instanceof Query)) {
      return when.reject(new KinveyError('query must be a Kinvey.Query'));
    }

    const promise = when.promise((resolve, reject) => {
      localforage.keys((err, keys) => {
        if (err) {
          return reject(err);
        }

        const promises = keys.map((key) => {
          return localforage.getItem(key);
        });

        when.all(promises).then((docs) => {
          if (query) {
            return resolve(query.process(docs));
          }

          resolve(docs);
        });
      });
    });

    return promise;
  }

  group(aggregation, options = {}) {
    // Cast arguments. This casts the reduce string to reduce function.
    const reduce = aggregation.reduce.replace(/function[\s\S]*?\([\s\S]*?\)/, '');
    aggregation.reduce = new Function(['doc', 'out'], reduce);

    const query = new Query({
      filter: aggregation.condition
    });
    const promise = this.find(query, options).then((docs) => {
      const groups = {};

      docs.forEach((doc) => {
        const group = {};

        for (const name of aggregation.key) {
          group[name] = doc[name];
        }

        const key = JSON.stringify(group);

        if (!groups[key]) {
          groups[key] = group;

          for (const attr of aggregation.initial) {
            groups[key][attr] = aggregation.initial[attr];
          }
        }

        aggregation.reduce(doc, groups[key]);
      });

      const response = [];

      for (const segment of groups) {
        response.push(groups[segment]);
      }

      return response;
    });

    return promise;
  }

  get(key) {
    if (key) {
      if (!isString(key)) {
        return when.reject(new KinveyError('key must be a String'));
      }

      return localforage.getItem(key);
    }

    return when.resolve(null);
  }

  save(key, doc) {
    if (key) {
      if (!isString(key)) {
        // TO DO: log warning
        key = String(key);
      }

      return localforage.setItem(key, doc);
    }

    return when.resolve(false);
  }

  // batch(docs = {}) {
  //   const singular = !isArray(docs);
  //   docs = singular ? [docs] : docs.slice();

  //   const promises = docs.map((doc) => {
  //     if (!doc._id) {
  //       doc._id = Model.prototype.generateObjectId();
  //     }

  //     return localforage.setItem(doc._id, doc);
  //   });

  //   return when.all(promises).then((docs) => {
  //     return singular ? docs[0] : docs;
  //   });
  // }

  update(key, value) {
    return this.save(key, value);
  }

  clean(query) {
    if (query && !(query instanceof Query)) {
      return when.reject(new KinveyError('query must be a Kinvey.Query'));
    }

    // Copy the query and remove sort, limit and skip'
    if (query) {
      query = new Query(query.toJSON());
      query.sort(null).limit(null).skip(0);
    }

    const promise = this.find(query).then((docs) => {
      if (docs.length === 0) {
        return {
          count: 0,
          documents: []
        };
      }

      const promises = docs.map((doc) => {
        return this.destroy(doc.id);
      });

      return when.all(promises).then(() => {
        return {
          count: docs.length,
          documents: docs
        };
      });
    });

    return promise;
  }

  destroy(key) {
    if (key) {
      if (!isString(key)) {
        return when.reject(new KinveyError('key must be a String'));
      }

      return localforage.removeItem(key).then(() => {
        return {count: 1};
      });
    }

    return when.resolve({count: 0});
  }
}
