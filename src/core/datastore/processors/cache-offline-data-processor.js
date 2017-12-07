import { Query } from '../../query';
import { KinveyError, NotFoundError } from '../../errors';

import { OfflineDataProcessor } from './offline-data-processor';
import { ensureArray } from '../../utils';
import { wrapInObservable } from '../../observable';
import { isLocalEntity, isNotEmpty } from '../utils';

// imported for type info
// import { NetworkRepository } from '../repositories';
// import { SyncStateManager } from '../sync';

// TODO: refactor similar methods. read and readById, for instance
export class CacheOfflineDataProcessor extends OfflineDataProcessor {
  /** @type {NetworkRepository} */
  _networkRepository;

  constructor(syncManager, networkRepository) {
    super(syncManager);
    this._networkRepository = networkRepository;
  }

  // TODO: think of a better way to do this, or at least remove duplication
  // override protected method for deletebyid
  _deleteEntityAndHandleOfflineState(collection, entity, options) {
    return super._deleteEntityAndHandleOfflineState(collection, entity, options)
      .then((deletedOfflineCount) => {
        if (isLocalEntity(entity)) {
          return deletedOfflineCount;
        }
        return this._deleteEntityOverNetwork(collection, entity, options)
          .then(() => deletedOfflineCount);
      });
  }

  _deleteEntitiesAndHandleOfflineState(collection, entities, deleteQuery, options) {
    return super._deleteEntitiesAndHandleOfflineState(collection, entities, deleteQuery, options)
      .then((deletedOfflineCount) => {
        const networkEntities = entities.filter(e => !isLocalEntity(e));
        if (networkEntities.length) {
          return this._deleteEntitiesOverNetwork(collection, networkEntities, options)
            .then(() => deletedOfflineCount);
        }
        return deletedOfflineCount;
      });
  }

  _processCreate(collection, data, options) {
    let offlineEntity;

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
    let offlineEntity;
    return super._processUpdate(collection, data, options)
      .then((result) => {
        offlineEntity = result;
        return this._networkRepository.update(collection, data, options);
      })
      .then((networkEntity) => {
        const offlineEntityId = offlineEntity && offlineEntity._id;
        // TODO: When offline update becomes an upsert, this can be an update
        return this._upsertNetworkEntityOffline(collection, offlineEntityId, networkEntity)
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
          observer.next(networkCount.count);
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

  _deleteEntityOverNetwork(collection, entity, options) {
    return this._networkRepository.deleteById(collection, entity._id, options)
      .then(res => res.count)
      .catch((err) => {
        if (err instanceof NotFoundError) {
          // TODO: is this the behaviour we want?
          return Promise.resolve(1);
        }
        return Promise.reject(err);
      })
      .then(() => this._syncManager.removeSyncItemForEntityId(entity._id));
  }

  _deleteEntitiesOverNetwork(collection, entities, options) {
    const entityIds = entities.map(e => e._id);
    const query = new Query().contains('_id', entityIds);
    return this._networkRepository.delete(collection, query, options)
      .then(() => this._syncManager.removeSyncEntitiesForIds(entityIds));
  }

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
