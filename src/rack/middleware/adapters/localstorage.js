import { NotFoundError } from '../../../errors';
import keyBy from 'lodash/keyBy';
import merge from 'lodash/merge';
import values from 'lodash/values';
import forEach from 'lodash/forEach';
import findIndex from 'lodash/findIndex';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const masterCollectionName = 'master';
const localStorage = global.localStorage;

/**
 * @private
 */
export class LocalStorage {
  constructor(name = 'kinvey') {
    this.name = name;
  }

  async find(collection) {
    const entities = localStorage.getItem(`${this.name}${collection}`);

    if (entities) {
      return JSON.parse(entities);
    }

    return entities;
  }

  async findById(collection, id) {
    const entities = await this.find(collection);
    const entity = find(entities, entity => entity[idAttribute] === id);

    if (!entity) {
      throw new NotFoundError(`An entity with _id = ${id} was not found in the ${collection}`
        + ` collection on the ${this.name} localstorage database.`);
    }

    return entity;
  }

  async save(collection, entities) {
    const collections = await this.find(masterCollectionName);

    if (findIndex(collections, collection) === -1) {
      collections.push(collection);
      localStorage.setItem(`${this.name}${masterCollectionName}`, JSON.stringify(collections));
    }

    const existingEntities = await this.find(collection);
    const existingEntitiesById = keyBy(existingEntities, idAttribute);
    const entitiesById = keyBy(entities, idAttribute);
    const existingEntityIds = Object.keys(existingEntitiesById);

    forEach(existingEntityIds, id => {
      const existingEntity = existingEntitiesById[id];
      const entity = entitiesById[id];

      if (entity) {
        entitiesById[id] = merge(existingEntity, entity);
      }
    });

    localStorage.setItem(`${this.name}${collection}`, JSON.stringify(values(entitiesById)));
    return entities;
  }

  async removeById(collection, id) {
    const entities = await this.find(collection);
    const entitiesById = keyBy(entities, idAttribute);
    const entity = entitiesById[id];

    if (!entity) {
      throw new NotFoundError(`An entity with _id = ${id} was not found in the ${collection} ` +
        `collection on the ${this.name} memory database.`);
    }

    delete entitiesById[id];
    localStorage.setItem(`${this.name}${collection}`, JSON.stringify(values(entitiesById)));

    return entity;
  }

  async clear() {
    const collections = await this.find(masterCollectionName);

    forEach(collections, collection => {
      localStorage.removeItem(`${this.name}${collection}`);
    });
  }

  static isSupported() {
    if (localStorage) {
      const item = 'testLocalStorageSupport';
      try {
        localStorage.setItem(item, item);
        localStorage.removeItem(item);
        return true;
      } catch (e) {
        return false;
      }
    }

    return false;
  }
}
