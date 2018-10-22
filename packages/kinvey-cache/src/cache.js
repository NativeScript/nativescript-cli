import { Query } from 'kinvey-query';
import { Aggregation } from 'kinvey-aggregation';
import sift from 'sift';
import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';
import { nested } from './utils';

let store = {
  find() {
    throw new Error('You must override the default cache adapter.');
  },
  reduce() {
    throw new Error('You must override the default cache adapter.');
  },
  count() {
    throw new Error('You must override the default cache adapter.');
  },
  findById() {
    throw new Error('You must override the default cache adapter.');
  },
  save() {
    throw new Error('You must override the default cache adapter.');
  },
  remove() {
    throw new Error('You must override the default cache adapter.');
  },
  removeById() {
    throw new Error('You must override the default cache adapter.');
  },
  clear() {
    throw new Error('You must override the default cache adapter.');
  },
  clearAll() {
    throw new Error('You must override the default cache adapter.');
  }
};

/**
 * @private
 */
export function register(cacheStore) {
  if (cacheStore) {
    store = cacheStore;
  }
}

function generateId(length = 24) {
  const chars = 'abcdef0123456789';
  let id = '';

  for (let i = 0, j = chars.length; i < length; i += 1) {
    const pos = Math.floor(Math.random() * j);
    id += chars.substring(pos, pos + 1);
  }

  return id;
}

export class Cache {
  constructor(appKey, collectionName) {
    this.appKey = appKey;
    this.collectionName = collectionName;
  }

  async find(query) {
    let docs = await store.find(this.appKey, this.collectionName);

    if (query && !(query instanceof Query)) {
      throw new Error('query must be an instance of Query.');
    }

    if (query) {
      const {
        filter,
        sort,
        limit,
        skip,
        fields
      } = query;

      if (filter && !isEmpty(filter)) {
        docs = sift(filter, docs);
      }

      if (sort) {
        docs.sort((a, b) => {
          const result = Object.keys(sort).reduce((result, field) => {
            if (typeof result !== 'undefined') {
              return result;
            }

            if (Object.prototype.hasOwnProperty.call(sort, field)) {
              const aField = nested(a, field);
              const bField = nested(b, field);
              const modifier = sort[field]; // 1 (ascending) or -1 (descending).

              if ((aField !== null && typeof aField !== 'undefined')
                && (bField === null || typeof bField === 'undefined')) {
                return 1 * modifier;
              } else if ((bField !== null && typeof bField !== 'undefined')
                && (aField === null || typeof aField === 'undefined')) {
                return -1 * modifier;
              } else if (typeof aField === 'undefined' && bField === null) {
                return 0;
              } else if (aField === null && typeof bField === 'undefined') {
                return 0;
              } else if (aField !== bField) {
                return (aField < bField ? -1 : 1) * modifier;
              }
            }
          });

          return result || 0;
        });
      }

      if (skip > 0) {
        if (limit < Infinity) {
          docs = docs.slice(skip, skip + limit);
        } else {
          docs = docs.slice(skip);
        }
      }

      if (isArray(fields) && fields.length > 0) {
        docs = docs.map((doc) => {
          const modifiedDoc = doc;
          Object.keys(modifiedDoc).forEach((key) => {
            if (fields.indexOf(key) === -1) {
              delete modifiedDoc[key];
            }
          });
          return modifiedDoc;
        });
      }
    }
  }

  async reduce(aggregation) {
    if (!(aggregation instanceof Aggregation)) {
      throw new Error('aggregation must be an instance of Aggregation.');
    }

    const { query, initial, key, reduceFn } = aggregation;
    const fields = Object.keys(key);
    const docs = await this.find(query);

    if (fields.length > 0) {
      return fields.reduce((results, field) => {
        results[field] = docs.reduce((result, doc) => {
          return reduceFn(result, doc, field) || result;
        }, initial);
        return results;
      }, {});
    }

    return docs.reduce((result, doc) => reduceFn(doc, result) || result, Object.assign({}, initial));
  }

  async count(query) {
    if (query) {
      const docs = await this.find(query);
      return docs.length;
    }

    return store.count(this.appKey, this.collectionName);
  }

  findById(id) {
    return store.findById(this.appKey, this.collectionName, id);
  }

  async save(docs) {
    let docsToSave = docs;

    if (!docs) {
      return null;
    }

    if (!isArray(docs)) {
      docsToSave = [docs];
    }

    // Clone the docs
    docsToSave = docsToSave.slice(0, docsToSave.length);

    // Save the docs
    if (docsToSave.length > 0) {
      docsToSave = docsToSave.map((doc) => {
        if (!doc._id) {
          return Object.assign({
            _id: generateId(),
            _kmd: Object.assign({}, doc._kmd, { local: true })
          }, doc);
        }

        return doc;
      });

      await store.save(this.appKey, this.collectionName, docsToSave);
    }

    return docs;
  }

  async remove(query) {
    const docs = await this.find(query);

    if (query) {
      const results = await Promise.all(docs.map(doc => this.removeById(doc._id)));
      return results.reduce((totalCount, count) => totalCount + count, 0);
    }

    await this.clear();
    return docs.length;
  }

  removeById(id) {
    return store.removeById(this.appKey, this.collectionName, id);
  }

  clear() {
    return store.clear(this.appKey, this.collectionName);
  }
}

export function clearAll(appKey) {
  return store.clearAll(appKey);
}
