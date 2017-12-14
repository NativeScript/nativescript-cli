import Promise from 'es6-promise';
import MemoryCache from 'fast-memory-cache';
import keyBy from 'lodash/keyBy';
import forEach from 'lodash/forEach';
import values from 'lodash/values';
import find from 'lodash/find';
import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
import { isDefined } from '../../../utils';
import { NotFoundError } from '../../../errors';

const caches = {};

class Memory {
  constructor(name) {
    if (!isDefined(name)) {
      throw new Error('A name for the collection is required to use the memory persistence adapter.', name);
    }

    if (!isString(name)) {
      throw new Error('The name of the collection must be a string to use the memory persistence adapter', name);
    }

    this.name = name;
    this.cache = caches[name];

    if (!isDefined(this.cache)) {
      this.cache = new MemoryCache();
      caches[name] = this.cache;
    }
  }

  find(collection) {
    try {
      const entities = this.cache.get(collection);

      if (entities) {
        return Promise.resolve(JSON.parse(entities));
      }

      return Promise.resolve([]);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  findById(collection, id) {
    return this.find(collection)
      .then((entities) => {
        const entity = find(entities, entity => entity._id === id);

        if (!entity) {
          return Promise.reject(new NotFoundError(`An entity with _id = ${id} was not found in the ${collection}`
            + ` collection on the ${this.name} memory database.`));
        }

        return entity;
      });
  }

  save(collection, entities) {
    let singular = false;

    if (!isArray(entities)) {
      entities = [entities];
      singular = true;
    }

    if (entities.length === 0) {
      return Promise.resolve(entities);
    }

    return this.find(collection)
      .then((existingEntities) => {
        existingEntities = keyBy(existingEntities, '_id');
        entities = keyBy(entities, '_id');
        const entityIds = Object.keys(entities);

        forEach(entityIds, (id) => {
          existingEntities[id] = entities[id];
        });

        this.cache.set(collection, JSON.stringify(values(existingEntities)));

        entities = values(entities);
        return singular ? entities[0] : entities;
      });
  }

  removeById(collection, id) {
    return this.find(collection)
      .then((entities) => {
        entities = keyBy(entities, '_id');
        const entity = entities[id];

        if (!isDefined(entity)) {
          return Promise.reject(new NotFoundError(`An entity with _id = ${id} was not found in the ${collection}`
            + ` collection on the ${this.name} memory database.`));
        }

        delete entities[id];
        this.cache.set(collection, JSON.stringify(values(entities)));
        return { count: 1 };
      });
  }

  clear() {
    this.cache.clear();
    return Promise.resolve(null);
  }
}

export const MemoryAdapter = {
  load(name) {
    return Promise.resolve(new Memory(name));
  }
};
