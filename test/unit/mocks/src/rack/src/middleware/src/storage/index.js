import { NotFoundError } from '../errors';
import Memory from './src/memory';
import Promise from 'core-js/es6/promise';
import Queue from 'promise-queue';
import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';
Queue.configure(Promise);
const queue = new Queue(1, Infinity);

/**
 * Enum for Storage Adapters.
 */
const StorageAdapter = {
  Memory: 'Memory'
};
Object.freeze(StorageAdapter);

export default class Storage {
  constructor(name, adapters = [StorageAdapter.Memory]) {
    if (!name) {
      throw new Error('Unable to create a Storage instance without a name.');
    }

    if (!isString(name)) {
      throw new Error('The name is not a string. A name must be a string to create a Storage instance.');
    }

    if (!isArray(adapters)) {
      adapters = [adapters];
    }

    adapters.some((adapter) => {
      switch (adapter) {
        case StorageAdapter.Memory:
          if (Memory.isSupported()) {
            this.adapter = new Memory(name);
            return true;
          }

          break;
        default:
          // Log.warn(`The ${adapter} adapter is is not recognized.`);
      }

      return false;
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
    return this.adapter.find(collection).then((entities) => {
      if (!entities) {
        return [];
      }

      return entities;
    }).catch((error) => {
      if (error instanceof NotFoundError) {
        return [];
      }

      throw error;
    });
  }

  findById(collection, id) {
    if (!isString(id)) {
      return Promise.reject(new Error('id must be a string', id));
    }

    return this.adapter.findById(collection, id);
  }

  save(collection, entities = []) {
    let singular = false;

    return queue.add(() => {
      if (!entities) {
        return null;
      }

      if (!isArray(entities)) {
        singular = true;
        entities = [entities];
      }

      entities = entities.map((entity) => {
        let id = entity[idAttribute];
        const kmd = entity[kmdAttribute] || {};

        if (!id) {
          id = this.generateObjectId();
          kmd.local = true;
        }

        entity[idAttribute] = id;
        entity[kmdAttribute] = kmd;
        return entity;
      });

      return this.adapter.save(collection, entities);
    }).then((entities) => {
      if (singular && entities.length > 0) {
        return entities[0];
      }

      return entities;
    });
  }

  remove(collection, entities = []) {
    return Promise.all(entities.map(entity => this.removeById(collection, entity[idAttribute])))
      .then((responses) => {
        const result = responses.reduce((entities, entity) => {
          entities.push(entity);
          return entities;
        }, []);
        return result;
      });
  }

  removeById(collection, id) {
    return queue.add(() => {
      if (!id) {
        return undefined;
      }

      if (!isString(id)) {
        throw new Error('id must be a string', id);
      }

      return this.adapter.removeById(collection, id);
    });
  }

  clear() {
    return queue.add(() => this.adapter.clear());
  }
}
