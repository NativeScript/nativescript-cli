import { NotFoundError } from '../../../errors';
import MemoryCache from 'fast-memory-cache';
import keyBy from 'lodash/keyBy';
import merge from 'lodash/merge';
import values from 'lodash/values';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';

/**
 * @private
 */
export class Memory {
  constructor(name = 'kinvey') {
    this.name = name;
    this.cache = new MemoryCache();
  }

  find(collection) {
    return Promise.resolve().then(() => {
      const data = this.cache.get(`${this.name}${collection}`);

      try {
        return JSON.parse(data);
      } catch (err) {
        return data;
      }
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
    return this.find(collection).then(existingEntities => {
      const existingEntitiesById = keyBy(existingEntities, idAttribute);
      const entitiesById = keyBy(entities, idAttribute);

      for (const id in existingEntitiesById) {
        if (existingEntitiesById.hasOwnProperty(id)) {
          const existingEntity = existingEntitiesById[id];
          const entity = entitiesById[id];

          if (entity) {
            entitiesById[id] = merge(existingEntity, entity);
          }
        }
      }

      this.cache.set(`${this.name}${collection}`, JSON.stringify(values(entitiesById)));
      return entities;
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
