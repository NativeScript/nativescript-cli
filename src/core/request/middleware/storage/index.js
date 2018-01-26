import Promise from 'es6-promise';
import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
import { isDefined } from '../../../utils';
import { Queue } from './promise-queue';
import { Log } from '../../../log';
import { KinveyError, NotFoundError } from '../../../errors';
import { MemoryAdapter } from './memory';

const queue = new Queue(1, Infinity);

export const StorageProvider = {
  Memory: 'Memory'
};
Object.freeze(StorageProvider);

export class Storage {
  constructor(name, storageProviders = [StorageProvider.Memory]) {
    if (!name) {
      throw new KinveyError('Unable to create a Storage instance without a name.');
    }

    if (!isString(name)) {
      throw new KinveyError('The name is not a string. A name must be a string to create a Storage instance.');
    }

    this.name = name;

    if (!Array.isArray(storageProviders)) {
      storageProviders = [storageProviders];
    }
    this.storageProviders = storageProviders;
  }

  loadAdapter() {
    return this.storageProviders.reduce((promise, storageProvider) => {
      return promise.then((adapter) => {
        if (adapter) {
          return adapter;
        }

        switch (storageProvider) {
          case StorageProvider.Memory:
            return MemoryAdapter.load(this.name);
          default:
            return null;
        }
      });
    }, Promise.resolve())
      .then((adapter) => {
        if (!adapter) {
          return Promise.reject(new KinveyError('Unable to load a storage adapter.'));
        }

        return adapter;
      });
  }

  generateObjectId(length = 24) {
    const chars = 'abcdef0123456789';
    let objectId = '';

    for (let i = 0, j = chars.length; i < length; i += 1) {
      const pos = Math.floor(Math.random() * j);
      objectId += chars.substring(pos, pos + 1);
    }

    return objectId;
  }

  find(collection) {
    return this.loadAdapter()
      .then((adapter) => {
        Log.debug(`Find all the entities stored in the ${collection} collection.`, adapter);
        return adapter.find(collection);
      })
      .catch((error) => {
        Log.error(`Unable to find all the entities stored in the ${collection} collection.`, error);
        if (error instanceof NotFoundError || error.code === 404) {
          return [];
        }

        return Promise.reject(error);
      })
      .then((entities = []) => entities);
  }

  findById(collection, id) {
    if (!isString(id)) {
      const error = new KinveyError('id must be a string', id);
      Log.error(`Unable to find an entity with id ${id} stored in the ${collection} collection.`, error.message);
      return Promise.reject(error);
    }

    return this.loadAdapter()
      .then((adapter) => {
        Log.debug(`Find an entity with id ${id} stored in the ${collection} collection.`, adapter);
        return adapter.findById(collection, id);
      });
  }

  save(collection, entities = []) {
    return queue.add(() => {
      let singular = false;

      if (!isDefined(entities)) {
        return Promise.resolve(null);
      }

      if (!isArray(entities)) {
        singular = true;
        entities = [entities];
      }

      entities = entities.map((entity) => {
        if (!isDefined(entity._id)) {
          const kmd = entity._kmd || {};
          kmd.local = true;
          entity._kmd = kmd;
          entity._id = this.generateObjectId();
        }

        return entity;
      });

      return this.loadAdapter()
        .then(adapter => adapter.save(collection, entities))
        .then((entities) => {
          if (singular && entities.length > 0) {
            return entities[0];
          }

          return entities;
        });
    });
  }

  remove(collection, entities = []) {
    return Promise.all(entities.map((entity) => {
      if (!isDefined(entity._id)) {
        return Promise.reject(new KinveyError('Unable to remove this entity because it does not have _id.'));
      }

      return this.removeById(collection, entity._id);
    }))
      .then((results) => {
        return results.reduce((response, result) => {
          response.count += result.count;
          return response;
        }, { count: 0 });
      });
  }

  removeById(collection, id) {
    return queue.add(() => {
      if (!isString(id)) {
        return Promise.reject(new KinveyError('id must be a string', id));
      }

      return this.loadAdapter()
        .then(adapter => adapter.removeById(collection, id));
    });
  }

  clear() {
    return queue.add(() => {
      return this.loadAdapter()
        .then(adapter => adapter.clear());
    });
  }
}

export { MemoryAdapter };
