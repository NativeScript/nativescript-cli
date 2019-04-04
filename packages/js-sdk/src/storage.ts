import isArray from 'lodash/isArray';
import PQueue from 'p-queue';
import { ConfigKey, getConfig } from './config';
import { Query } from './query';
import { Aggregation } from './aggregation';
import { KinveyError } from './errors/kinvey';

const queue = new PQueue({ concurrency: 1 });

function generateId(length = 24) {
  const chars = 'abcdef0123456789';
  let id = '';

  for (let i = 0, j = chars.length; i < length; i += 1) {
    const pos = Math.floor(Math.random() * j);
    id += chars.substring(pos, pos + 1);
  }

  return id;
}

export interface Entity {
  _id?: string;
  _acl?: {
    creator?: string;
    gr?: boolean;
    gw?: boolean;
    r?: string[];
    w?: string[];
    groups?: {
      r?: string[];
      w?: string[];
    }
  };
  _kmd?: {
    local?: boolean;
    authtoken?: string;
    ect?: string;
    lmt?: string;
    emailVerification?: {
      status: string;
    }
  }
}

export interface StorageAdapter {
  find(dbName: string, collectionName: string): Promise<Entity[]>;
  count(dbName: string, collectionName: string): Promise<number>;
  findById(dbName: string, collectionName: string, id: string): Promise<Entity>;
  save(dbName: string, collectionName: string, docs: Entity[]): Promise<Entity[]>;
  removeById(dbName: string, collectionName: string, id: string): Promise<number>;
  clear(dbName: string, collectionName: string): Promise<any>;
  clearDatabase(dbName: string): Promise<any>;
}

export class Storage<T extends Entity> {
  public dbName: string;
  public collectionName: string;

  constructor(dbName: string, collectionName: string) {
    this.dbName = dbName;
    this.collectionName = collectionName;
  }

  get storageAdapter() {
    return getConfig<StorageAdapter>(ConfigKey.StorageAdapter);
  }

  find(query?: Query): Promise<T[]> {
    return queue.add(async () => {
      if (query && !(query instanceof Query)) {
        throw new KinveyError('Invalid query. It must be an instance of the Query class.');
      }

      const docs = await this.storageAdapter.find(this.dbName, this.collectionName);

      if (docs.length > 0 && query) {
        return query.process(docs);
      }

      return docs;
    });
  }

  async group(aggregation: Aggregation): Promise<any> {
    if (!(aggregation instanceof Aggregation)) {
      throw new KinveyError('Invalid aggregation. It must be an instance of the Aggregation class.');
    }

    const docs = await this.find();
    return aggregation.process(docs);
  }

  async count(query?: Query): Promise<number> {
    if (query) {
      const docs = await this.find(query);
      return docs.length;
    }

    return queue.add(() => this.storageAdapter.count(this.dbName, this.collectionName));
  }

  findById(id: string): Promise<Entity> {
    return queue.add(() => this.storageAdapter.findById(this.dbName, this.collectionName, id));
  }

  save(doc: T): Promise<T>
  save(docs: T[]): Promise<T[]>
  save(docs: any): Promise<any> {
    return queue.add(async () => {
      let docsToSave = docs;
      let singular = false;

      if (!docs) {
        return null;
      }

      if (!isArray(docs)) {
        singular = true;
        docsToSave = [docs];
      }

      // Clone the docs
      docsToSave = docsToSave.slice(0, docsToSave.length);

      if (docsToSave.length > 0) {
        docsToSave = docsToSave.map((doc: T) => {
          if (!doc._id) {
            return Object.assign({}, {
              _id: generateId(),
              _kmd: Object.assign({}, doc._kmd, { local: true })
            }, doc);
          }

          return doc;
        });

        await this.storageAdapter.save(this.dbName, this.collectionName, docsToSave);
        return singular ? docsToSave.shift() : docsToSave;
      }

      return docs;
    });
  }

  async remove(query?: Query): Promise<number> {
    const docs = await this.find(query);

    if (query) {
      const results = await Promise.all(docs.map(doc => this.removeById(doc._id!)));
      return results.reduce((totalCount, count) => totalCount + count, 0);
    }

    await this.clear();
    return docs.length;
  }

  removeById(id: string): Promise<number> {
    return queue.add(() => this.storageAdapter.removeById(this.dbName, this.collectionName, id));
  }

  clear() {
    return queue.add(() => this.storageAdapter.clear(this.dbName, this.collectionName));
  }

  static clear(dbName: string) {
    const storageAdapter = getConfig<StorageAdapter>(ConfigKey.StorageAdapter);
    return queue.add(() => storageAdapter.clearDatabase(dbName));
  }
}
