import { Promise } from 'es6-promise';
import clone from 'lodash/clone';

import { Query } from '../../query';

import { SyncOperation } from '../sync';
import { repositoryProvider } from '../repositories';
import { syncCollectionName } from './utils';
import { ensureArray } from '../../utils';
import { isNotEmpty, isLocalEntity, generateEntityId } from '../utils';

// imported for typings
// import { OfflineRepository } from '../repositories';

export class SyncStateManager {
  _repoPromise;

  addCreateEvent(collection, entities) {
    const syncItems = this._buildSyncItemsForEntities(collection, entities, SyncOperation.Create);
    return this._getRepository()
      .then(repo => repo.create(syncCollectionName, syncItems));
  }

  addUpdateEvent(collection, entities) {
    const syncItems = this._buildSyncItemsForEntities(collection, entities, SyncOperation.Update);
    return this._upsertSyncItems(syncItems);
  }

  addDeleteEvent(collection, entities) {
    const syncItemData = this._groupSyncItemDataForDeleteEvent(collection, entities);

    let delPrm = Promise.resolve();
    if (isNotEmpty(syncItemData.localEntityIds)) {
      const query = this._getCollectionFilter(collection, syncItemData.localEntityIds);
      delPrm = this._removeSyncItems(query);
    }

    let upsertPrm = Promise.resolve();
    if (isNotEmpty(syncItemData.syncItemsToUpsert)) {
      upsertPrm = this._upsertSyncItems(syncItemData.syncItemsToUpsert, syncItemData.syncItemsToUpsertIds);
    }

    return Promise.all([delPrm, upsertPrm]);
  }

  getSyncItems(collection, onlyTheseIds) {
    const query = this._getCollectionFilter(collection, onlyTheseIds);
    return this._getRepository()
      .then(repo => repo.read(syncCollectionName, query));
  }

  getSyncItemCount(collection, onlyTheseIds) {
    const query = this._getCollectionFilter(collection, onlyTheseIds);
    return this._getRepository()
      .then(repo => repo.count(syncCollectionName, query));
  }

  removeSyncItemForEntityId(entityId) {
    const query = new Query().equalTo('entityId', entityId);
    return this._removeSyncItems(query);
  }

  removeSyncItemsForIds(entityIds) {
    const query = new Query().contains('entityId', entityIds);
    return this._removeSyncItems(query);
  }

  removeAllSyncItems(collection) {
    if (collection) {
      const query = new Query()
        .equalTo('collection', collection);
      return this._removeSyncItems(query);
    }
    return this._getRepository()
      .then(repo => repo.clear(syncCollectionName));
  }

  _getRepository() {
    if (!this._repoPromise) {
      this._repoPromise = repositoryProvider.getOfflineRepository();
    }
    return this._repoPromise;
  }

  _removeSyncItems(query) {
    return this._getRepository()
      .then(repo => repo.delete(syncCollectionName, query));
  }

  _getSyncItemsByEntityIds(entityIds) {
    const query = new Query().contains('entityId', entityIds);
    return this._getRepository()
      .then(repo => repo.read(syncCollectionName, query));
  }

  _getUpdatedSyncItem(newSyncItem, originalSyncItem) {
    const copy = clone(newSyncItem);
    copy._id = originalSyncItem._id;
    return copy;
  }

  // entityIds are the ids of entities new sync items pertain to - optional optimization :))
  _upsertSyncItems(newSyncItems, entityIds) {
    if (!entityIds) {
      entityIds = newSyncItems.map(i => i.entityId);
    }
    const delQuery = new Query().contains('entityId', entityIds);
    return this._getRepository()
      .then(repo => repo.delete(syncCollectionName, delQuery).then(() => repo))
      .then(repo => repo.create(syncCollectionName, newSyncItems));
  }

  _getCollectionFilter(collection, onlyTheseIds) {
    const query = new Query().equalTo('collection', collection);
    if (onlyTheseIds) {
      query.contains('entityId', ensureArray(onlyTheseIds));
    }
    return query;
  }

  _buildSyncItem(collection, syncOp, entityId) {
    return {
      _id: generateEntityId(),
      collection,
      entityId,
      state: {
        operation: syncOp
      }
    };
  }

  _buildSyncItemsForEntities(collection, entities, syncOp) {
    return ensureArray(entities)
      .map(e => this._buildSyncItem(collection, syncOp, e._id));
  }

  _groupSyncItemDataForDeleteEvent(collection, entities) {
    const localEntityIds = [];
    const syncItemsToUpsert = [];
    const syncItemsToUpsertIds = [];

    ensureArray(entities).forEach((entity) => {
      if (isLocalEntity(entity)) {
        localEntityIds.push(entity._id);
      } else {
        const item = this._buildSyncItem(collection, SyncOperation.Delete, entity._id);
        syncItemsToUpsert.push(item);
        syncItemsToUpsertIds.push(entity._id);
      }
    });

    return {
      localEntityIds,
      syncItemsToUpsert,
      syncItemsToUpsertIds
    };
  }
}
