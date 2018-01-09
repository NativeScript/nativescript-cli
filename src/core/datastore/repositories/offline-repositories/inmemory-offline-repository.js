import keyBy from 'lodash/keyBy';
import { NotFoundError } from '../../../errors';

import { OfflineRepository } from '../offline-repository';
import { applyQueryToDataset } from '../utils';
import { ensureArray } from '../../../utils';

// Imported for typings
// import { KeyValuePersister } from '../../persisters';

export class InmemoryOfflineRepository extends OfflineRepository {
  /** @type {KeyValuePersister} */
  _persister;
  /** @type {PromiseQueue} */
  _queue;

  constructor(persister, promiseQueue) {
    super();
    this._persister = persister;
    this._queue = promiseQueue;
  }

  // ----- private methods

  _readAll(collection) {
    const key = this._formCollectionKey(collection);
    return this._persister.read(key)
      .then(entities => entities || []);
  }

  // TODO: Keep them by id
  _saveAll(collection, entities) {
    const key = this._formCollectionKey(collection);
    return this._persister.write(key, entities);
  }

  _deleteAll(collection) {
    const key = this._formCollectionKey(collection);
    return this._persister.delete(key);
  }

  _enqueueCrudOperation(collection, operation) {
    const key = this._formCollectionKey(collection);
    return this._queue.enqueue(key, operation);
  }

  _keyBelongsToApp(key) {
    const appKey = this._getAppKey();
    return key.indexOf(appKey) === 0;
  }

  _getCollectionFromKey(key) {
    const appKey = this._getAppKey();
    return key.substring(`${appKey}.`.length);
  }

  _getAllCollections() {
    return this._persister.getKeys()
      .then((keys) => {
        const collections = [];
        keys = keys || [];
        keys.forEach((key) => {
          if (this._keyBelongsToApp(key)) {
            collections.push(this._getCollectionFromKey(key));
          }
        });
        return collections;
      });
  }

  _countAndDelete(collection) {
    return this._readAll(collection)
      .then((entities) => {
        return this._deleteAll(collection)
          .then(() => entities.length);
      });
  }

  _clearAllCollections() {
    return this._getAllCollections()
      .then((collections) => {
        const promises = collections.map(c => this._deleteAll(c));
        return Promise.all(promises);
      });
  }

  // ----- protected methods

  // TODO: integrate with db/collection concept in parent(s)?
  _formCollectionKey(collection) {
    const appKey = this._getAppKey();
    return `${appKey}.${collection}`;
  }

  // ----- public methods

  // TODO: add checks for existing collection, try/catch, etc - here or in processor

  create(collection, entitiesToSave) {
    return this._enqueueCrudOperation(collection, () => {
      return this._readAll(collection)
        .then((existingEntities) => {
          existingEntities = existingEntities.concat(entitiesToSave);
          return this._saveAll(collection, existingEntities);
        })
        .then(() => entitiesToSave);
    });
  }

  read(collection, query) {
    return this._readAll(collection)
      .then((allEntities) => {
        if (query) {
          return applyQueryToDataset(allEntities, query);
        }
        return allEntities;
      });
  }

  readById(collection, id) {
    return this._readAll(collection)
      .then((allEntities) => {
        const entity = allEntities.find(e => e._id === id);
        if (!entity) {
          const errMsg = `An entity with id ${id} was not found in the collection "${collection}"`;
          return Promise.reject(new NotFoundError(errMsg));
        }
        return entity;
      });
  }

  count(collection, query) {
    return this._readAll(collection)
      .then(allEntities => applyQueryToDataset(allEntities, query).length);
  }

  // TODO: this is upsert. it should be an option
  // also, currently one doesn't know if they created or updated
  update(collection, entities) {
    return this._enqueueCrudOperation(collection, () => {
      const entitiesArray = ensureArray(entities);
      const updateEntitiesById = keyBy(entitiesArray, '_id');
      let unprocessedEntitiesCount = entitiesArray.length;
      return this._readAll(collection)
        .then((allEntities) => {
          allEntities.forEach((entity, index) => {
            if (unprocessedEntitiesCount > 0 && updateEntitiesById[entity._id]) {
              allEntities[index] = updateEntitiesById[entity._id];
              delete updateEntitiesById[entity._id];
              unprocessedEntitiesCount -= 1;
            }
          });

          // the upsert part
          if (unprocessedEntitiesCount > 0) {
            Object.keys(updateEntitiesById).forEach((entityId) => {
              allEntities.push(updateEntitiesById[entityId]);
            });
          }

          return this._saveAll(collection, allEntities)
            .then(() => entities);
        });
    });
  }

  delete(collection, query) {
    return this._enqueueCrudOperation(collection, () => {
      let deletedCount = 0;
      return this._readAll(collection)
        .then((allEntities) => {
          const matchingEntities = applyQueryToDataset(allEntities, query);
          const shouldDeleteById = keyBy(matchingEntities, '_id');
          const remainingEntities = allEntities.filter(e => !shouldDeleteById[e._id]);
          deletedCount = allEntities.length - remainingEntities.length;
          return this._saveAll(collection, remainingEntities);
        })
        .then(() => deletedCount);
    });
  }

  deleteById(collection, id) {
    return this._enqueueCrudOperation(collection, () => {
      return this._readAll(collection)
        .then((allEntities) => {
          const index = allEntities.findIndex(e => e._id === id);
          if (index > -1) {
            allEntities.splice(index, 1);
            return this._saveAll(collection, allEntities)
              .then(() => 1);
          }
          return Promise.resolve(0);
        });
    });
  }

  // TODO: do better once we decide on querying on sync items
  // check the behaviour of clear, especially regarding sync queue
  clear(collection) {
    if (collection) {
      return this._enqueueCrudOperation(collection, () => {
        return this._countAndDelete(collection);
      });
    }

    // TODO: this does not enqueue, so it might cause problems
    // currently it's only called from Kinvey.DataStore.clear()
    return this._clearAllCollections(); // this does not return count. problem?
  }
}
