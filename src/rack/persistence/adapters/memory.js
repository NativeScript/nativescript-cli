import { KinveyError, NotFoundError } from '../../../errors';
import MemoryCache from 'fast-memory-cache';
import keyBy from 'lodash/keyBy';
import values from 'lodash/values';
import find from 'lodash/find';
import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';

/**
 * @private
 */
export class Memory {
  constructor(name) {
    if (!name) {
      throw new KinveyError('A name for the collection is required to use the memory persistence adapter.', name);
    }

    if (!isString(name)) {
      throw new KinveyError('The name of the collection must be a string to use the memory persistence adapter', name);
    }

    this.name = name;
    this.cache = new MemoryCache();
  }

  find(collection) {
    return Promise.resolve().then(() => {
      const data = this.cache.get(`${this.name}${collection}`);

      if (data) {
        try {
          return JSON.parse(data);
        } catch (err) {
          return data;
        }
      }

      return data;
    }).then(entities => {
      if (!entities) {
        return [];
      }

      return entities;
    });
  }

  findById(collection, id) {
    return this.find(collection).then(entities => {
      const entity = find(entities, entity => {
        return entity[idAttribute] === id;
      });

      if (!entity) {
        throw new NotFoundError(`An entity with _id = ${id} was not found in the ${collection} ` +
          `collection on the ${this.name} memory database.`);
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

    return this.find(collection).then(existingEntities => {
      existingEntities = keyBy(existingEntities, idAttribute);
      entities = keyBy(entities, idAttribute);

      for (const id in entities) {
        if (entities.hasOwnProperty(id)) {
          existingEntities[id] = entities[id];
        }
      }

      this.cache.set(`${this.name}${collection}`, JSON.stringify(values(existingEntities)));
      entities = values(entities);
      return singular ? entities[0] : entities;
    });
  }

  removeById(collection, id) {
    return this.find(collection).then(entities => {
      const entitiesById = keyBy(entities, idAttribute);
      const entity = entitiesById[id];

      if (!entity) {
        throw new NotFoundError(`An entity with _id = ${id} was not found in the ${collection} ` +
          `collection on the ${this.name} memory database.`);
      }

      delete entitiesById[id];
      this.cache.set(`${this.name}${collection}`, JSON.stringify(values(entitiesById)));

      return {
        count: 1,
        entities: [entity]
      };
    });
  }

  static isSupported() {
    return true;
  }
}
