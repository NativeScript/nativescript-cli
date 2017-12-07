import { ensureArray, isDefined } from '../../utils';

import { OperationType } from '../operations';
import { repositoryProvider } from '../repositories';
import { DataProcessor } from './data-processor';
import { generateEntityId } from '../utils';

// imported for typings
// import { SyncManager } from '../sync';

export class OfflineDataProcessor extends DataProcessor {
  /** @type {SyncManager} */
  _syncManager;

  constructor(syncManager) {
    super();
    this._syncManager = syncManager;
  }

  process(operation, options) {
    if (operation.type === OperationType.Clear) {
      return this._processClear(operation.collection, operation.query, options);
    }
    return super.process(operation, options);
  }

  // protected methods

  _getRepository() {
    if (!this._repoPromise) {
      const repo = repositoryProvider.getOfflineRepository();
      this._repoPromise = Promise.resolve(repo);
    }
    return this._repoPromise;
  }

  _deleteEntityAndHandleOfflineState(collection, entity, options) {
    return super._processDeleteById(collection, entity._id, options)
      .then((deletedCount) => {
        if (!deletedCount) {
          return deletedCount;
        }
        return this._syncManager.addDeleteByIdEvent(collection, entity)
          .then(() => deletedCount);
      });
  }

  _deleteEntitiesAndHandleOfflineState(collection, entities, deleteQuery, options) {
    return super._processDelete(collection, deleteQuery, options)
      .then((delCount) => {
        return this._syncManager.addDeleteEvent(collection, entities)
          .then(() => delCount);
      });
  }

  _processUpdate(collection, data, options) {
    return super._processUpdate(collection, data, options)
      .then((updatedItems) => {
        return this._syncManager.addUpdateEvent(collection, updatedItems)
          .then(() => updatedItems);
      });
  }

  _processClear(collection, query, options) {
    return this._syncManager.clearSync(collection, query)
      .then(() => this._getRepository())
      .then(repo => repo.clear(collection, query, options));
  }

  _processDelete(collection, query, options) {
    return this._getRepository()
      .then(repo => repo.read(collection, query, options))
      .then((entities) => {
        return this._deleteEntitiesAndHandleOfflineState(collection, entities, query, options);
      });
  }

  _processCreate(collection, data, options) {
    this._addMetadataToEntities(data);
    return super._processCreate(collection, data, options)
      .then((createdItems) => {
        return this._syncManager.addCreateEvent(collection, createdItems)
          .then(() => createdItems);
      });
  }

  _processDeleteById(collection, entityId, options) {
    return this._getRepository()
      .then(repo => repo.readById(collection, entityId))
      .then((entity) => {
        // TODO: if !entity
        return this._deleteEntityAndHandleOfflineState(collection, entity, options);
      });
  }

  // private methods

  _addOfflineMetadataToEntity(entity) {
    const kmd = entity._kmd || {};
    kmd.local = true;
    entity._kmd = kmd;
    entity._id = generateEntityId();
  }

  _addMetadataToEntities(data) {
    ensureArray(data).forEach((entity) => {
      if (!isDefined(entity._id)) {
        this._addOfflineMetadataToEntity(entity);
      }
    });
  }
}
