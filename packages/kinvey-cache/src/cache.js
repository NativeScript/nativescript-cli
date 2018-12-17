import { Query } from 'kinvey-query';
import { Aggregation } from 'kinvey-aggregation';
import { KinveyError } from 'kinvey-errors';
import PQueue from 'p-queue';

const queue = new PQueue({ concurrency: 1 });

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
  constructor(storeName, collectionName) {
    this.storeName = storeName;
    this.collectionName = collectionName;
  }

  find(query) {
    return queue.add(async () => {
      const docs = await store.find(this.storeName, this.collectionName);

      if (query && !(query instanceof Query)) {
        throw new KinveyError('Invalid query. It must be an instance of the Query class.');
      }

      if (docs.length > 0 && query) {
        return query.process(docs);
      }

      return docs;
    });
  }

  async group(aggregation) {
    if (!(aggregation instanceof Aggregation)) {
      throw new KinveyError('Invalid aggregation. It must be an instance of the Aggregation class.');
    }

    const docs = await this.find();
    return aggregation.process(docs);
  }

  reduce(aggregation) {
    return this.group(aggregation);
  }

  async count(query) {
    if (query) {
      const docs = await this.find(query);
      return docs.length;
    }

    return queue.add(() => store.count(this.storeName, this.collectionName));
  }

  findById(id) {
    return queue.add(() => store.findById(this.storeName, this.collectionName, id));
  }

  save(docs) {
    return queue.add(async () => {
      let docsToSave = docs;
      let singular = false;

      if (!docs) {
        return null;
      }

      if (!Array.isArray(docs)) {
        singular = true;
        docsToSave = [docs];
      }

      // Clone the docs
      docsToSave = docsToSave.slice(0, docsToSave.length);

      // Save the docs
      if (docsToSave.length > 0) {
        docsToSave = docsToSave.map((doc) => {
          if (!doc._id) {
            return Object.assign({}, {
              _id: generateId(),
              _kmd: Object.assign({}, doc._kmd, { local: true })
            }, doc);
          }

          return doc;
        });

        await store.save(this.storeName, this.collectionName, docsToSave);
        return singular ? docsToSave.shift() : docsToSave;
      }

      return docs;
    });
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
    return queue.add(() => store.removeById(this.storeName, this.collectionName, id));
  }

  clear() {
    return queue.add(() => store.clear(this.storeName, this.collectionName));
  }
}

export function clear(storeName) {
  return queue.add(() => store.clearAll(storeName));
}
