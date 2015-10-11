import Serializer from './serializer';
import KinveyError from '../../errors/error';
import assign from 'lodash/object/assign';
import when from 'when';
import localStorage from 'humble-localstorage';

export default class LocalStorageAdapter {
  constructor(dbInfo = {}) {
    dbInfo = assign({
      name: 'kinvey',
      collection: 'data'
    }, dbInfo);

    this.keyPrefix = `${dbInfo.name}.${dbInfo.collection}`;
  }

  serializeKey(key) {
    return `${this.keyPrefix}.${key}`;
  }

  deserializeKey(key) {
    return key.replace(`${this.keyPrefix}.`, '');
  }

  find(query) {
    const promises = [];

    for (let i = 0, len = localStorage.length; i < len; i++) {
      const key = localStorage.key(i);

      if (key.indexOf(this.keyPrefix) === 0) {
        promises.push(this.get(this.deserializeKey(key)));
      }
    }

    return when.all(promises).then(docs => {
      if (query) {
        return query.process(docs);
      }

      return docs;
    });
  }

  count(query) {
    const promise = this.find(query).then(docs => {
      return docs.length;
    });

    return promise;
  }

  findAndModify(key, fn) {
    const promise = this.get(key).then(doc => {
      doc = fn(doc || null);
      return this.save(doc);
    });

    return promise;
  }

  group(aggregation) {
    const query = new Query({ filter: aggregation.condition });

    // const reduce = aggregation.reduce.replace(/function[\s\S]*?\([\s\S]*?\)/, '');
    // aggregation.reduce = new Function(['doc', 'out'], reduce);

    const promise = this.find(query).then(docs => {
      const groups = {};

      docs.forEach((doc) => {
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

      const response = [];
      for (const segment in groups) {
        if (groups.hasOwnProperty(segment)) {
          response.push(groups[segment]);
        }
      }

      return response;
    });

    return promise;
  }

  get(key) {
    const value = localStorage.getItem(this.serializeKey(key));
    const serializer = new Serializer();
    const promise = serializer.deserialize(value);
    return promise;
  }

  save(doc) {
    if (!doc) {
      return when.resolve(null);
    }

    const serializer = new Serializer();
    const promise = serializer.serialize(doc).then(value => {
      try {
        localStorage.setItem(this.serializeKey(doc._id), value);
        return doc;
      } catch (err) {
        // Make error specific
        if (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
          throw err;
        }

        throw err;
      }
    });

    return promise;
  }

  batch(docs) {
    const promises = [];

    docs.forEach(doc => {
      promises.push(this.save(doc));
    });

    return when.all(promises);
  }

  delete(key) {
    const promise = when.promise(resolve => {
      localStorage.removeItem(this.serializeKey(key));
      resolve();
    });
    return promise;
  }

  clean() {
    return when.reject(new KinveyError('LocalStorageAdapter.clean() method is unsupported.'));
  }

  clear() {
    localStorage.clear();
    return when.resolve();
  }

  static isSupported() {
    const kinvey = 'kinvey';

    try {
      localStorage.setItem(kinvey, kinvey);
      localStorage.removeItem(kinvey);
      return true;
    } catch (err) {
      return false;
    }
  }
}
