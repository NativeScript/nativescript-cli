import { Promise } from 'es6-promise';
import clone from 'lodash/clone';

import { Query } from '../../query';

import { SyncOperation } from '../sync';
import { repositoryProvider } from '../repositories';
import { syncCollectionName, buildSyncItem } from './utils';
import { ensureArray } from '../../utils';
import { isNotEmpty, isEmpty, isLocalEntity } from '../utils';

// imported for typings
// import { OfflineRepository } from '../repositories';

// TODO: there's probably room for performance improvements :)
export class SyncStateManager {
  _repoPromise;

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
  // TODO: should we keep anything from the original sync item?
  _upsertSyncItems(newSyncItems, entityIds) {
    if (isEmpty(entityIds)) {
      entityIds = newSyncItems.map(i => i.entityId);
    }
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
    const syncItems = ensureArray(entities)
      .map(e => buildSyncItem(collection, SyncOperation.Create, e._id));
    return this._getRepository()
      .then(repo => repo.create(syncCollectionName, syncItems));
  }

  addUpdateEvent(collection, entities) {
    const syncItems = ensureArray(entities)
      .map(e => buildSyncItem(collection, SyncOperation.Update, e._id));
    return this._upsertSyncItems(syncItems);
  }

  addDeleteEvent(collection, entities) {
    const localEntityIds = [];
    const syncItems = [];
    const syncItemEntityIds = [];

    ensureArray(entities).forEach((entity) => {
      if (isLocalEntity(entity)) {
        localEntityIds.push(entity._id);
      } else {
        const item = buildSyncItem(collection, SyncOperation.Delete, entity._id);
        syncItems.push(item);
        syncItemEntityIds.push(entity._id);
      }
    });

    const query = new Query().contains('entityId', localEntityIds);
    const delPrm = this._removeSyncItems(query); // TODO: perhaps this logic shouldn't be here - maybe in processor
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
    const query = this._getCollectionFilter(collection, onlyTheseIds);
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
