import clone from 'lodash/clone';

import { Query } from '../../query';
import { KinveyError, NotFoundError } from '../../errors';

import { OfflineDataProcessor } from './offline-data-processor';
import { ensureArray } from '../../utils';
import { wrapInObservable } from '../../observable';
import { isLocalEntity, isNotEmpty, isEmpty } from '../utils';

// imported for type info
// import { NetworkRepository } from '../repositories';

// TODO: refactor similar methods. read and readById, for instance
export class CacheOfflineDataProcessor extends OfflineDataProcessor {
  /** @type {NetworkRepository} */
  _networkRepository;

  constructor(syncManager, networkRepository) {
    super(syncManager);
    this._networkRepository = networkRepository;
  }

  // TODO: think of a better way to do this, or at least remove duplication
  _deleteEntityAndHandleOfflineState(collection, entity, options) {
    if (isLocalEntity(entity)) { // no need for request, just a regular offline delete
      return super._deleteEntityAndHandleOfflineState(collection, entity, options);
    }

    let deleteSucceeded;
    return this._attemptDeleteByIdOverNetwork(collection, entity._id, options)
      .then((didDelete) => {
        deleteSucceeded = didDelete;
        if (deleteSucceeded) {
          return this._syncManager.removeSyncItemForEntityId(entity._id)
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
      .then((networkEntity) => { // cause of temp id, this is a create and delete
        return this._upsertNetworkEntityOffline(collection, offlineEntity._id, networkEntity)
          .then(() => networkEntity);
      });
  }

  // TODO: how close is this to pull?
  _processRead(collection, query, options) {
    let offlineEntities;
    return wrapInObservable((observer) => {
      return this._ensureCountBeforeRead(collection, 'fetch the entities')
        .then(() => super._processRead(collection, query, options))
        .then((entities) => {
          offlineEntities = entities || []; // really?
          observer.next(offlineEntities);
          return this._networkRepository.read(collection, query, options);
        })
        .then((networkEntities) => {
          observer.next(networkEntities);
          return this._replaceOfflineEntities(collection, offlineEntities, networkEntities);
        });
    });
  }

  _processReadById(collection, entityId, options) {
    let offlineEntity;
    return wrapInObservable((observer) => {
      return this._ensureCountBeforeRead(collection, 'find the entity')
        .then(() => super._processReadById(collection, entityId, options))
        .catch(err => this._catchNotFoundError(err))
        .then((entity) => {
          observer.next(entity);
          offlineEntity = entity;
          return this._networkRepository.readById(collection, entityId, options);
        })
        .then((entity) => {
          observer.next(entity);
          return this._replaceOfflineEntities(collection, ensureArray(offlineEntity), ensureArray(entity));
        });
    });
  }

  _processUpdate(collection, data, options) {
    return super._processUpdate(collection, data, options)
      .then(() => this._networkRepository.update(collection, data, options))
      .then((networkEntity) => {
        return this._getRepository()
          .then(repo => repo.update(collection, networkEntity, options))
          .then(() => this._syncManager.removeSyncItemForEntityId(networkEntity._id))
          .then(() => networkEntity);
      });
  }

  _processCount(collection, query, options) {
    return wrapInObservable((observer) => {
      return this._ensureCountBeforeRead(collection, 'count entities')
        .then(() => super._processCount(collection, query, options))
        .then((offlineCount) => {
          observer.next(offlineCount);
          return this._networkRepository.count(collection, query, options);
        })
        .then((networkCount) => {
          observer.next(networkCount);
        });
    });
  }

  // private methods

  _upsertNetworkEntityOffline(collection, offlineEntityId, networkEntity) {
    let repository;
    return this._getRepository()
      .then((repo) => {
        repository = repo;
        return repository.create(collection, networkEntity);
      })
      .then(() => {
        if (!offlineEntityId) {
          return Promise.resolve();
        }
        return repository.deleteById(collection, offlineEntityId)
          .then(() => this._syncManager.removeSyncItemForEntityId(offlineEntityId));
      });
  }

  _replaceOfflineEntities(collection, offlineEntities, networkEntities) {
    let promise = Promise.resolve();
    if (isNotEmpty(offlineEntities)) {
      offlineEntities = ensureArray(offlineEntities);
      const query = new Query().contains('_id', offlineEntities.map(e => e._id));
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
        return this._syncManager.removeSyncEntitiesForIds(offlineEntities.map(e => e._id))
          .then(() => deletedCount);
      });
  }

  // TODO: passing the error message as an argument?
  _ensureCountBeforeRead(collection, prefix) {
    return this._syncManager.getSyncItemCount(collection)
      .then((count) => {
        if (count === 0) {
          return count;
        }
        const countMsg = `There are ${count} entities that need to be synced.`;
        const msg = `Unable to ${prefix} on the backend. ${countMsg}`;
        const err = new KinveyError(msg);
        return Promise.reject(err);
      });
  }

  _catchNotFoundError(err) {
    if (err instanceof NotFoundError) {
      return undefined;
    }
    return Promise.reject(err);
  }
}
