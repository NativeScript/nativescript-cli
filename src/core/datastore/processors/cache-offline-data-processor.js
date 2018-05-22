import { Promise } from 'es6-promise';
import clone from 'lodash/clone';

import { Query } from '../../query';
import { NotFoundError, InvalidCachedQuery } from '../../errors';

import { OfflineDataProcessor } from './offline-data-processor';
import { ensureArray } from '../../utils';
import { wrapInObservable } from '../../observable';
import { isLocalEntity, isNotEmpty, isEmpty, getEntitiesPendingPushError } from '../utils';
import { deltaSet } from '../deltaset';
import { getCachedQuery, updateCachedQuery, deleteCachedQuery } from '../querycache';

// imported for type info
// import { NetworkRepository } from '../repositories';

export class CacheOfflineDataProcessor extends OfflineDataProcessor {
  /** @type {NetworkRepository} */
  _networkRepository;

  constructor(syncManager, networkRepository) {
    super(syncManager);
    this._networkRepository = networkRepository;
  }

  _deleteEntityAndHandleOfflineState(collection, entity, options) {
    if (isLocalEntity(entity)) { // no need for request, just a regular offline delete
      return super._deleteEntityAndHandleOfflineState(collection, entity, options);
    }

    let deleteSucceeded;
    return this._attemptDeleteByIdOverNetwork(collection, entity._id, options)
      .then((didDelete) => {
        deleteSucceeded = didDelete;
        if (deleteSucceeded) {
          return this._syncManager.removeSyncItemForEntityId(collection, entity._id)
            .then(() => this._getRepository())
            .then(repo => repo.deleteById(collection, entity._id, options));
        }
        return this._syncManager.addDeleteEvent(collection, entity)
          .then(() => 0);
      });
  }

  _processDelete(collection, query, options) {
    let deleteSucceeded;
    return this._attemptDeleteOverNetwork(collection, query, options)
      .then((didDelete) => {
        deleteSucceeded = didDelete;
        return this._getRepository();
      })
      .then(repo => repo.read(collection, query, options))
      .then((offlineEntities) => {
        if (isEmpty(offlineEntities)) {
          return 0;
        }
        if (deleteSucceeded) {
          return this._deleteEntitiesOffline(collection, query, offlineEntities, options);
        }
        return this._syncManager.addDeleteEvent(collection, offlineEntities)
          .then(() => 0);
      });
  }

  _processCreate(collection, data, options) {
    let offlineEntity;
    data = clone(data);

    return super._processCreate(collection, data, options)
      .then((createdEntity) => {
        offlineEntity = createdEntity;
        return this._networkRepository.create(collection, data, options);
      })
      .then((networkEntity) => { // cause of temp id, this is a delete and create
        return this._replaceNetworkEntityOffline(collection, offlineEntity._id, networkEntity)
          .then(() => this._syncManager.removeSyncItemForEntityId(collection, offlineEntity._id))
          .then(() => networkEntity);
      });
  }

  _processRead(collection, query, options = {}) {
    let offlineEntities;
    let { useDeltaSet } = options;

    return wrapInObservable((observer) => {
      return super._processRead(collection, query, options)
        .then((entities) => {
          offlineEntities = entities;
          observer.next(offlineEntities);
          return this._ensureCountBeforeRead(collection, 'fetch the entities', query);
        })
        .then(() => {
          if (useDeltaSet) {
            return deltaSet(collection, query, options)
              .catch((error) => {
                if (error instanceof InvalidCachedQuery) {
                  useDeltaSet = false;
                  return getCachedQuery(collection, query)
                    .then((cachedQuery) => deleteCachedQuery(cachedQuery))
                    .catch((error) => {
                      if (error instanceof NotFoundError) {
                        return null;
                      }

                      throw error;
                    })
                    .then(() => this._networkRepository.read(collection, query, Object.assign(options, { dataOnly: false })));
                }

                throw error;
              });
          }

          return this._networkRepository.read(collection, query, Object.assign(options, { dataOnly: false }));
        })
        .then((response) => {
          return getCachedQuery(collection, query)
            .then((cachedQuery) => {
              if (cachedQuery && response.headers) {
                cachedQuery.lastRequest = response.headers.requestStart;
                return updateCachedQuery(cachedQuery);
              }

              return null;
            })
            .then(() => response.data ? response.data : response);
        })
        .then((data) => {
          if (useDeltaSet) {
            const promises = [];

            if (data.deleted.length > 0) {
              const deleteQuery = new Query();
              deleteQuery.contains('_id', data.deleted.map((entity) => entity._id));
              promises.push(this._deleteEntitiesOffline(collection, deleteQuery, data.deleted));
            }

            if (data.changed.length > 0) {
              promises.push(this._replaceOfflineEntities(collection, data.changed, data.changed));
            }

            return Promise.all(promises);
          }

          return this._replaceOfflineEntities(collection, offlineEntities, data);
        })
        .then(() => super._processRead(collection, query, options))
        .then((entities) => {
          observer.next(entities);
          return entities;
        });
    });
  }

  _processReadById(collection, entityId, options) {
    let offlineEntity;
    return wrapInObservable((observer) => {
      const query = new Query().equalTo('_id', entityId);
      return super._processReadById(collection, entityId, options)
        .catch(err => this._catchNotFoundError(err)) // backwards compatibility
        .then((entity) => {
          observer.next(entity);
          offlineEntity = entity;
          return this._ensureCountBeforeRead(collection, 'find the entity', query);
        })
        .then(() => this._networkRepository.readById(collection, entityId, options))
        .then((entity) => {
          observer.next(entity);
          return this._replaceOfflineEntities(collection, offlineEntity, ensureArray(entity));
        });
    });
  }

  _processUpdate(collection, data, options) {
    return super._processUpdate(collection, data, options)
      .then(() => this._networkRepository.update(collection, data, options))
      .then((networkEntity) => {
        return this._getRepository()
          .then(repo => repo.update(collection, networkEntity, options))
          .then(() => this._syncManager.removeSyncItemForEntityId(collection, networkEntity._id))
          .then(() => networkEntity);
      });
  }

  _processCount(collection, query, options) {
    return wrapInObservable((observer) => {
      return super._processCount(collection, query, options)
        .then((offlineCount) => {
          observer.next(offlineCount);
          return this._networkRepository.count(collection, query, options);
        })
        .then(networkCount => observer.next(networkCount));
    });
  }

  _processGroup(collection, aggregationQuery, options) {
    return wrapInObservable((observer) => {
      return super._processGroup(collection, aggregationQuery, options)
        .catch(() => []) // backwards compatibility
        .then((offlineResult) => {
          observer.next(offlineResult);
          return this._networkRepository.group(collection, aggregationQuery, options);
        })
        .then(networkResult => observer.next(networkResult));
    });
  }

  // private methods

  // much of our filtering is done inmemory, so this is worth doing, instead of using _replaceOfflineEntities()
  _replaceNetworkEntityOffline(collection, offlineEntityId, networkEntity) {
    return this._getRepository()
      .then((repo) => {
        let deletePromise = Promise.resolve();
        if (offlineEntityId) {
          deletePromise = repo.deleteById(collection, offlineEntityId);
        }
        return deletePromise
          .then(() => repo.create(collection, networkEntity));
      });
  }

  _replaceOfflineEntities(collection, offlineEntities, networkEntities) {
    let promise = Promise.resolve();
    const offlineEntitiesArray = ensureArray(offlineEntities);

    if (offlineEntities && isNotEmpty(offlineEntitiesArray)) {
      const query = new Query().contains('_id', offlineEntitiesArray.map(e => e._id));
      promise = this._getRepository() // this is cheap, so doing it twice
        .then(repo => repo.delete(collection, query));
    }

    return promise
      .then(() => this._getRepository())
      .then(repo => repo.create(collection, networkEntities));
  }

  _attemptDeleteByIdOverNetwork(collection, entityId, options) {
    return new Promise((resolve) => {
      return this._networkRepository.deleteById(collection, entityId, options)
        .then(() => resolve(true))
        .catch((err) => {
          if (err instanceof NotFoundError) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
    });
  }

  _attemptDeleteOverNetwork(collection, query, options) {
    return new Promise((resolve) => {
      this._networkRepository.delete(collection, query, options)
        .then(() => resolve(true))
        .catch(() => resolve(false)); // ignore the error - this is the current behaviour
    });
  }

  _deleteEntitiesOffline(collection, deleteQuery, offlineEntities, options) {
    return this._getRepository()
      .then(repo => repo.delete(collection, deleteQuery, options))
      .then((deletedCount) => {
        return this._syncManager.removeSyncItemsForIds(collection, offlineEntities.map(e => e._id))
          .then(() => deletedCount);
      });
  }

  _ensureCountBeforeRead(collection, prefix, query) {
    return this._syncManager.getSyncItemCountByEntityQuery(collection, query)
      .then((count) => {
        if (count === 0) {
          return count;
        }
        return Promise.reject(getEntitiesPendingPushError(count, prefix));
      });
  }

  _catchNotFoundError(err) {
    if (err instanceof NotFoundError) {
      return undefined;
    }
    return Promise.reject(err);
  }
}
