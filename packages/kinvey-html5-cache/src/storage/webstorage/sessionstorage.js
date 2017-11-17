const Promise = require('es6-promise');
const { WebStorage } = require('./webstorage');

const MASTER_COLLECTION = '__master__';

class SessionStorage extends WebStorage {
  find(collection) {
    try {
      const entities = JSON.parse(global.sessionStorage.getItem(`${this.name}.${collection}`));
      return Promise.resolve(entities || []);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  findById(collection, id) {
    return this.find(collection)
      .then((entities) => entities.find((entity) => entity._id === id));
  }

  save(collection, entities = []) {
    let singular = false;

    if (!Array.isArray(entities)) {
      entities = [entities];
      singular = true;
    }

    return this.find(MASTER_COLLECTION)
      .then((collections) => {
        if (collections.indexOf(collection) === -1) {
          collections.push(collection);
          global.sessionStorage.setItem(`${this.name}.${MASTER_COLLECTION}`, JSON.stringify(collections));
        }

        return this.find(collection);
      })
      .then((exisitingEntities) => {
        entities.forEach((entity) => {
          const index = exisitingEntities.findIndex((exisitingEntity) => exisitingEntity._id === entity._id);
          if (index === -1) {
            exisitingEntities.push(entity);
          } else {
            exisitingEntities[index] = entity;
          }
        });

        global.sessionStorage.setItem(`${this.name}.${collection}`, JSON.stringify(exisitingEntities));
        return singular ? entities[0] : entities;
      });
  }

  removeById(collection, id) {
    return this.find(collection)
      .then((entities) => {
        const index = entities.findIndex((entity) => entity._id === id);

        if (index === -1) {
          return { count: 0 };
        }

        entities.splice(index, 1);
        global.sessionStorage.setItem(`${this.name}.${collection}`, JSON.stringify(entities));
        return { count: 1 };
      });
  }

  clear() {
    return this.find(MASTER_COLLECTION)
      .then((collections) => {
        collections.forEach((collection) => {
          global.sessionStorage.removeItem(`${this.name}.${collection}`);
        });

        global.sessionStorage.removeItem(`${this.name}.${MASTER_COLLECTION}`);
        return null;
      });
  }
}

exports.SessionStorageAdapter = {
  load(name) {
    if (global.sessionStorage) {
      const item = '__testSupport__';
      try {
        global.sessionStorage.setItem(item, item);
        global.sessionStorage.getItem(item);
        global.sessionStorage.removeItem(item);
        return Promise.resolve(new SessionStorage(name));
      } catch (e) {
        return Promise.resolve(undefined);
      }
    }

    return Promise.resolve(undefined);
  }
};
