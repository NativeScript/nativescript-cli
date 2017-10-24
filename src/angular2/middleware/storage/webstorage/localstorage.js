import { WebStorage } from './webstorage';

const MASTER_COLLECTION = '__master__';

class LocalStorage extends WebStorage {
  find(collection) {
    try {
      const entities = JSON.parse(global.localStorage.getItem(`${this.name}.${collection}`));
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
          global.localStorage.setItem(`${this.name}.${MASTER_COLLECTION}`, JSON.stringify(collections));
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

        global.localStorage.setItem(`${this.name}.${collection}`, JSON.stringify(exisitingEntities));
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
        global.localStorage.setItem(`${this.name}.${collection}`, JSON.stringify(entities));
        return { count: 1 };
      });
  }

  clear() {
    return this.find(MASTER_COLLECTION)
      .then((collections) => {
        collections.forEach((collection) => {
          global.localStorage.removeItem(`${this.name}.${collection}`);
        });

        global.localStorage.removeItem(`${this.name}.${MASTER_COLLECTION}`);
        return null;
      });
  }
}

const LocalStorageAdapter = {
  load(name) {
    if (global.localStorage) {
      const item = '__testSupport__';
      try {
        global.localStorage.setItem(item, item);
        global.localStorage.getItem(item);
        global.localStorage.removeItem(item);
        return Promise.resolve(new LocalStorage(name));
      } catch (e) {
        return Promise.resolve(undefined);
      }
    }

    return Promise.resolve(undefined);
  }
};
export { LocalStorageAdapter };
