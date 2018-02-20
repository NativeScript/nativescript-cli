import { Promise } from 'es6-promise';
import clone from 'lodash/clone';

import { Query } from '../../query';

import { SyncOperation } from '../sync';
import { repositoryProvider } from '../repositories';
import { syncCollectionName } from './utils';
import { ensureArray } from '../../utils';
import {
  isNotEmpty,
  isLocalEntity,
  generateEntityId,
  getTagFromCollectionName,
  formTaggedCollectionName,
  stripTagFromCollectionName
} from '../utils';

// imported for typings
// import { OfflineRepository } from '../repositories';

export class SyncStateManager {
  _repoPromise;

  addCreateEvent(collection, entities) {
    const syncItems = this._buildSyncItemsForEntities(collection, entities, SyncOperation.Create);
    return this._createSyncItems(collection, syncItems);
  }

  addUpdateEvent(collection, entities) {
    const syncItems = this._buildSyncItemsForEntities(collection, entities, SyncOperation.Update);
    return this._upsertSyncItems(collection, syncItems);
  }

  addDeleteEvent(collection, entities) {
    const syncItemData = this._groupSyncItemDataForDeleteEvent(collection, entities);

    let delPrm = Promise.resolve();
    if (isNotEmpty(syncItemData.localEntityIds)) {
      const query = this._getEntitiesFilter(collection, syncItemData.localEntityIds);
      delPrm = this._deleteSyncItems(collection, query);
    }

    let upsertPrm = Promise.resolve();
    if (isNotEmpty(syncItemData.syncItemsToUpsert)) {
      upsertPrm = this._upsertSyncItems(collection, syncItemData.syncItemsToUpsert, syncItemData.syncItemsToUpsertIds);
    }

    return Promise.all([delPrm, upsertPrm]);
  }

  getSyncItems(collection, onlyTheseIds) {
    const query = this._getEntitiesFilter(collection, onlyTheseIds);
    return this._getRepository()
      .then(repo => repo.read(this._getSyncCollectionName(collection), query));
  }

  getSyncItemCount(collection, onlyTheseIds) {
    const query = this._getEntitiesFilter(collection, onlyTheseIds);
    return this._getRepository()
      .then(repo => repo.count(this._getSyncCollectionName(collection), query));
  }

  removeSyncItemForEntityId(collection, entityId) {
    // this isn't using collection, because inmemory filtering is very slow
    const query = new Query().equalTo('entityId', entityId);
    return this._deleteSyncItems(collection, query);
  }

  removeSyncItemsForIds(collection, entityIds = []) {
    const query = this._getEntitiesFilter(collection, entityIds);
    return this._deleteSyncItems(collection, query);
  }

  removeAllSyncItems(collection) {
    const query = this._getCollectionFilter(collection);
    return this._deleteSyncItems(collection, query);
  }

  _getRepository() {
    if (!this._repoPromise) {
      this._repoPromise = repositoryProvider.getOfflineRepository();
    }
    return this._repoPromise;
  }

  _deleteSyncItems(collection, query) {
    return this._getRepository()
      .then(repo => repo.delete(this._getSyncCollectionName(collection), query));
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
  _upsertSyncItems(collection, newSyncItems, entityIds) {
    if (!entityIds) {
      entityIds = newSyncItems.map(i => i.entityId);
    }
    const delQuery = new Query().contains('entityId', entityIds);
    return this._getRepository()
      .then(repo => repo.delete(this._getSyncCollectionName(collection), delQuery).then(() => repo))
      .then(repo => repo.create(this._getSyncCollectionName(collection), newSyncItems));
  }

  _getEntitiesFilter(collection, onlyTheseIds) {
    const query = this._getCollectionFilter(collection);
    if (onlyTheseIds) {
      query.and().contains('entityId', ensureArray(onlyTheseIds));
    }
    return query;
  }

  _getCollectionFilter(collection) {
    const result = new Query();
    result.equalTo('collection', collection)
      .or()
      .equalTo('collection', stripTagFromCollectionName(collection));
    return result;
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

  _createSyncItems(collection, syncItems) {
    return this._getRepository()
      .then(repo => repo.create(this._getSyncCollectionName(collection), syncItems));
  }

  _getSyncCollectionName(taggedCollectionName) {
    const tag = getTagFromCollectionName(taggedCollectionName);
    return formTaggedCollectionName(syncCollectionName, tag);
  }
}
