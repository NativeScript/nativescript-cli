import clone from 'lodash/clone';

import { KinveyError, NotFoundError, SyncError } from '../../errors';

import { PromiseQueue } from '../../utils';
import { SyncOperation } from './sync-operation';
import { syncBatchSize } from './utils';
import { isEmpty } from '../utils';
import { repositoryProvider } from '../repositories';

// imported for typings
// import { SyncStateManager } from './sync-state-manager';

const pushTrackingByCollection = {};

export class SyncManager {
  _offlineRepoPromise;
  _networkRepo;
  /** @type {SyncStateManager} */
  _syncStateManager;

  constructor(networkRepo, syncStateManager) {
    this._networkRepo = networkRepo;
    this._syncStateManager = syncStateManager;
  }

  push(collection, query) {
    if (isEmpty(collection)) {
      return Promise.reject(new KinveyError('Invalid or missing collection name'));
    }

    if (this._pushIsInProgress(collection)) {
      return Promise.reject(new SyncError('Data is already being pushed to the backend.'
        + ' Please wait for it to complete before pushing new data to the backend.'));
    }

    this._markPushStart(collection);
    let prm = Promise.resolve();

    if (query) {
      prm = this._getEntityIdsForQuery(collection, query);
    }

    return prm
      .then((entityIds) => {
        return this._syncStateManager.getSyncItems(collection, entityIds);
      })
      .then((syncItems = []) => this._processSyncItems(syncItems))
      .then((pushResult) => {
        this._markPushEnd(collection);
        return pushResult;
      })
      .catch((err) => {
        this._markPushEnd();
        return Promise.reject(err);
      });
  }

  pull(collection, query, options) {
    if (isEmpty(collection)) {
      return Promise.reject(new KinveyError('Invalid or missing collection name'));
    }
    return this._fetchItemsFromServer(collection, query, options)
      .then(entities => this.replaceOfflineEntities(collection, query, entities));
  }

  // TODO: this may need to do querying, since now it's a breaking change/fix :D MLIBZ-2177
  getSyncItemCount(collection) {
    if (isEmpty(collection)) {
      return Promise.reject(new KinveyError('Invalid or missing collection name'));
    }

    return this._syncStateManager.getSyncItemCount(collection);
  }

  getSyncEntities(collection, query) {
    // TODO: this only returns nondeleted entities - pending fix for MLIBZ-2177
    return this._getOfflineRepo()
      .then(repo => repo.read(collection, query))
      .then((entities = []) => {
        return this._syncStateManager.getSyncItems(collection, entities.map(e => e._id));
      });
  }

  replaceOfflineEntities(collection, deleteOfflineQuery, networkEntities = []) {
    return this._getOfflineRepo()
      .then((repo) => {
        return repo.delete(collection, deleteOfflineQuery)
          .then(() => repo);
      })
      .then(offlineRepo => offlineRepo.create(collection, networkEntities));
  }

  // TODO: pending fix for MLIBZ-2177
  clearSync(collection, query) {
    if (query) {
      return this._getEntityIdsForQuery(collection, query)
        .then(entityIds => this._syncStateManager.removeSyncEntitiesForIds(entityIds));
    }
    return this._syncStateManager.removeAllSyncItems(collection);
  }

  // for syncstatemanager
  addCreateEvent(collection, createdItems) {
    return this._syncStateManager.addCreateEvent(collection, createdItems);
  }

  addDeleteEvent(collection, entities) {
    return this._syncStateManager.addDeleteEvent(collection, entities);
  }

  addDeleteByIdEvent(collection, deletedEntity) {
    return this._syncStateManager.addDeleteByIdEvent(collection, deletedEntity);
  }

  addUpdateEvent(collection, updatedItems) {
    return this._syncStateManager.addUpdateEvent(collection, updatedItems);
  }

  removeSyncItemForEntityId(entityId) {
    return this._syncStateManager.removeSyncItemForEntityId(entityId);
  }

  removeSyncEntitiesForIds(entityIds) {
    return this._syncStateManager.removeSyncEntitiesForIds(entityIds);
  }

  // TODO: refactor - dont mutate this
  _getPushOpResult(entityId, operation) {
    const result = {
      _id: entityId,
      operation: operation
    };

    if (operation !== SyncOperation.Delete) {
      result.entity = null;
    }

    return result;
  }

  _sanitizeOfflineEntity(offlineEntity) {
    const copy = clone(offlineEntity);
    delete copy._id;
    return copy;
  }

  _pushCreate(collection, entity) {
    let entityToCreate = entity;
    if (entity._kmd && entity._kmd.local) {
      entityToCreate = this._sanitizeOfflineEntity(entity);
    }
    const result = this._getPushOpResult(entity._id, SyncOperation.Create);
    return this._networkRepo.create(collection, entityToCreate)
      .then((createdItem) => {
        result.entity = createdItem;
        return result;
      })
      .catch((err) => {
        result.error = err;
        return result;
      });
  }

  _pushDelete(collection, entityId) {
    const result = this._getPushOpResult(entityId, SyncOperation.Delete);
    return this._networkRepo.deleteById(collection, entityId)
      .then(() => result)
      .catch((err) => {
        result.error = err;
        return result;
      });
  }

  _pushUpdate(collection, entity) {
    const result = this._getPushOpResult(entity._id, SyncOperation.Update);
    return this._networkRepo.update(collection, entity)
      .then((updateResult) => {
        result.entity = updateResult;
        return result;
      })
      .catch((err) => {
        result.entity = entity;
        result.error = err;
        return result;
      });
  }

  // TODO: refactor results of individual push ops can be done here?
  _pushItem({ collection, entityId, state }) {
    let entity;
    const syncOp = state.operation;

    return this._getOfflineRepo()
      .then(repo => repo.readById(collection, entityId))
      .catch((err) => {
        if (!(err instanceof NotFoundError)) {
          return Promise.reject(err);
        }
        return null;
      })
      .then((offlineEntity) => {
        entity = offlineEntity;

        if (!entity && syncOp !== SyncOperation.Delete) { // todo: duplication
          const res = this._getPushOpResult(entityId, syncOp);
          res.error = new KinveyError(`Entity with id ${entityId} not found`);
          return res;
        }

        switch (syncOp) {
          case SyncOperation.Create:
            return this._pushCreate(collection, entity);
          case SyncOperation.Delete:
            return this._pushDelete(collection, entityId);
          case SyncOperation.Update:
            return this._pushUpdate(collection, entity);
          default: {
            const res = this._getPushOpResult(entityId, syncOp);
            res.error = new KinveyError(`Unexpected sync operation: ${syncOp}`);
            return res;
          }
        }
      });
  }

  _processSyncItem(syncItem) {
    let pushResult;
    return this._pushItem(syncItem) // should never reject
      .then((result) => {
        pushResult = result;
        if (pushResult.error) {
          return pushResult;
        }
        return this._syncStateManager.removeSyncItemForEntityId(syncItem.entityId);
      })
      .then(() => pushResult);
  }

  // TODO: error handling needs consideration
  _processSyncItems(syncItems) {
    if (isEmpty(syncItems)) {
      return Promise.resolve();
    }

    const queue = new PromiseQueue(syncBatchSize);
    const pushResults = [];

    return new Promise((resolve) => { // TODO: too nested, refactor?
      syncItems.forEach((syncItem, index) => {
        queue.enqueue(() => {
          return this._processSyncItem(syncItem)
            .then((pushResult) => {
              pushResults.push(pushResult);
              const lastPushCompleted = syncItems.length === index + 1;
              if (lastPushCompleted) {
                resolve(pushResults);
              }
            });
        });
      });
    });
  }

  _fetchItemsFromServer(collection, query, options) {
    // TODO: deltaset logic goes here
    return this._networkRepo.read(collection, query, options);
  }

  _getOfflineRepo() {
    if (!this._offlineRepoPromise) {
      const repo = repositoryProvider.getOfflineRepository();
      this._offlineRepoPromise = Promise.resolve(repo);
    }
    return this._offlineRepoPromise;
  }

  _pushIsInProgress(collection) {
    return !!pushTrackingByCollection[collection];
  }

  _markPushStart(collection) {
    if (!this._pushIsInProgress(collection)) {
      pushTrackingByCollection[collection] = true;
    } else {
      // TODO: remove
      throw new Error('Temporary - remove');
    }
  }

  _markPushEnd(collection) {
    if (this._pushIsInProgress(collection)) {
      delete pushTrackingByCollection[collection];
    } else {
      // TODO: remove
      throw new Error('Temporary - remove');
    }
  }

  _getEntityIdsForQuery(collection, query) {
    return this._getOfflineRepo()
      .then(repo => repo.read(collection, query))
      .then(entities => entities.map(e => e._id));
  }
}
