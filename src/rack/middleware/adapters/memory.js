import { KinveyError, NotFoundError } from '../../../errors';
import MemoryCache from 'fast-memory-cache';
import keyBy from 'lodash/keyBy';
import forEach from 'lodash/forEach';
import values from 'lodash/values';
import find from 'lodash/find';
import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const caches = [];

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
    this.cache = caches[name];

    if (!this.cache) {
      this.cache = new MemoryCache();
      caches[name] = this.cache;
    }
  }

  async find(collection) {
    const entities = this.cache.get(collection);

    if (entities) {
      return JSON.parse(entities);
    }

    return [];
  }

  async findById(collection, id) {
    const entities = await this.find(collection);
    const entity = find(entities, entity => entity[idAttribute] === id);

    if (!entity) {
      throw new NotFoundError(`An entity with _id = ${id} was not found in the ${collection}`
        + ` collection on the ${this.name} memory database.`);
    }

    return entity;
  }

  async save(collection, entities) {
    let singular = false;

    if (!isArray(entities)) {
      entities = [entities];
      singular = true;
    }

    if (entities.length === 0) {
      return entities;
    }

    let existingEntities = await this.find(collection);
    existingEntities = keyBy(existingEntities, idAttribute);
    entities = keyBy(entities, idAttribute);
    const entityIds = Object.keys(entities);

    forEach(entityIds, id => {
      existingEntities[id] = entities[id];
    });

    this.cache.set(collection, JSON.stringify(values(existingEntities)));

    entities = values(entities);
    return singular ? entities[0] : entities;
  }

  async removeById(collection, id) {
    let entities = await this.find(collection);
    entities = keyBy(entities, idAttribute);
    const entity = entities[id];

    if (!entity) {
      throw new NotFoundError(`An entity with _id = ${id} was not found in the ${collection}`
        + ` collection on the ${this.name} memory database.`);
    }

    delete entities[id];
    this.cache.set(collection, JSON.stringify(values(entities)));

    return entity;
  }

  async clear() {
    this.cache.clear();
    return null;
  }

  static isSupported() {
    return true;
  }
}
