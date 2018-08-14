import isArray from 'lodash/isArray';

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
export function use(cacheStore) {
  store = cacheStore;
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

export default class Cache {
  constructor(dbName, collectionName) {
    this.dbName = dbName;
    this.collectionName = collectionName;
  }

  async find(query) {
    return store.find(this.dbName, this.collectionName, query);
  }

  async reduce(aggregation) {
    return store.reduce(this.dbName, this.collectionName, aggregation);
  }

  async count(query) {
    return store.count(this.dbName, this.collectionName, query);
  }

  async findById(id) {
    return store.findById(this.dbName, this.collectionName, id);
  }

  async save(docsToSaveOrUpdate) {
    let docs = docsToSaveOrUpdate;
    let singular = false;

    if (!docs) {
      return null;
    }

    if (!isArray(docs)) {
      singular = true;
      docs = [docs];
    }

    if (docs.length > 0) {
      docs = docs.map((doc) => {
        if (!doc._id) {
          return Object.assign({
            _id: generateId(),
            _kmd: Object.assign({}, doc._kmd, { local: true })
          }, doc);
        }

        return doc;
      });

      await store.save(this.dbName, this.collectionName, docs);
    }

    return singular ? docs[0] : docs;
  }

  async remove(query) {
    return store.remove(this.dbName, this.collectionName, query);
  }

  async removeById(id) {
    return store.removeById(this.dbName, this.collectionName, id);
  }

  async clear() {
    return store.clear(this.dbName, this.collectionName);
  }
}

export function clearAll(appKey) {
  store.clearAll(appKey);
}
