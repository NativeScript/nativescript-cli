// import expect from 'expect';
import { SyncOperation } from '../sync';
import { mockRequiresIn } from '../require-helper';
import { getRepoMock, validateSpyCalls, addExpectedCreateEntityMeta } from './utils';
import { randomString, ensureArray } from '../../utils';
import { Query } from '../../query';

const tag = 'some-tag';
const collectionName = 'books';
const collection = `${collectionName}.${tag}`;
const expectedSynCollection = `kinvey_sync.${tag}`;

function buildSyncItem(entity, syncOp) {
  return {
    collection,
    entityId: entity._id,
    state: {
      operation: syncOp
    }
  };
}

function getExpectedSyncItems(entities, syncOp) {
  entities = ensureArray(entities);
  return entities.map(e => buildSyncItem(e, syncOp));
}

function removeIdsFromSpyCall(spy) {
  spy.calls[0].arguments[1].forEach((entity) => {
    delete entity._id;
  });
}

function getSyncItemsQuery(entities) {
  const query = new Query();
  query.equalTo('collection', collection)
    .or()
    .equalTo('collection', collectionName);

  if (entities) {
    query.and().contains('entityId', ensureArray(entities).map(e => e._id));
  }

  return query;
}

describe('SyncStateManager', () => {
  let offlineRepoMock = getRepoMock();
  let entity;
  let stateManager;

  const entityArgumentOptionGetters = [() => entity, () => [entity]];

  beforeEach(() => {
    const path = '../sync/sync-state-manager';
    entity = { _id: randomString() };
    offlineRepoMock = getRepoMock();
    const requireMocks = {
      '../repositories': {
        repositoryProvider: {
          getOfflineRepository: () => Promise.resolve(offlineRepoMock)
        }
      }
    };
    const ProxiedSyncStateManager = mockRequiresIn(__dirname, path, requireMocks, 'SyncStateManager');
    stateManager = new ProxiedSyncStateManager();
  });

  describe('addCreateEvent()', () => {
    entityArgumentOptionGetters.forEach((getEntityArg, ind) => {
      const titleSuffix = ind ? 'an array of entities' : 'a single entity';
      it(`should call OfflineRepo.create when passed ${titleSuffix}`, () => {
        return stateManager.addCreateEvent(collection, getEntityArg())
          .then(() => {
            const expectedItems = getExpectedSyncItems(entity, SyncOperation.Create);
            removeIdsFromSpyCall(offlineRepoMock.create);
            validateSpyCalls(offlineRepoMock.create, 1, [expectedSynCollection, expectedItems]);
          });
      });
    });
  });

  describe('addUpdateEvent()', () => {
    entityArgumentOptionGetters.forEach((getEntityArg, ind) => {
      const titleSuffix = ind ? 'an array of entities' : 'a single entity';
      it(`should call OfflineRepo.delete when passed ${titleSuffix}`, () => {
        return stateManager.addUpdateEvent(collection, getEntityArg())
          .then(() => {
            const entityIds = ensureArray(getEntityArg()).map(e => e._id);
            const expectedQuery = new Query().contains('entityId', entityIds);
            validateSpyCalls(offlineRepoMock.delete, 1, [expectedSynCollection, expectedQuery]);
          });
      });

      it(`should call OfflineRepo.create when passed ${titleSuffix}`, () => {
        return stateManager.addUpdateEvent(collection, getEntityArg())
          .then(() => {
            const expectedItems = getExpectedSyncItems(entity, SyncOperation.Update);
            removeIdsFromSpyCall(offlineRepoMock.create);
            validateSpyCalls(offlineRepoMock.create, 1, [expectedSynCollection, expectedItems]);
          });
      });
    });
  });

  describe('addDeleteEvent()', () => {
    entityArgumentOptionGetters.forEach((getEntityArg, ind) => {
      const titleSuffix = ind ? 'an array of entities' : 'a single entity';
      it(`should work when passed ${titleSuffix}`, () => {
        return stateManager.addDeleteEvent(collection, getEntityArg())
          .then(() => {
            const expectedQuery = new Query().contains('entityId', [entity._id]);
            validateSpyCalls(offlineRepoMock.delete, 1, [expectedSynCollection, expectedQuery]);
            removeIdsFromSpyCall(offlineRepoMock.create);
            validateSpyCalls(offlineRepoMock.create, 1, [expectedSynCollection, getExpectedSyncItems(entity, SyncOperation.Delete)]);
          });
      });
    });

    it('should call OfflineRepo.delete() when item is local', () => {
      entity = addExpectedCreateEntityMeta(entity);
      return stateManager.addDeleteEvent(collection, entity)
        .then(() => {
          const expectedQuery = getSyncItemsQuery(entity);
          // difference between upserting and deleting entries for local entities
          validateSpyCalls(offlineRepoMock.create, 0);
          validateSpyCalls(offlineRepoMock.delete, 1, [expectedSynCollection, expectedQuery]);
        });
    });

    it('should call OfflineRepo.delete() when item is NOT local', () => {
      return stateManager.addDeleteEvent(collection, entity)
        .then(() => {
          const expectedQuery = new Query().contains('entityId', [entity._id]);
          validateSpyCalls(offlineRepoMock.delete, 1, [expectedSynCollection, expectedQuery]);
          removeIdsFromSpyCall(offlineRepoMock.create);
          const expectedCreateArgs = [expectedSynCollection, getExpectedSyncItems(entity, SyncOperation.Delete)];
          validateSpyCalls(offlineRepoMock.create, 1, expectedCreateArgs);
        });
    });

    it('should remove sync items for local entities, and update ones for non-local entities', () => {
      const localEntity = addExpectedCreateEntityMeta({ _id: randomString() });
      return stateManager.addDeleteEvent(collection, [entity, localEntity])
        .then(() => {
          const expectedQuryForLocalEntities = new Query().contains('entityId', [entity._id]);
          const expectedQueryForNonlocalEntities = getSyncItemsQuery(localEntity);
          const expectedArgsForLocal = [expectedSynCollection, expectedQueryForNonlocalEntities];
          const expectedArgsForNonlocal = [expectedSynCollection, expectedQuryForLocalEntities];
          validateSpyCalls(offlineRepoMock.delete, 2, expectedArgsForLocal, expectedArgsForNonlocal);
          removeIdsFromSpyCall(offlineRepoMock.create);
          const expectedCreateArgs = [expectedSynCollection, getExpectedSyncItems(entity, SyncOperation.Delete)];
          validateSpyCalls(offlineRepoMock.create, 1, expectedCreateArgs);
        });
    });
  });

  describe('getSyncItems()', () => {
    it('should call OfflineRepo.read() with a query, when entity ids are passed', () => {
      return stateManager.getSyncItems(collection, [entity._id])
        .then(() => {
          const expectedQuery = getSyncItemsQuery(entity);
          validateSpyCalls(offlineRepoMock.read, 1, [expectedSynCollection, expectedQuery]);
        });
    });

    it('should call OfflineRepo.read() with no query, when NO entity ids are passed', () => {
      return stateManager.getSyncItems(collection)
        .then(() => {
          const expectedQuery = getSyncItemsQuery();
          validateSpyCalls(offlineRepoMock.read, 1, [expectedSynCollection, expectedQuery]);
        });
    });
  });

  describe('getSyncItemCount()', () => {
    it('should call OfflineRepo.count() with a query, when entity ids are passed', () => {
      return stateManager.getSyncItemCount(collection, [entity._id])
        .then(() => {
          const expectedQuery = getSyncItemsQuery(entity);
          validateSpyCalls(offlineRepoMock.count, 1, [expectedSynCollection, expectedQuery]);
        });
    });

    it('should call OfflineRepo.count() with no query, when NO entity ids are passed', () => {
      return stateManager.getSyncItemCount(collection)
        .then(() => {
          const expectedQuery = getSyncItemsQuery();
          validateSpyCalls(offlineRepoMock.count, 1, [expectedSynCollection, expectedQuery]);
        });
    });
  });

  describe('removeSyncItemForEntityId()', () => {
    it('should call OfflineRepo.delete()', () => {
      return stateManager.removeSyncItemForEntityId(collection, entity._id)
        .then(() => {
          const expectedQuery = new Query().equalTo('entityId', entity._id);
          validateSpyCalls(offlineRepoMock.delete, 1, [expectedSynCollection, expectedQuery]);
        });
    });
  });

  describe('removeSyncItemsForIds()', () => {
    it('should call OfflineRepo.delete()', () => {
      return stateManager.removeSyncItemsForIds(collection, [entity._id])
        .then(() => {
          const expectedQuery = getSyncItemsQuery(entity);
          validateSpyCalls(offlineRepoMock.delete, 1, [expectedSynCollection, expectedQuery]);
        });
    });
  });

  describe('removeAllSyncItems()', () => {
    it('should call OfflineRepo.delete() when a collection is passed', () => {
      return stateManager.removeAllSyncItems(collection)
        .then(() => {
          const expectedQuery = getSyncItemsQuery();
          validateSpyCalls(offlineRepoMock.delete, 1, [expectedSynCollection, expectedQuery]);
        });
    });
  });
});
