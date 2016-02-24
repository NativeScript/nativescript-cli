import { NotFoundError } from '../../../errors';
import keyBy from 'lodash/keyBy';
import merge from 'lodash/merge';
import values from 'lodash/values';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
let localStorage = undefined;

if (typeof window !== 'undefined') {
  localStorage = window.localStorage;
}

/**
 * @private
 */
export class LocalStorage {
  constructor(name = 'kinvey') {
    this.name = name;
  }

  find(collection) {
    return Promise.resolve().then(() => {
      const data = localStorage.getItem(`${this.name}${collection}`);

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

      localStorage.setItem(`${this.name}${collection}`, JSON.stringify(values(entitiesById)));
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
      localStorage.setItem(`${this.name}${collection}`, JSON.stringify(values(entitiesById)));

      return {
        count: 1,
        entities: [entity]
      };
    });
  }

  static isSupported() {
    const item = 'testLocalStorageSupport';
    try {
      localStorage.setItem(item, item);
      localStorage.removeItem(item);
      return true;
    } catch (e) {
      return false;
    }
  }
}
