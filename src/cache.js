import PQueue from 'p-queue';
import Query from './query';
import Aggregation from './aggregation';
import KinveyError from './errors/kinvey';
import { generateId } from './utils';

const queue = new PQueue({ concurrency: 1 });

export default class Cache {
  constructor(store) {
    if (!store) {
      throw new KinveyError('You must override the default cache adapter.');
    }

    this.store = store;
  }

  find(query) {
    return queue.add(async () => {
      const docs = await this.store.find();

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

    return queue.add(() => this.store.count());
  }

  findById(id) {
    return queue.add(() => this.store.findById(id));
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

        await this.store.save(docsToSave);
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
    return queue.add(() => this.store.removeById(id));
  }

  clear() {
    return queue.add(() => this.store.clear());
  }

  clearAll() {
    return queue.add(() => this.store.clearAll());
  }
}
