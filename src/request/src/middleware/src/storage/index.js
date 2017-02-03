import { NotFoundError } from 'src/errors';
import MemoryAdapter from './src/memory';
import Queue from 'promise-queue';
import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
import { isDefined } from 'src/utils';
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
      .then(adapter => adapter.find(collection))
      .catch((error) => {
        if (error instanceof NotFoundError || error.code === 404) {
          return [];
        }

        throw error;
      })
      .then((entities = []) => entities);
  }

  findById(collection, id) {
    if (isString(id) === false) {
      return Promise.reject(new Error('id must be a string', id));
    }

    return this.loadAdapter()
      .then(adapter => adapter.findById(collection, id));
  }

  save(collection, entities = []) {
    return queue.add(() => {
      let singular = false;

      if (!entities) {
        return Promise.resolve(null);
      }

      if (!isArray(entities)) {
        singular = true;
        entities = [entities];
      }

      entities = entities.map((entity) => {
        let id = entity._id;
        const kmd = entity._kmd || {};

        if (!id) {
          id = this.generateObjectId();
          kmd.local = true;
        }

        entity._id = id;
        entity._kmd = kmd;
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
      .then((responses) => {
        return responses.reduce((entities, entity) => {
          entities.push(entity);
          return entities;
        }, []);
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
