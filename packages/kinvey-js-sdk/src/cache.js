import isArray from 'lodash/isArray';

let adapter = {
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
  }
};

/**
 * @private
 */
export function use(customAdapter) {
  adapter = customAdapter;
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
    return adapter.find(this.dbName, this.collectionName, query);
  }

  async reduce(aggregation) {
    return adapter.reduce(this.dbName, this.collectionName, aggregation);
  }

  async count(query) {
    return adapter.count(this.dbName, this.collectionName, query);
  }

  async findById(id) {
    return adapter.findById(this.dbName, this.collectionName, id);
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

      await adapter.save(this.dbName, this.collectionName, docs);
    }

    return singular ? docs[0] : docs;
  }

  async remove(query) {
    return adapter.remove(this.dbName, this.collectionName, query);
  }

  async removeById(id) {
    return adapter.removeById(this.dbName, this.collectionName, id);
  }

  async clear() {
    return adapter.clear(this.dbName, this.collectionName);
  }
}
