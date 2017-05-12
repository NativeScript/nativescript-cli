import Promise from 'es6-promise';
import Queue from 'promise-queue';
import isString from 'lodash/isString';
import isArray from 'lodash/isArray';

import { isDefined, Log } from 'src/utils';
import { NotFoundError } from 'src/errors';
import MemoryAdapter from './src/memory';

Queue.configure(Promise);
const queue = new Queue(1, Infinity);

export {
  MemoryAdapter
};

export default class Storage {
  constructor(name) {
    if (!name) {
      throw new Error('Unable to create a Storage instance without a name.');
    }

    if (!isString(name)) {
      throw new Error('The name is not a string. A name must be a string to create a Storage instance.');
    }

    this.name = name;
  }

  loadAdapter() {
    return Promise.resolve()
      .then(() => MemoryAdapter.load(this.name))
      .then((adapter) => {
        if (isDefined(adapter) === false) {
          throw new Error('Unable to load a storage adapter.');
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

        throw error;
      })
      .then((entities = []) => entities);
  }

  findById(collection, id) {
    if (isString(id) === false) {
      const error = new Error('id must be a string', id);
      Log.error(`Unable to find an entity with id ${id} stored in the ${collection} collection.`, error);
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

      if (isDefined(entities) === false) {
        return Promise.resolve(null);
      }

      if (!isArray(entities)) {
        singular = true;
        entities = [entities];
      }

      entities = entities.map((entity) => {
        if (isDefined(entity._id) === false) {
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
      if (typeof entity._id === 'undefined') {
        return Promise.reject('Unable to remove an entity because it does not have _id.');
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
        return Promise.reject(new Error('id must be a string', id));
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
