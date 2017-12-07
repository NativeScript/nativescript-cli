import keyBy from 'lodash/keyBy';
import { NotFoundError } from '../../../errors';

import { OfflineRepository } from '../offline-repository';
import {
  applyQueryToDataset,
  collectionsMaster as masterCollectionName
} from '../utils';
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

  // TODO: integrate with db/collection concept in parent(s)?
  _formCollectionKey(collection) {
    const appKey = this._getAppKey();
    return `${appKey}${collection}`;
  }

  _readAll(collection) {
    const key = this._formCollectionKey(collection);
    return this._persister.readEntities(key)
      .then(entities => entities || []);
  }

  // TODO: Keep them by id
  _saveAll(collection, entities) {
    const key = this._formCollectionKey(collection);
    return this._persister.persistEntities(key, entities);
  }

  _deleteAll(collection) {
    const key = this._formCollectionKey(collection);
    return this._persister.deleteEntities(key);
  }

  _enqueueCrudOperation(collection, operation) {
    const key = this._formCollectionKey(collection);
    return this._queue.enqueue(key, operation);
  }

  _getAllCollections() {
    return this._readAll(masterCollectionName);
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
      })
      .then(() => this._deleteAll(masterCollectionName));
  }

  // ----- protected methods
  _ensureCollectionExists(collection) {
    return this._readAll(masterCollectionName)
      .then((collectionsForAppKey) => {
        const exists = collectionsForAppKey.indexOf(collection) > -1;
        if (!exists) {
          collectionsForAppKey.push(collection);
          return this._saveAll(masterCollectionName, collectionsForAppKey);
        }
        return Promise.resolve();
      });
  }

  // ----- public methods

  // TODO: add checks for existing collection, try/catch, etc - here or in processor

  create(collection, entitiesToSave) {
    return this._enqueueCrudOperation(collection, () => {
      return this._ensureCollectionExists(collection)
        .then(() => this._readAll(collection))
        .then((existingEntities) => {
          existingEntities = existingEntities.concat(entitiesToSave);
          return this._saveAll(collection, existingEntities);
        })
        .then(() => entitiesToSave);
    });
  }

  read(collection, query) {
    return this._enqueueCrudOperation(collection, () => {
      return this._readAll(collection)
        .then((allEntities) => {
          if (query) {
            return applyQueryToDataset(allEntities, query);
          }
          return allEntities;
        });
    });
  }

  readById(collection, id) {
    return this._enqueueCrudOperation(collection, () => {
      return this._readAll(collection)
        .then((allEntities) => {
          const entity = allEntities.find(e => e._id === id);
          if (!entity) {
            return Promise.reject(new NotFoundError('Not found'));
          }
          return entity;
        });
    });
  }

  count(collection, query) {
    return this._enqueueCrudOperation(collection, () => {
      return this._readAll(collection)
        .then(allEntities => applyQueryToDataset(allEntities, query).length);
    });
  }

  update(collection, entities) {
    return this._enqueueCrudOperation(collection, () => {
      const updateEntitiesById = keyBy(ensureArray(entities), '_id');
      return this._readAll(collection)
        .then((allEntities) => {
          allEntities.forEach((entity, index) => {
            if (updateEntitiesById[entity._id]) {
              allEntities[index] = updateEntitiesById[entity._id];
              delete updateEntitiesById[entity._id];
            }
          });

          // the upsert part
          Object.keys(updateEntitiesById).forEach((entityId) => {
            allEntities.push(updateEntitiesById[entityId]);
          });

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
  clear(collection, query) {
    if (collection && query) {
      return this.delete(collection, query);
    }

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
