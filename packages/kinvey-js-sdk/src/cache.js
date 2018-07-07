import isArray from 'lodash/isArray';

let adapter;
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

  find(query) {
    return adapter.find(this.dbName, this.collectionName, query);
  }

  reduce(aggregation) {
    return adapter.reduce(this.dbName, this.collectionName, aggregation);
  }

  count(query) {
    return adapter.count(this.dbName, this.collectionName, query);
  }

  findById(id) {
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

  remove(query) {
    return adapter.remove(this.dbName, this.collectionName, query);
  }

  removeById(id) {
    return adapter.removeById(this.dbName, this.collectionName, id);
  }

  clear() {
    return adapter.clear(this.dbName, this.collectionName);
  }
}
