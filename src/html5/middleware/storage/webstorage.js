import { Promise } from 'es6-promise';
import { NotFoundError } from '../../../core/errors';
import { keyBy, isDefined } from '../../../core/utils';

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

    const masterCollection = global.localStorage.getItem(this.masterCollectionName);
    if (isDefined(masterCollection) === false) {
      global.localStorage.setItem(this.masterCollectionName, JSON.stringify([]));
    }
  }

  _find(collection) {
    try {
      const entities = global.localStorage.getItem(collection);

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
        const entity = entities.find((entity) => entity._id === id);

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
          global.localStorage.setItem(this.masterCollectionName, JSON.stringify(collections));
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

        global.localStorage.setItem(`${this.name}${collection}`, JSON.stringify(Object.values(entitiesById)));
        return entities;
      });
  }

  removeById(collection, id) {
    return this.find(collection)
      .then((entities) => {
        const entitiesById = keyBy(entities, '_id');
        const entity = entitiesById[id];

        if (isDefined(entity) === false) {
          throw new NotFoundError(`An entity with _id = ${id} was not found in the ${collection} ` +
            `collection on the ${this.name} memory database.`);
        }

        delete entitiesById[id];
        global.localStorage.setItem(`${this.name}${collection}`, JSON.stringify(Object.values(entitiesById)));
        return { count: 1 };
      });
  }

  clear() {
    return this._find(this.masterCollectionName)
      .then((collections) => {
        collections.forEach((collection) => {
          global.localStorage.removeItem(`${this.name}${collection}`);
        });

        global.localStorage.removeItem(this.masterCollectionName);
        return null;
      });
  }

  static load(name) {
    if (isDefined(global.localStorage)) {
      const item = '__testSupport';
      try {
        global.localStorage.setItem(item, item);
        global.localStorage.getItem(item);
        global.localStorage.removeItem(item);
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

    const masterCollection = global.sessionStorage.getItem(this.masterCollectionName);
    if (isDefined(masterCollection) === false) {
      global.sessionStorage.setItem(this.masterCollectionName, JSON.stringify([]));
    }
  }

  _find(collection) {
    try {
      const entities = global.sessionStorage.getItem(collection);

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
        const entity = entities.find((entity) => entity._id === id);

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
          global.sessionStorage.setItem(this.masterCollectionName, JSON.stringify(collections));
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

        global.sessionStorage.setItem(`${this.name}${collection}`, JSON.stringify(Object.values(entitiesById)));
        return entities;
      });
  }

  removeById(collection, id) {
    return this.find(collection)
      .then((entities) => {
        const entitiesById = keyBy(entities, '_id');
        const entity = entitiesById[id];

        if (isDefined(entity) === false) {
          throw new NotFoundError(`An entity with _id = ${id} was not found in the ${collection} ` +
            `collection on the ${this.name} memory database.`);
        }

        delete entitiesById[id];
        global.sessionStorage.setItem(`${this.name}${collection}`, JSON.stringify(Object.values(entitiesById)));
        return { count: 1 };
      });
  }

  clear() {
    return this._find(this.masterCollectionName)
      .then((collections) => {
        collections.forEach((collection) => {
          global.sessionStorage.removeItem(`${this.name}${collection}`);
        });

        global.sessionStorage.removeItem(this.masterCollectionName);
        return null;
      });
  }

  static load(name) {
    if (global.sessionStorage) {
      const item = '__testSupport';
      try {
        global.sessionStorage.setItem(item, item);
        global.sessionStorage.getItem(item);
        global.sessionStorage.removeItem(item);
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

    const values = global.document.cookie.split(';');
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
          global.document.cookie = `${this.masterCollectionName}=${encodeURIComponent(JSON.stringify([]))}; expires=${expires.toUTCString()}; path=/`;
        }
      }
    }
  }

  _find(collection) {
    const values = global.document.cookie.split(';');
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
        const entity = entities.find((entity) => entity._id === id);

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
          global.document.cookie = `${this.masterCollectionName}=${encodeURIComponent(JSON.stringify(collections))}; expires=${expires.toUTCString()}; path=/`;
        }

        return this.find(collection);
      })
      .then((existingEntities) => {
        const existingEntitiesById = keyBy(existingEntities, '_id');
        const existingEntityIds = Object.keys(existingEntitiesById);
        const entitiesById = keyBy(entities, '_id');

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
        global.document.cookie = `${this.name}${collection}=${encodeURIComponent(JSON.stringify(Object.values(entitiesById)))}; expires=${expires.toUTCString()}; path=/`;
        return entities;
      });
  }

  removeById(collection, id) {
    return this.find(collection)
      .then((entities) => {
        const entitiesById = keyBy(entities, '_id');
        const entity = entitiesById[id];

        if (isDefined(entity) === false) {
          throw new NotFoundError(`An entity with _id = ${id} was not found in the ${collection} ` +
            `collection on the ${this.name} memory database.`);
        }

        delete entitiesById[id];
        const expires = new Date();
        expires.setTime(expires.getTime() + (100 * 365 * 24 * 60 * 60 * 1000)); // Expire in 100 years
        global.document.cookie = `${this.name}${collection}=${encodeURIComponent(JSON.stringify(Object.values(entitiesById)))}; expires=${expires.toUTCString()}; path=/`;
        return { count: 1 };
      });
  }

  clear() {
    return this._find(this.masterCollectionName)
      .then((collections) => {
        collections.forEach((collection) => {
          const expires = new Date();
          expires.setTime(expires.getTime() + (100 * 365 * 24 * 60 * 60 * 1000)); // Expire in 100 years
          global.document.cookie = `${this.name}${collection}=${encodeURIComponent(JSON.stringify([]))}; expires=${expires.toUTCString()}; path=/`;
        });

        const expires = new Date();
        expires.setTime(expires.getTime() + (100 * 365 * 24 * 60 * 60 * 1000)); // Expire in 100 years
        global.document.cookie = `${this.masterCollectionName}=${encodeURIComponent(JSON.stringify([]))}; expires=${expires.toUTCString()}; path=/`;
        return null;
      });
  }

  static load(name) {
    if (typeof global.document.cookie === 'undefined') {
      return Promise.resolve(undefined);
    }

    return Promise.resolve(new CookieStorageAdapter(name));
  }
}
