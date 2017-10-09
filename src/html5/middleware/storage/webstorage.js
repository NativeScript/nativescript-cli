import { Promise } from 'es6-promise';
import { NotFoundError } from '../../../core/errors';
import { keyBy, isDefined } from '../../../core/utils';

const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const masterCollectionName = 'master';

export class WebStorageAdapter {
  constructor(name = 'kinvey') {
    this.name = name;
  }

  get masterCollectionName() {
    return `${this.name}${masterCollectionName}`;
  }
}

export class LocalStorageAdapter extends WebStorageAdapter {
  constructor(name) {
    super(name);

    const masterCollection = localStorage.getItem(this.masterCollectionName);
    if (isDefined(masterCollection) === false) {
      localStorage.setItem(this.masterCollectionName, JSON.stringify([]));
    }
  }

  _find(collection) {
    try {
      const entities = localStorage.getItem(collection);

      if (isDefined(entities)) {
        return Promise.resolve(JSON.parse(entities));
      }

      return Promise.resolve(entities || []);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  find(collection) {
    return this._find(`${this.name}${collection}`);
  }

  findById(collection, id) {
    return this.find(collection)
      .then((entities) => {
        const entity = find(entities, entity => entity[idAttribute] === id);

        if (isDefined(entity) === false) {
          throw new NotFoundError(`An entity with _id = ${id} was not found in the ${collection}`
            + ` collection on the ${this.name} localstorage database.`);
        }

        return entity;
      });
  }

  save(collection, entities) {
    return this._find(this.masterCollectionName)
      .then((collections) => {
        if (collections.indexOf(collection) === -1) {
          collections.push(collection);
          localStorage.setItem(this.masterCollectionName, JSON.stringify(collections));
        }

        return this.find(collection);
      })
      .then((existingEntities) => {
        const existingEntitiesById = keyBy(existingEntities, '_id');
        const entitiesById = keyBy(entities, '_id');
        const existingEntityIds = Object.keys(existingEntitiesById);

        existingEntityIds.forEach((id) => {
          const existingEntity = existingEntitiesById[id];
          const entity = entitiesById[id];

          if (isDefined(entity)) {
            entitiesById[id] = Object.assign(existingEntity, entity);
          } else {
            entitiesById[id] = existingEntity;
          }
        });

        localStorage.setItem(`${this.name}${collection}`, JSON.stringify(Object.values(entitiesById)));
        return entities;
      });
  }

  removeById(collection, id) {
    return this.find(collection)
      .then((entities) => {
        const entitiesById = keyBy(entities, idAttribute);
        const entity = entitiesById[id];

        if (isDefined(entity) === false) {
          throw new NotFoundError(`An entity with _id = ${id} was not found in the ${collection} ` +
            `collection on the ${this.name} memory database.`);
        }

        delete entitiesById[id];
        localStorage.setItem(`${this.name}${collection}`, JSON.stringify(Object.values(entitiesById)));
        return { count: 1 };
      });
  }

  clear() {
    return this._find(this.masterCollectionName)
      .then((collections) => {
        collections.forEach((collection) => {
          localStorage.removeItem(`${this.name}${collection}`);
        });

        localStorage.removeItem(this.masterCollectionName);
        return null;
      });
  }

  static load(name) {
    if (isDefined(localStorage)) {
      const item = '__testSupport';
      try {
        localStorage.setItem(item, item);
        localStorage.getItem(item);
        localStorage.removeItem(item);
        return Promise.resolve(new LocalStorageAdapter(name));
      } catch (e) {
        return Promise.resolve(undefined);
      }
    }

    return Promise.resolve(undefined);
  }
}

export class SessionStorageAdapter extends WebStorageAdapter {
  constructor(name) {
    super(name);

    const masterCollection = sessionStorage.getItem(this.masterCollectionName);
    if (isDefined(masterCollection) === false) {
      sessionStorage.setItem(this.masterCollectionName, JSON.stringify([]));
    }
  }

  _find(collection) {
    try {
      const entities = sessionStorage.getItem(collection);

      if (isDefined(entities)) {
        return Promise.resolve(JSON.parse(entities));
      }

      return Promise.resolve(entities || []);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  find(collection) {
    return this._find(`${this.name}${collection}`);
  }

  findById(collection, id) {
    return this.find(collection)
      .then((entities) => {
        const entity = find(entities, entity => entity[idAttribute] === id);

        if (isDefined(entity) === false) {
          throw new NotFoundError(`An entity with _id = ${id} was not found in the ${collection}`
            + ` collection on the ${this.name} localstorage database.`);
        }

        return entity;
      });
  }

  save(collection, entities) {
    return this._find(this.masterCollectionName)
      .then((collections) => {
        if (collections.indexOf(collection) === -1) {
          collections.push(collection);
          sessionStorage.setItem(this.masterCollectionName, JSON.stringify(collections));
        }

        return this.find(collection);
      })
      .then((existingEntities) => {
        const existingEntitiesById = keyBy(existingEntities, idAttribute);
        const entitiesById = keyBy(entities, idAttribute);
        const existingEntityIds = Object.keys(existingEntitiesById);

        existingEntityIds.forEach((id) => {
          const existingEntity = existingEntitiesById[id];
          const entity = entitiesById[id];

          if (isDefined(entity)) {
            entitiesById[id] = Object.assign(existingEntity, entity);
          } else {
            entitiesById[id] = existingEntity;
          }
        });

        sessionStorage.setItem(`${this.name}${collection}`, JSON.stringify(Object.values(entitiesById)));
        return entities;
      });
  }

  removeById(collection, id) {
    return this.find(collection)
      .then((entities) => {
        const entitiesById = keyBy(entities, idAttribute);
        const entity = entitiesById[id];

        if (isDefined(entity) === false) {
          throw new NotFoundError(`An entity with _id = ${id} was not found in the ${collection} ` +
            `collection on the ${this.name} memory database.`);
        }

        delete entitiesById[id];
        sessionStorage.setItem(`${this.name}${collection}`, JSON.stringify(Object.values(entitiesById)));
        return { count: 1 };
      });
  }

  clear() {
    return this._find(this.masterCollectionName)
      .then((collections) => {
        collections.forEach((collection) => {
          sessionStorage.removeItem(`${this.name}${collection}`);
        });

        sessionStorage.removeItem(this.masterCollectionName);
        return null;
      });
  }

  static load(name) {
    if (sessionStorage) {
      const item = '__testSupport';
      try {
        sessionStorage.setItem(item, item);
        sessionStorage.getItem(item);
        sessionStorage.removeItem(item);
        return Promise.resolve(new SessionStorageAdapter(name));
      } catch (e) {
        return Promise.resolve(undefined);
      }
    }

    return Promise.resolve(undefined);
  }
}

export class CookieStorageAdapter extends WebStorageAdapter {
  constructor(name) {
    super(name);

    const values = document.cookie.split(';');
    for (let i = 0, len = values.length; i < len; i += 1) {
      let value = values[i];
      while (value.charAt(0) === ' ') {
        value = value.substring(1);
      }
      if (value.indexOf(this.masterCollectionName) === 0) {
        const masterCollection = decodeURIComponent(value.substring(this.masterCollectionName.length, value.length));

        if (isDefined(masterCollection) === false) {
          const expires = new Date();
          expires.setTime(expires.getTime() + (100 * 365 * 24 * 60 * 60 * 1000)); // Expire in 100 years
          document.cookie = `${this.masterCollectionName}=${encodeURIComponent(JSON.stringify([]))}; expires=${expires.toUTCString()}; path=/`;
        }
      }
    }
  }

  _find(collection) {
    const values = document.cookie.split(';');
    for (let i = 0, len = values.length; i < len; i += 1) {
      let value = values[i];
      while (value.charAt(0) === ' ') {
        value = value.substring(1);
      }
      if (value.indexOf(collection) === 0) {
        return Promise.resolve(JSON.parse(decodeURIComponent(value.substring(collection.length + 1, value.length))));
      }
    }
    return Promise.resolve([]);
  }

  find(collection) {
    return this._find(`${this.name}${collection}`);
  }

  findById(collection, id) {
    return this.find(collection)
      .then((entities) => {
        const entity = find(entities, entity => entity[idAttribute] === id);

        if (isDefined(entity) === false) {
          throw new NotFoundError(`An entity with _id = ${id} was not found in the ${collection}`
            + ` collection on the ${this.name} localstorage database.`);
        }

        return entity;
      });
  }

  save(collection, entities) {
    return this._find(this.masterCollectionName)
      .then((collections) => {
        if (collections.indexOf(collection) === -1) {
          collections.push(collection);
          const expires = new Date();
          expires.setTime(expires.getTime() + (100 * 365 * 24 * 60 * 60 * 1000)); // Expire in 100 years
          document.cookie = `${this.masterCollectionName}=${encodeURIComponent(JSON.stringify(collections))}; expires=${expires.toUTCString()}; path=/`;
        }

        return this.find(collection);
      })
      .then((existingEntities) => {
        const existingEntitiesById = keyBy(existingEntities, idAttribute);
        const existingEntityIds = Object.keys(existingEntitiesById);
        const entitiesById = keyBy(entities, idAttribute);

        existingEntityIds.forEach((id) => {
          const existingEntity = existingEntitiesById[id];
          const entity = entitiesById[id];

          if (isDefined(entity)) {
            entitiesById[id] = Object.assign(existingEntity, entity);
          } else {
            entitiesById[id] = existingEntity;
          }
        });

        const expires = new Date();
        expires.setTime(expires.getTime() + (100 * 365 * 24 * 60 * 60 * 1000)); // Expire in 100 years
        document.cookie = `${this.name}${collection}=${encodeURIComponent(JSON.stringify(Object.values(entitiesById)))}; expires=${expires.toUTCString()}; path=/`;
        return entities;
      });
  }

  removeById(collection, id) {
    return this.find(collection)
      .then((entities) => {
        const entitiesById = keyBy(entities, idAttribute);
        const entity = entitiesById[id];

        if (isDefined(entity) === false) {
          throw new NotFoundError(`An entity with _id = ${id} was not found in the ${collection} ` +
            `collection on the ${this.name} memory database.`);
        }

        delete entitiesById[id];
        const expires = new Date();
        expires.setTime(expires.getTime() + (100 * 365 * 24 * 60 * 60 * 1000)); // Expire in 100 years
        document.cookie = `${this.name}${collection}=${encodeURIComponent(JSON.stringify(Object.values(entitiesById)))}; expires=${expires.toUTCString()}; path=/`;
        return { count: 1 };
      });
  }

  clear() {
    return this._find(this.masterCollectionName)
      .then((collections) => {
        collections.forEach((collection) => {
          const expires = new Date();
          expires.setTime(expires.getTime() + (100 * 365 * 24 * 60 * 60 * 1000)); // Expire in 100 years
          document.cookie = `${this.name}${collection}=${encodeURIComponent(JSON.stringify([]))}; expires=${expires.toUTCString()}; path=/`;
        });

        const expires = new Date();
        expires.setTime(expires.getTime() + (100 * 365 * 24 * 60 * 60 * 1000)); // Expire in 100 years
        document.cookie = `${this.masterCollectionName}=${encodeURIComponent(JSON.stringify([]))}; expires=${expires.toUTCString()}; path=/`;
        return null;
      });
  }

  static load(name) {
    if (typeof document.cookie === 'undefined') {
      return Promise.resolve(undefined);
    }

    return Promise.resolve(new CookieStorageAdapter(name));
  }
}
