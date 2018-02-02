import { Promise } from 'es6-promise';
import clone from 'lodash/clone';

import { Log } from '../../log';
import { KinveyError, NotFoundError, SyncError } from '../../errors';

import { PromiseQueue, ensureArray, forEachAsync } from '../../utils';
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
      .then((entityIds) => this._syncStateManager.getSyncItems(collection, entityIds))
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

  getSyncItemCount(collection) {
    if (isEmpty(collection)) {
      return Promise.reject(new KinveyError('Invalid or missing collection name'));
    }

    return this._syncStateManager.getSyncItemCount(collection);
  }

  // TODO: this method is temporray, pending fix for MLIBZ-2177
  getSyncItemCountByEntityQuery(collection, query) {
    return this._getOfflineRepo()
      .then(repo => repo.read(collection, query))
      .then((entities) => {
        const entityIds = entities.map(e => e._id);
        return this._syncStateManager.getSyncItemCount(collection, entityIds);
      });
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
        .then(entityIds => this._syncStateManager.removeSyncItemsForIds(entityIds));
    }
    return this._syncStateManager.removeAllSyncItems(collection);
  }

  // for syncstatemanager
  addCreateEvent(collection, createdItems) {
    return this._addEvent(collection, createdItems, SyncOperation.Create);
  }

  addDeleteEvent(collection, deletedEntities) {
    return this._addEvent(collection, deletedEntities, SyncOperation.Delete);
  }

  addUpdateEvent(collection, updatedEntities) {
    return this._addEvent(collection, updatedEntities, SyncOperation.Update);
  }

  removeSyncItemForEntityId(entityId) {
    return this._syncStateManager.removeSyncItemForEntityId(entityId);
  }

  removeSyncItemsForIds(entityIds) {
    return this._syncStateManager.removeSyncItemsForIds(entityIds);
  }

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

  _replaceOfflineEntityWithNetwork(collection, offlineEntityId, networkEntity) {
    let offlineRepo;
    return this._getOfflineRepo()
      .then((repo) => {
        offlineRepo = repo;
        return offlineRepo.deleteById(collection, offlineEntityId);
      })
      .then(() => offlineRepo.create(collection, networkEntity));
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
        return this._replaceOfflineEntityWithNetwork(collection, entity._id, createdItem);
      })
      .then(() => result)
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
        return this._getOfflineRepo();
      })
      .then(repo => repo.update(collection, result.entity))
      .then(() => result)
      .catch((err) => {
        result.entity = entity;
        result.error = err;
        return result;
      });
  }

  _handlePushOp(syncItem, offlineEntity) {
    const { collection, state, entityId } = syncItem;
    const syncOp = state.operation;

    switch (syncOp) {
      case SyncOperation.Create:
        return this._pushCreate(collection, offlineEntity);
      case SyncOperation.Delete:
        return this._pushDelete(collection, entityId);
      case SyncOperation.Update:
        return this._pushUpdate(collection, offlineEntity);
      default: {
        const res = this._getPushOpResult(entityId, syncOp);
        res.error = new SyncError(`Unexpected sync operation: ${syncOp}`);
        return res;
      }
    }
  }

  _pushItem(syncItem) {
    const { collection, entityId, state } = syncItem;
    return this._getOfflineRepo()
      .then(repo => repo.readById(collection, entityId))
      .catch((err) => {
        if (!(err instanceof NotFoundError)) {
          return Promise.reject(err);
        }
        if (state.operation !== SyncOperation.Delete) {
          return this._syncStateManager.removeSyncItemForEntityId(entityId)
            .then(() => Promise.reject(err));
        }
        return null; // we have to make a delete request to the backend
      })
      .then(offlineEntity => this._handlePushOp(syncItem, offlineEntity));
  }

  _processSyncItem(syncItem) {
    return this._pushItem(syncItem)
      .then((result) => {
        if (result.error) {
          return result;
        }
        return this._syncStateManager.removeSyncItemForEntityId(syncItem.entityId)
          .then(() => result);
      })
      .catch((err) => {
        const pushResult = this._getPushOpResult(syncItem.entityId, syncItem.state.operation);
        pushResult.error = err;
        return pushResult;
      });
  }

  _processSyncItems(syncItems) {
    const queue = new PromiseQueue(syncBatchSize);
    const pushResults = [];

    return forEachAsync(syncItems, (syncItem) => {
      return queue.enqueue(() => {
        return this._processSyncItem(syncItem) // never rejects
          .then(pushResult => pushResults.push(pushResult));
      });
    })
      .then(() => pushResults);
  }

  _fetchItemsFromServer(collection, query, options) {
    // TODO: deltaset logic goes here
    return this._networkRepo.read(collection, query, options);
  }

  _getOfflineRepo() {
    if (!this._offlineRepoPromise) {
      this._offlineRepoPromise = repositoryProvider.getOfflineRepository();
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
      Log.debug('Marking push start, when push already started');
    }
  }

  _markPushEnd(collection) {
    if (this._pushIsInProgress(collection)) {
      delete pushTrackingByCollection[collection];
    } else {
      Log.debug('Marking push en, when push is NOT started');
    }
  }

  _getEntityIdsForQuery(collection, query) {
    return this._getOfflineRepo()
      .then(repo => repo.read(collection, query))
      .then(entities => entities.map(e => e._id));
  }

  _addEvent(collection, entities, syncOp) {
    const validationError = this._validateCrudEventEntities(ensureArray(entities));

    if (validationError) {
      return validationError;
    }

    return this._setState(collection, entities, syncOp)
      .then(() => entities);
  }

  _validateCrudEventEntities(entities) {
    if (!entities || isEmpty(entities)) {
      return Promise.reject(new SyncError('Invalid or missing entity/entities array.'));
    }

    const entityWithNoId = ensureArray(entities).find(e => !e._id);
    if (entityWithNoId) {
      const errMsg = 'An entity is missing an _id. All entities must have an _id in order to be added to the sync table.';
      return Promise.reject(new SyncError(errMsg, entityWithNoId));
    }
    return null;
  }

  _setState(collection, entities, syncOp) {
    switch (syncOp) {
      case SyncOperation.Create:
        return this._syncStateManager.addCreateEvent(collection, entities);
      case SyncOperation.Update:
        return this._syncStateManager.addUpdateEvent(collection, entities);
      case SyncOperation.Delete:
        return this._syncStateManager.addDeleteEvent(collection, entities);
      default:
        return Promise.reject(new SyncError('Invalid sync event name'));
    }
  }
}
