import clone from 'lodash/clone';

import { Query } from '../../query';

import { SyncOperation } from '../sync';
import { repositoryProvider } from '../repositories';
import { syncCollectionName, buildSyncItem } from './utils';
import { ensureArray } from '../../utils';
import { isNotEmpty, isLocalEntity } from '../utils';

// imported for typings
// import { OfflineRepository } from '../repositories';

// TODO: there's probably room for performance improvements :)
export class SyncStateManager {
  _repoPromise;

  _getRepository() {
    if (!this._repoPromise) {
      const repo = repositoryProvider.getOfflineRepository();
      this._repoPromise = Promise.resolve(repo);
    }
    return this._repoPromise;
  }

  _removeSyncItems(query) {
    return this._getRepository()
      .then(repo => repo.delete(syncCollectionName, query));
  }

  _getSyncItemByentityId(entityId) {
    const query = new Query().equalTo('entityId', entityId);
    return this._getRepository()
      .then(repo => repo.read(syncCollectionName, query))
      .then(items => items[0]); // assuming one per entity
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

  // TODO: should we keep something else from original sync item, other than the _id?
  // should we just delete and recreate the item - what types of data loss can occur?
  _upsertSyncItem(newSyncItem) {
    // TODO: repo.update() is now an upsert - can we use it?
    return this._getSyncItemByentityId(newSyncItem.entityId)
      .then((originalSyncItem) => {
        const repoPromise = this._getRepository();
        if (originalSyncItem) {
          const item = this._getUpdatedSyncItem(newSyncItem, originalSyncItem);
          return repoPromise.then(repo => repo.update(syncCollectionName, item));
        }
        return repoPromise.then(repo => repo.create(syncCollectionName, newSyncItem));
      });
  }

  // entityIds are the ids of entities new sync items pertain to - optimization :))
  // TODO: maybe remove entityIds param, or make it optional
  _upsertSyncItems(newSyncItems, entityIds) {
    const delQuery = new Query().contains('entityId', entityIds);
    return this._getRepository()
      .then(repo => repo.delete(syncCollectionName, delQuery).then(() => repo))
      .then(repo => repo.create(syncCollectionName, newSyncItems));
  }

  _getCollectionFilter(collection, onlyTheseIds) {
    const query = new Query().equalTo('collection', collection);
    if (isNotEmpty(onlyTheseIds)) {
      query.contains('entityId', ensureArray(onlyTheseIds));
    }
    return query;
  }

  addCreateEvent(collection, entities) {
    entities = Array.isArray(entities) ? entities : [entities];
    const syncItems = entities.map(e => buildSyncItem(collection, SyncOperation.Create, e._id));
    return this._getRepository()
      .then(repo => repo.create(syncCollectionName, syncItems));
  }

  addDeleteByIdEvent(collection, deletedEntity) {
    if (isLocalEntity(deletedEntity)) {
      return this.removeSyncItemForEntityId(deletedEntity._id);
    }

    const syncItem = buildSyncItem(collection, SyncOperation.Delete, deletedEntity._id);
    return this._upsertSyncItem(syncItem);
  }

  addUpdateEvent(collection, entity) {
    const syncItem = buildSyncItem(collection, SyncOperation.Update, entity._id);
    return this._upsertSyncItem(syncItem);
  }

  addDeleteEvent(collection, entities) {
    const localEntityIds = [];
    const syncItems = [];
    const syncItemEntityIds = [];

    entities.forEach((entity) => {
      if (isLocalEntity(entity)) {
        localEntityIds.push(entity._id);
      } else {
        const item = buildSyncItem(collection, SyncOperation.Delete, entity._id);
        syncItems.push(item);
        syncItemEntityIds.push(entity._id);
      }
    });

    const query = new Query().contains('entityId', localEntityIds);
    const delPrm = this._removeSyncItems(query);
    const upsertPrm = this._upsertSyncItems(syncItems, syncItemEntityIds);
    return Promise.all([delPrm, upsertPrm]);
  }

  // TODO: does this need to support querying, or can it just take entities/ids
  getSyncItems(collection, onlyTheseIds) {
    const query = this._getCollectionFilter(collection, onlyTheseIds);
    return this._getRepository()
      .then(repo => repo.read(syncCollectionName, query));
  }

  getSyncItemCount(collection, onlyTheseIds) {
    const query = new Query().equalTo('collection', collection);
    if (isNotEmpty(onlyTheseIds)) {
      query.contains('entityId', onlyTheseIds);
    }
    return this._getRepository()
      .then(repo => repo.count(syncCollectionName, query));
  }

  removeSyncItemForEntityId(entityId) {
    const query = new Query().equalTo('entityId', entityId);
    return this._removeSyncItems(query);
  }

  removeSyncEntitiesForIds(entityIds) {
    const query = new Query().contains('entityId', entityIds);
    return this._removeSyncItems(query);
  }

  removeAllSyncItems(collection) {
    const query = new Query();
    if (collection) {
      query.equalTo('collection', collection);
    }
    return this._removeSyncItems(query);
  }
}
