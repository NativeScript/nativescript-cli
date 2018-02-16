import expect from 'expect';

import { SyncOperation } from '../sync';
import { randomString } from '../../utils';
import { Query } from '../../query';
import { mockRequiresIn } from '../require-helper';
import { KinveyError, NotFoundError, SyncError } from '../../errors';
import {
  createPromiseSpy,
  getRepoMock,
  validateError,
  validateSpyCalls
} from './utils';

const collection = 'books';

function getSyncItemMock(operation, entityId, collectionName) {
  return {
    entityId: entityId,
    state: { operation },
    collection: collectionName || collection
  };
}

/**
 * @typedef SyncStateManagerMock
 * @property {expect.Spy} getSyncItems
 * @property {expect.Spy} removeSyncItemForEntityId
 * @property {expect.Spy} getSyncItemCount
 * @property {expect.Spy} removeSyncItemsForIds
 * @property {expect.Spy} removeAllSyncItems
 */

describe('SyncManager delegating to repos and SyncStateManager', () => {
  /** @type {SyncManager} */
  let syncManager;
  let networkRepoMock = getRepoMock(); // set only for typings, otherwise set in beforeEach
  /** @type {SyncStateManagerMock} */
  let syncStateManagerMock;
  let offlineRepoMock = getRepoMock(); // set only for typings, otherwise set in beforeEach

  beforeEach(() => {
    offlineRepoMock = getRepoMock();
    networkRepoMock = getRepoMock();
    syncStateManagerMock = {
      getSyncItems: createPromiseSpy(),
      removeSyncItemForEntityId: createPromiseSpy(),
      getSyncItemCount: createPromiseSpy(),
      removeSyncItemsForIds: createPromiseSpy(),
      removeAllSyncItems: createPromiseSpy(),
      addCreateEvent: createPromiseSpy(),
      addUpdateEvent: createPromiseSpy(),
      addDeleteEvent: createPromiseSpy()
    };
  });

  beforeEach(() => {
    const repoProviderMock = {
      getOfflineRepository: () => Promise.resolve(offlineRepoMock)
    };
    const requireMocks = {
      '../repositories': {
        repositoryProvider: repoProviderMock
      }
    };
    const ProxiedSyncManager = mockRequiresIn(__dirname, '../sync/sync-manager', requireMocks, 'SyncManager');
    syncManager = new ProxiedSyncManager(networkRepoMock, syncStateManagerMock);
  });

  describe('push()', () => {
    it('should return an error when no collection is passed', () => {
      return syncManager.push()
        .then(() => Promise.reject(new Error('Should not happen')))
        .catch((err) => {
          validateError(err, KinveyError, 'collection name');
        });
    });

    it('should return an error when an invalid collection is passed', () => {
      return syncManager.push('')
        .then(() => Promise.reject(new Error('Should not happen')))
        .catch((err) => {
          validateError(err, KinveyError, 'collection name');
        });
    });

    it('should return an error when a non-string is passed', () => {
      return syncManager.push({ test: 1 })
        .then(() => Promise.reject(new Error('Should not happen')))
        .catch((err) => {
          validateError(err, KinveyError, 'collection name');
        });
    });

    it('should read the offline entities the query matches, to filter sync items', () => {
      const query = new Query();
      const localEntitiesToReturn = [{ _id: '123' }];
      offlineRepoMock.read = createPromiseSpy(localEntitiesToReturn);
      return syncManager.push(collection, query)
        .then(() => {
          validateSpyCalls(offlineRepoMock.read, 1, [collection, query]);
        });
    });

    it('should not read offline entities when no query is passed, to filter sync items', () => {
      return syncManager.push(collection)
        .then(() => {
          validateSpyCalls(offlineRepoMock.read, 0);
        });
    });

    it('should call SyncStateManager.getSyncItems() with the ids of entities matching the query', () => {
      const query = new Query();
      const entityId = randomString();
      const localEntitiesToReturn = [{ _id: entityId }];
      offlineRepoMock.read = createPromiseSpy(localEntitiesToReturn);
      return syncManager.push(collection, query)
        .then(() => {
          validateSpyCalls(syncStateManagerMock.getSyncItems, 1, [collection, entityId]);
        });
    });

    describe('processing a sync item', () => {
      it('should call OfflineRepo.readById() to find the entity for this sync item', () => {
        const entityId = randomString();
        syncStateManagerMock.getSyncItems = createPromiseSpy([{ entityId: entityId }]);
        return syncManager.push(collection)
          .then(() => {
            validateSpyCalls(offlineRepoMock.readById, 1, [collection, entityId]);
          });
      });

      it('should call SyncStateManager.removeSyncItemForEntityId() if the entity was not found and operation is not delete', () => {
        const entityId = randomString();
        const syncItemsMock = [getSyncItemMock(SyncOperation.Update, entityId)];
        syncStateManagerMock.getSyncItems = createPromiseSpy(syncItemsMock);
        offlineRepoMock.readById = createPromiseSpy(new NotFoundError(), true);
        return syncManager.push(collection)
          .then(() => {
            const spy = syncStateManagerMock.removeSyncItemForEntityId;
            validateSpyCalls(spy, 1, [collection, entityId]);
          });
      });

      it('should NOT call SyncStateManager.removeSyncItemForEntityId() if the entity was not found and operation IS delete', () => {
        const entityId = randomString();
        const syncItemsMock = [getSyncItemMock(SyncOperation.Delete, entityId)];
        syncStateManagerMock.getSyncItems = createPromiseSpy(syncItemsMock);
        offlineRepoMock.readById = createPromiseSpy(new NotFoundError(), true);
        return syncManager.push(collection)
          .then(() => {
            const spy = syncStateManagerMock.removeSyncItemForEntityId;
            validateSpyCalls(spy, 1, [collection, entityId]); // only called after push finishes. otherwise it would be 2
          });
      });

      it('should NOT call SyncStateManager.removeSyncItemForEntityId() if the entity push resulted in an error', () => {
        const entityId = randomString();
        const syncItemsMock = [getSyncItemMock(SyncOperation.Create, entityId)];
        syncStateManagerMock.getSyncItems = createPromiseSpy(syncItemsMock);
        networkRepoMock.create = createPromiseSpy(new Error('Some network error'), true);
        return syncManager.push(collection)
          .then((results) => {
            expect(results[0]).toExist();
            expect(results[0].error.message).toInclude('Some network error');
            const spy = syncStateManagerMock.removeSyncItemForEntityId;
            validateSpyCalls(spy, 0);
          });
      });

      describe('for operation', () => {
        let entityId;
        let entityToBeSyncedMock;
        let networkReponseEntityMock;
        let syncItemsMock;
        let operationType;

        beforeEach(() => {
          entityId = randomString();
          entityToBeSyncedMock = { _id: entityId };
          networkReponseEntityMock = { _id: entityId, propFromBl: true };
          syncItemsMock = [getSyncItemMock(operationType, entityId, collection)];
          syncStateManagerMock.getSyncItems = createPromiseSpy(syncItemsMock);
          offlineRepoMock.readById = createPromiseSpy(entityToBeSyncedMock);
        });

        describe('create()', () => {
          before(() => {
            operationType = SyncOperation.Create;
          });

          beforeEach(() => {
            networkRepoMock.create = createPromiseSpy(networkReponseEntityMock);
          });

          it('should call NetworkRepo.create()', () => {
            return syncManager.push(collection)
              .then(() => {
                validateSpyCalls(networkRepoMock.create, 1, [collection, entityToBeSyncedMock]);
              });
          });

          it('should call OfflineRepo.deleteById() and then OfflineRepo.create() with the network result', () => {
            return syncManager.push(collection)
              .then(() => {
                validateSpyCalls(offlineRepoMock.deleteById, 1, [collection, entityId]);
                validateSpyCalls(offlineRepoMock.create, 1, [collection, networkReponseEntityMock]);
              });
          });

          it('should call SyncStateManager.removeSyncItemForEntityId()', () => {
            return syncManager.push(collection)
              .then(() => {
                const spy = syncStateManagerMock.removeSyncItemForEntityId;
                validateSpyCalls(spy, 1, [collection, entityId]);
              });
          });
        });

        describe('update()', () => {
          before(() => {
            operationType = SyncOperation.Update;
          });

          beforeEach(() => {
            networkRepoMock.update = createPromiseSpy(networkReponseEntityMock);
          });

          it('should call NetworkRepo.update()', () => {
            return syncManager.push(collection)
              .then(() => {
                validateSpyCalls(networkRepoMock.update, 1, [collection, entityToBeSyncedMock]);
              });
          });

          it('should call OfflineRepo.update() with network result', () => {
            return syncManager.push(collection)
              .then(() => {
                validateSpyCalls(offlineRepoMock.update, 1, [collection, networkReponseEntityMock]);
              });
          });

          it('should call SyncStateManager.removeSyncItemForEntityId()', () => {
            return syncManager.push(collection)
              .then(() => {
                const spy = syncStateManagerMock.removeSyncItemForEntityId;
                validateSpyCalls(spy, 1, [collection, networkReponseEntityMock._id]);
              });
          });
        });

        describe('delete()', () => {
          before(() => {
            operationType = SyncOperation.Delete;
          });

          beforeEach(() => {
            networkRepoMock.deleteById = createPromiseSpy(1);
          });

          it('should call NetworkRepo.deleteById()', () => {
            return syncManager.push(collection)
              .then(() => {
                validateSpyCalls(networkRepoMock.deleteById, 1, [collection, entityId]);
              });
          });

          it('should call SyncStateManager.removeSyncItemForEntityId()', () => {
            return syncManager.push(collection)
              .then(() => {
                const spy = syncStateManagerMock.removeSyncItemForEntityId;
                validateSpyCalls(spy, 1, [collection, entityId]);
              });
          });
        });
      });
    });
  });

  describe('pull()', () => {
    const query = new Query();
    const optionName = 'test';
    const options = { [optionName]: true };

    it('should return an error if no collection name is passed', () => {
      return syncManager.pull()
        .then(() => Promise.reject(new Error('Should not happen')))
        .catch((err) => {
          validateError(err, KinveyError, 'collection name');
        });
    });

    it('should return an error if collection param is not a string', () => {
      return syncManager.pull({ invalid: true })
        .then(() => Promise.reject(new Error('Should not happen')))
        .catch((err) => {
          validateError(err, KinveyError, 'collection name');
        });
    });

    it('should return an error if collection param is an empty string', () => {
      return syncManager.pull('')
        .then(() => Promise.reject(new Error('Should not happen')))
        .catch((err) => {
          validateError(err, KinveyError, 'collection name');
        });
    });

    it('should call NetworkRepo.read() to get entities from the backend', () => {
      return syncManager.pull(collection, query, options)
        .then(() => {
          validateSpyCalls(networkRepoMock.read, 1, [collection, query, options]);
        });
    });

    it('should call OfflineRepo.delete() to reflect deleted entities locally', () => {
      return syncManager.pull(collection, query, options)
        .then(() => {
          validateSpyCalls(offlineRepoMock.delete, 1, [collection, query]);
        });
    });

    it('should call OfflineRepo.update() to upsert entities available locally', () => {
      const serverItemsMock = [{ _id: randomString() }, { _id: randomString() }];
      networkRepoMock.read = createPromiseSpy(serverItemsMock);
      return syncManager.pull(collection, query, options)
        .then(() => {
          validateSpyCalls(offlineRepoMock.update, 1, [collection, serverItemsMock]);
        });
    });
  });

  describe('getSyncItemCount()', () => {
    it('should return an error if no collection name is passed', () => {
      return syncManager.getSyncItemCount()
        .then(() => Promise.reject(new Error('Should not happen')))
        .catch((err) => {
          validateError(err, KinveyError, 'collection name');
        });
    });

    it('should return an error if collection param is not a string', () => {
      return syncManager.getSyncItemCount({ invalid: true })
        .then(() => Promise.reject(new Error('Should not happen')))
        .catch((err) => {
          validateError(err, KinveyError, 'collection name');
        });
    });

    it('should return an error if collection param is an empty string', () => {
      return syncManager.getSyncItemCount('')
        .then(() => Promise.reject(new Error('Should not happen')))
        .catch((err) => {
          validateError(err, KinveyError, 'collection name');
        });
    });

    it('should call SyncStateManager.getSyncItemCount()', () => {
      return syncManager.getSyncItemCount(collection)
        .then(() => {
          validateSpyCalls(syncStateManagerMock.getSyncItemCount, 1, [collection]);
        });
    });
  });

  describe('getSyncItemCountByEntityQuery()', () => {
    const query = new Query();
    let entitiesMock;

    beforeEach(() => {
      entitiesMock = [{ _id: randomString() }, { _id: randomString() }];
      offlineRepoMock.read = createPromiseSpy(entitiesMock);
    });

    it('should call OfflineRepo.read() to get the entities matching the query', () => {
      return syncManager.getSyncItemCountByEntityQuery(collection, query)
        .then(() => {
          const spy = offlineRepoMock.read;
          validateSpyCalls(spy, 1, [collection, query]);
        });
    });

    it('should call SyncStateManager.getSyncItemCount with the ids of matching entities', () => {
      return syncManager.getSyncItemCountByEntityQuery(collection, query)
        .then(() => {
          const spy = syncStateManagerMock.getSyncItemCount;
          validateSpyCalls(spy, 1, [collection, entitiesMock.map(e => e._id)]);
        });
    });
  });

  describe('getSyncEntities()', () => {
    const query = new Query();
    let entitiesMock;

    beforeEach(() => {
      entitiesMock = [{ _id: randomString() }, { _id: randomString() }];
      offlineRepoMock.read = createPromiseSpy(entitiesMock);
    });

    it('should call OfflineRepo.read() to get entities matching the query', () => {
      return syncManager.getSyncEntities(collection, query)
        .then(() => {
          validateSpyCalls(offlineRepoMock.read, 1, [collection, query]);
        });
    });

    it('should call SyncStateManager.getSyncItems() with matching entities\' ids', () => {
      return syncManager.getSyncEntities(collection, query)
        .then(() => {
          validateSpyCalls(syncStateManagerMock.getSyncItems, 1, [collection, entitiesMock.map(e => e._id)]);
        });
    });
  });

  describe('clearSync()', () => {
    it('should call SyncStateManager.removeSyncItemsForIds() with matching entity ids, when a query is passed', () => {
      const query = new Query();
      const entitiesMock = [{ _id: randomString() }, { _id: randomString() }];
      offlineRepoMock.read = createPromiseSpy(entitiesMock);
      return syncManager.clearSync(collection, query)
        .then(() => {
          const spy = syncStateManagerMock.removeSyncItemsForIds;
          validateSpyCalls(spy, 1, [collection, entitiesMock.map(e => e._id)]);
        });
    });

    it('should call SyncStateManager.removeAllSyncItems() with matching entity ids, when NO query is passed,', () => {
      return syncManager.clearSync(collection)
        .then(() => {
          validateSpyCalls(offlineRepoMock.read, 0);
          const spy = syncStateManagerMock.removeAllSyncItems;
          validateSpyCalls(spy, 1, [collection]);
        });
    });
  });

  ['Create', 'Delete', 'Update'].forEach((eventName) => {
    eventName = `${eventName[0]}${eventName.substring(1).toLowerCase()}`;
    const methodName = `add${eventName}Event`;

    describe(`${methodName}()`, () => {
      it('should return an error if no entities are passed', () => {
        return syncManager[methodName]()
          .then(() => Promise.reject(new Error('Should not happen')))
          .catch((err) => {
            validateError(err, SyncError, 'entities array');
          });
      });

      it('should return an error if any of the passed entities is missing an id', () => {
        return syncManager[methodName](collection, [{}])
          .then(() => Promise.reject(new Error('Should not happen')))
          .catch((err) => {
            validateError(err, SyncError, 'missing an _id');
          });
      });

      it(`should call SyncStateManager.${methodName}()`, () => {
        const entitiesMock = [{ _id: randomString() }];
        return syncManager[methodName](collection, entitiesMock)
          .then(() => {
            const spy = syncStateManagerMock[methodName];
            validateSpyCalls(spy, 1, [collection, entitiesMock]);
          });
      });
    });
  });
});
