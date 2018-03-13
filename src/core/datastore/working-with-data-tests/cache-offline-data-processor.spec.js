import expect from 'expect';
import cloneDeep from 'lodash/cloneDeep';
import { Promise } from 'es6-promise';

import { OperationType, Operation } from '../operations';
import { CacheOfflineDataProcessor } from '../processors';
import { KinveyError, NotFoundError } from '../../errors';
import { Query } from '../../query';
import { randomString } from '../../utils';
import { KinveyObservable } from '../../observable';
import {
  getRepoMock,
  validateError,
  validateSpyCalls,
  getSyncManagerMock,
  addExpectedCreateEntityMeta,
  createPromiseSpy
} from './utils';

const collection = 'books';

describe('CacheOfflineDataProcessor', () => {
  let offlineRepoMock = getRepoMock(); // set only for typings, otherwise set in beforeEach
  let networkRepoMock = getRepoMock();
  let syncManagerMock = getSyncManagerMock();
  let dataProcessor;

  beforeEach(() => {
    offlineRepoMock = getRepoMock();
    networkRepoMock = getRepoMock();
    syncManagerMock = getSyncManagerMock();
    dataProcessor = new CacheOfflineDataProcessor(syncManagerMock, networkRepoMock);
    // proxyquire can't reliably mock this, so overwriting private property :(
    dataProcessor._getRepository = () => Promise.resolve(offlineRepoMock);
  });

  describe('process()', () => {
    let operationType;
    let entityId;
    let entity;
    let operation;
    let options;

    beforeEach(() => {
      entityId = randomString();
      entity = { _id: entityId };
      operation = new Operation(operationType, collection, new Query(), entity, entityId);
      options = { test: true };
    });

    it('should return an error if an invalid operation type is passed using promises', () => {
      return dataProcessor.process({})
        .then(() => Promise.reject(new Error('Should not happen')))
        .catch((err) => {
          validateError(err, KinveyError, 'Unexpected operation type');
        });
    });

    describe('read-based operations', () => {
      function getExpectedQuery() {
        let expectedQuery = operation.type === OperationType.Group ? undefined : operation.query;
        if (operation.type === OperationType.ReadById) {
          expectedQuery = new Query().equalTo('_id', entityId);
        }
        return expectedQuery;
      }

      function addSyncQueueTests() {
        it('should call SyncManager.getSyncItemCountByEntityQuery()', () => {
          syncManagerMock.getSyncItemCountByEntityQuery = createPromiseSpy(0);
          return dataProcessor.process(operation).toPromise()
            .then(() => {
              const syncCountSpy = syncManagerMock.getSyncItemCountByEntityQuery;
              validateSpyCalls(syncCountSpy, 1, [collection, getExpectedQuery()]);
            });
        });

        it('should call SyncManager.push() if there are entities to sync', () => {
          syncManagerMock.getSyncItemCountByEntityQuery = createPromiseSpy(123);
          syncManagerMock.push = createPromiseSpy().andCall(() => {
            syncManagerMock.getSyncItemCountByEntityQuery = createPromiseSpy(0);
            return Promise.resolve();
          });
          return dataProcessor.process(operation).toPromise()
            .then(() => {
              validateSpyCalls(syncManagerMock.push, 1, [collection, getExpectedQuery()]);
            });
        });

        it('should call SyncManager.getSyncItemCountByEntityQuery() again, after push()', () => {
          syncManagerMock.getSyncItemCountByEntityQuery = createPromiseSpy(123);
          syncManagerMock.push = createPromiseSpy().andCall(() => {
            syncManagerMock.getSyncItemCountByEntityQuery.andReturn(Promise.resolve(0));
            return Promise.resolve();
          });
          return dataProcessor.process(operation).toPromise()
            .then(() => {
              validateSpyCalls(syncManagerMock.push, 1, [collection, getExpectedQuery()]);
              const secondCountSpy = syncManagerMock.getSyncItemCountByEntityQuery;
              validateSpyCalls(secondCountSpy, 2, [collection, getExpectedQuery()], [collection, getExpectedQuery()]);
            });
        });

        it('should return an error if there are still entities to sync, after push()', () => {
          syncManagerMock.getSyncItemCountByEntityQuery = createPromiseSpy(123);
          syncManagerMock.push = createPromiseSpy().andCall(() => {
            return Promise.resolve();
          });
          return dataProcessor.process(operation).toPromise()
            .catch((err) => {
              validateError(err, KinveyError, 'entities that need to be synced');
            });
        });

        it('should NOT call SyncManager.push() if there are NO entities to sync', () => {
          syncManagerMock.getSyncItemCountByEntityQuery = createPromiseSpy(0);
          return dataProcessor.process(operation).toPromise()
            .then(() => {
              validateSpyCalls(syncManagerMock.push, 0);
            });
        });
      }

      describe('operation type Read', () => {
        before(() => {
          operationType = OperationType.Read;
        });

        it('should return a KinveyObservable', () => {
          const result = dataProcessor.process(operation, options);
          expect(result).toBeA(KinveyObservable);
        });

        addSyncQueueTests();

        it('should call OfflineRepo.read()', () => {
          return dataProcessor.process(operation, options).toPromise()
            .then(() => {
              validateSpyCalls(offlineRepoMock.read, 1, [collection, operation.query, options]);
            });
        });

        it('should call NetworkRepo.read()', () => {
          return dataProcessor.process(operation, options).toPromise()
            .then(() => {
              validateSpyCalls(networkRepoMock.read, 1, [collection, operation.query, options]);
            });
        });

        it('should call OfflineRepo.delete() if any entities were found offline', () => {
          offlineRepoMock.read.andReturn(Promise.resolve([cloneDeep(entity)]));
          return dataProcessor.process(operation, options).toPromise()
            .then(() => {
              const expectedQuery = new Query().contains('_id', entity._id);
              validateSpyCalls(offlineRepoMock.delete, 1, [collection, expectedQuery]);
            });
        });

        it('should NOT call OfflineRepo.delete() if NO entities were found offline', () => {
          offlineRepoMock.read.andReturn(Promise.resolve([]));
          return dataProcessor.process(operation, options).toPromise()
            .then(() => {
              validateSpyCalls(offlineRepoMock.delete, 0);
            });
        });

        it('should call OfflineRepo.create() with the network entities', () => {
          const backendResponseMock = [cloneDeep(entity)];
          networkRepoMock.read.andReturn(Promise.resolve(backendResponseMock));
          return dataProcessor.process(operation, options).toPromise()
            .then(() => {
              validateSpyCalls(offlineRepoMock.create, 1, [collection, [entity]]);
            });
        });
      });

      describe('operation type ReadById', () => {
        before(() => {
          operationType = OperationType.ReadById;
        });

        it('should return a KinveyObservable', () => {
          const result = dataProcessor.process(operation, options);
          expect(result).toBeA(KinveyObservable);
        });

        addSyncQueueTests();

        it('should call OfflineRepo.readById()', () => {
          return dataProcessor.process(operation, options).toPromise()
            .then(() => {
              validateSpyCalls(offlineRepoMock.readById, 1, [collection, entityId, options]);
            });
        });

        it('should call NetworkRepo.readById()', () => {
          return dataProcessor.process(operation, options).toPromise()
            .then(() => {
              validateSpyCalls(offlineRepoMock.readById, 1, [collection, entityId, options]);
            });
        });

        it('should call NetworkRepo.readById() even when no entities were found offline', () => {
          offlineRepoMock.readById.andReturn(Promise.reject(new NotFoundError()));
          return dataProcessor.process(operation, options).toPromise()
            .then(() => {
              validateSpyCalls(networkRepoMock.readById, 1, [collection, entityId, options]);
            });
        });

        it('should call OfflineRepo.delete() if any entities were found offline', () => {
          offlineRepoMock.readById.andReturn(Promise.resolve(cloneDeep(entity)));
          return dataProcessor.process(operation, options).toPromise()
            .then(() => {
              const expectedQuery = new Query().contains('_id', entityId);
              validateSpyCalls(offlineRepoMock.delete, 1, [collection, expectedQuery]);
            });
        });

        it('should NOT call OfflineRepo.delete() if NO entities were found offline', () => {
          offlineRepoMock.readById.andReturn(Promise.resolve(null));
          return dataProcessor.process(operation, options).toPromise()
            .then(() => {
              validateSpyCalls(offlineRepoMock.delete, 0);
            });
        });

        it('should call OfflineRepo.create() with the network entities', () => {
          networkRepoMock.readById.andReturn(Promise.resolve([cloneDeep(entity)]));
          return dataProcessor.process(operation, options).toPromise()
            .then(() => {
              validateSpyCalls(offlineRepoMock.create, 1, [collection, [entity]]);
            });
        });
      });

      describe('operation type Count', () => {
        before(() => {
          operationType = OperationType.Count;
        });

        it('should return a KinveyObservable', () => {
          const result = dataProcessor.process(operation, options);
          expect(result).toBeA(KinveyObservable);
        });

        addSyncQueueTests();

        it('should call OfflineRepo.count()', () => {
          return dataProcessor.process(operation, options).toPromise()
            .then(() => {
              validateSpyCalls(offlineRepoMock.count, 1, [collection, operation.query, options]);
            });
        });

        it('should call NetworkRepo.count()', () => {
          return dataProcessor.process(operation, options).toPromise()
            .then(() => {
              validateSpyCalls(networkRepoMock.count, 1, [collection, operation.query, options]);
            });
        });
      });

      describe('operation type Group', () => {
        before(() => {
          operationType = OperationType.Group;
        });

        it('should return a KinveyObservable', () => {
          const result = dataProcessor.process(operation, options);
          expect(result).toBeA(KinveyObservable);
        });

        it('should call OfflineRepo.group()', () => {
          return dataProcessor.process(operation, options).toPromise()
            .then(() => {
              validateSpyCalls(offlineRepoMock.group, 1, [collection, operation.query, options]);
            });
        });

        addSyncQueueTests();

        it('should call NetworkRepo.group()', () => {
          return dataProcessor.process(operation, options).toPromise()
            .then(() => {
              validateSpyCalls(networkRepoMock.group, 1, [collection, operation.query, options]);
            });
        });
      });
    });

    describe('operation type Delete', () => {
      before(() => {
        operationType = OperationType.Delete;
      });

      it('should return a Promise', () => {
        const result = dataProcessor.process(operation, options);
        expect(result).toBeA(Promise);
      });

      it('should call NetworkRepo.delete()', () => {
        return dataProcessor.process(operation, options)
          .then(() => {
            validateSpyCalls(networkRepoMock.delete, 1, [collection, operation.query, options]);
          });
      });

      it('should call OfflineRepo.read()', () => {
        return dataProcessor.process(operation, options)
          .then(() => {
            validateSpyCalls(offlineRepoMock.read, 1, [collection, operation.query, options]);
          });
      });

      describe('when any offline entities match the query', () => {
        beforeEach(() => {
          offlineRepoMock.read.andReturn(Promise.resolve([cloneDeep(entity)]));
        });

        it('should call OfflineRepo.delete()', () => {
          return dataProcessor.process(operation, options)
            .then(() => {
              validateSpyCalls(offlineRepoMock.delete, 1, [collection, operation.query, options]);
            });
        });

        it('should call SyncManager.removeSyncItemsForIds()', () => {
          return dataProcessor.process(operation, options)
            .then(() => {
              const spy = syncManagerMock.removeSyncItemsForIds;
              return validateSpyCalls(spy, 1, [collection, [entityId]]);
            });
        });

        it('should call SyncManager.addDeleteEvent() if network delete failed', () => {
          networkRepoMock.delete.andReturn(Promise.reject());
          return dataProcessor.process(operation, options)
            .then(() => {
              const spy = syncManagerMock.addDeleteEvent;
              validateSpyCalls(spy, 1, [collection, [entity]]);
            });
        });

        it('should NOT call SyncManager.addDeleteEvent() if network delete succeeded', () => {
          return dataProcessor.process(operation, options)
            .then(() => {
              const spy = syncManagerMock.addDeleteEvent;
              validateSpyCalls(spy, 0);
            });
        });
      });

      describe('when NO offline entities match the query', () => {
        it('should NOT call OfflineRepo.delete()', () => {
          return dataProcessor.process(operation, options)
            .then(() => {
              validateSpyCalls(offlineRepoMock.delete, 0);
            });
        });

        it('should NOT SyncManager.removeSyncItemsForIds()', () => {
          return dataProcessor.process(operation, options)
            .then(() => {
              validateSpyCalls(syncManagerMock.removeSyncItemsForIds, 0);
            });
        });

        it('should NOT call SyncManager.addDeleteEvent()', () => {
          return dataProcessor.process(operation, options)
            .then(() => {
              validateSpyCalls(syncManagerMock.addDeleteEvent, 0);
            });
        });
      });
    });

    describe('operation type Create', () => {
      before(() => {
        operationType = OperationType.Create;
      });

      it('should return a Promise', () => {
        const result = dataProcessor.process(operation, options);
        expect(result).toBeA(Promise);
      });

      it('should call OfflineRepo.create()', () => {
        return dataProcessor.process(operation, options)
          .then(() => {
            const offlineEntityParams = [collection, operation.data, options];
            const firstCall = offlineRepoMock.create.calls[0];
            expect(firstCall.arguments).toEqual(offlineEntityParams);
          });
      });

      it('should call OfflineRepo.create() with generated id if no id was passed', () => {
        const operation = new Operation(OperationType.Create, collection, null, {});
        return dataProcessor.process(operation, options)
          .then(() => {
            const offlineEntityParams = [collection, addExpectedCreateEntityMeta(operation.data), options];
            const firstCall = offlineRepoMock.create.calls[0];
            delete firstCall.arguments[1]._id; // delete id so we don't compare it in expect()
            expect(firstCall.arguments).toEqual(offlineEntityParams);
          });
      });

      it('should deep clone the passed data before working with it', () => {
        return dataProcessor.process(operation, options)
          .then(() => {
            expect(offlineRepoMock.create.calls[0].arguments[1]).toEqual(operation.data);
            expect(offlineRepoMock.create.calls[0].arguments[1]).toNotBe(operation.data);
          });
      });

      it('should call SyncManager.addCreateEvent()', () => {
        offlineRepoMock.create.andReturn(Promise.resolve(cloneDeep(entity)));
        return dataProcessor.process(operation, options)
          .then(() => {
            validateSpyCalls(syncManagerMock.addCreateEvent, 1, [collection, entity]);
          });
      });

      it('should call NetworkRepo.create()', () => {
        return dataProcessor.process(operation, options)
          .then(() => {
            validateSpyCalls(networkRepoMock.create, 1, [collection, operation.data, options]);
          });
      });

      it('should call OfflineRepo.deleteById() to remove the local entity with temp id', () => {
        offlineRepoMock.create.andReturn(Promise.resolve(cloneDeep(entity)));
        return dataProcessor.process(operation, options)
          .then(() => {
            validateSpyCalls(offlineRepoMock.deleteById, 1, [collection, entityId]);
          });
      });

      it('should call OfflineRepo.create() to create the network entity offline', () => {
        offlineRepoMock.create.andReturn(Promise.resolve(cloneDeep(entity)));
        const networkEntityMock = cloneDeep(entity);
        networkEntityMock.blProperty = 1;
        networkRepoMock.create.andReturn(Promise.resolve(networkEntityMock));
        return dataProcessor.process(operation, options)
          .then(() => {
            const offlineCreateArgs = [collection, entity, options];
            const replacementCreateArgs = [collection, networkEntityMock];
            validateSpyCalls(offlineRepoMock.create, 2, offlineCreateArgs, replacementCreateArgs);
          });
      });

      it('should call SyncManager.removeSyncItemForEntityId() if network create succeeds', () => {
        offlineRepoMock.create.andReturn(Promise.resolve(cloneDeep(entity)));
        const networkEntityMock = cloneDeep(entity);
        networkEntityMock.blProperty = 1;
        networkRepoMock.create.andReturn(Promise.resolve(networkEntityMock));
        return dataProcessor.process(operation, options)
          .then(() => {
            validateSpyCalls(syncManagerMock.removeSyncItemForEntityId, 1, [collection, entityId]);
          });
      });
    });

    describe('operation type Update', () => {
      before(() => {
        operationType = OperationType.Update;
      });

      it('should return a Promise', () => {
        const result = dataProcessor.process(operation, options);
        expect(result).toBeA(Promise);
      });

      it('should call OfflineRepo.update()', () => {
        return dataProcessor.process(operation, options)
          .then(() => {
            // delete the second call, we're only validating the first here
            offlineRepoMock.update.calls.length = 1;
            validateSpyCalls(offlineRepoMock.update, 1, [collection, operation.data, options]);
          });
      });

      it('should call SyncManager.addUpdateEvent()', () => {
        offlineRepoMock.update.andReturn(Promise.resolve(cloneDeep(entity)));
        return dataProcessor.process(operation, options)
          .then(() => {
            validateSpyCalls(syncManagerMock.addUpdateEvent, 1, [collection, entity]);
          });
      });

      it('should call NetworkRepo.update()', () => {
        return dataProcessor.process(operation, options)
          .then(() => {
            validateSpyCalls(networkRepoMock.update, 1, [collection, entity, options]);
          });
      });

      it('should call OfflineRepo.update()', () => {
        const networkEntityMock = { _id: randomString() };
        networkRepoMock.update.andReturn(Promise.resolve(networkEntityMock));
        return dataProcessor.process(operation, options)
          .then(() => {
            const localUpdate = [collection, operation.data, options];
            const updateWithNetwork = [collection, networkEntityMock, options];
            validateSpyCalls(offlineRepoMock.update, 2, localUpdate, updateWithNetwork);
          });
      });

      it('should call SyncManager.removeSyncItemForEntityId()', () => {
        const networkEntityMock = { _id: randomString() };
        networkRepoMock.update.andReturn(Promise.resolve(networkEntityMock));
        return dataProcessor.process(operation, options)
          .then(() => {
            const spy = syncManagerMock.removeSyncItemForEntityId;
            validateSpyCalls(spy, 1, [collection, networkEntityMock._id]);
          });
      });
    });

    describe('operation type DeleteById', () => {
      before(() => {
        operationType = OperationType.DeleteById;
      });

      it('should return a Promise', () => {
        const result = dataProcessor.process(operation, options);
        expect(result).toBeA(Promise);
      });

      it('should call OfflineRepo.readById()', () => {
        return dataProcessor.process(operation, options)
          .then(() => {
            validateSpyCalls(offlineRepoMock.readById, 1, [collection, entityId]);
          });
      });

      describe('deleting local entity', () => {
        beforeEach(() => {
          const localEntity = addExpectedCreateEntityMeta({ _id: entityId });
          offlineRepoMock.readById.andReturn(Promise.resolve(localEntity));
        });

        it('should call OfflineRepo.deleteById()', () => {
          return dataProcessor.process(operation, options)
            .then(() => {
              validateSpyCalls(offlineRepoMock.deleteById, 1, [collection, entityId, options]);
            });
        });

        it('should NOT call NetworkRepo.deleteById()', () => {
          return dataProcessor.process(operation, options)
            .then(() => {
              validateSpyCalls(networkRepoMock.deleteById, 0);
            });
        });

        it('should call SyncManager.addDeleteEvent() if any offline entities were deleted', () => {
          offlineRepoMock.deleteById.andReturn(Promise.resolve(1));
          return dataProcessor.process(operation, options)
            .then(() => {
              validateSpyCalls(syncManagerMock.addDeleteEvent, 1, [collection, addExpectedCreateEntityMeta(entity)]);
            });
        });
      });

      describe('deleting a non-local entity', () => {
        beforeEach(() => {
          offlineRepoMock.readById.andReturn(Promise.resolve(entity));
        });

        it('should call NetworkRepo.deleteById() if entity was NOT local', () => {
          return dataProcessor.process(operation, options)
            .then(() => {
              validateSpyCalls(networkRepoMock.deleteById, 1, [collection, entityId, options]);
            });
        });

        it('should call SyncManager.removeSyncItemForEntityId() if network call succeeds', () => {
          return dataProcessor.process(operation, options)
            .then(() => {
              validateSpyCalls(syncManagerMock.removeSyncItemForEntityId, 1, [collection, entityId]);
            });
        });

        it('should not return an error if network call results in a 404', () => {
          networkRepoMock.deleteById.andReturn(Promise.reject(new NotFoundError()));
          return dataProcessor.process(operation, options)
            .then(() => {
              validateSpyCalls(networkRepoMock.deleteById, 1, [collection, entityId, options]);
            });
        });

        it('should call OfflineRepo.deleteById()', () => {
          return dataProcessor.process(operation, options)
            .then(() => {
              validateSpyCalls(offlineRepoMock.deleteById, 1, [collection, entityId, options]);
            });
        });

        it('should call SyncManager.addDeleteEvent()', () => {
          networkRepoMock.deleteById.andReturn(Promise.reject(new Error()));
          return dataProcessor.process(operation, options)
            .then(() => {
              validateSpyCalls(offlineRepoMock.deleteById, 0);
              validateSpyCalls(syncManagerMock.removeSyncItemForEntityId, 0);
              validateSpyCalls(syncManagerMock.addDeleteEvent, 1, [collection, entity]);
            });
        });
      });
    });

    describe('operation type Clear', () => {
      before(() => {
        operationType = OperationType.Clear;
      });

      it('should return a Promise', () => {
        const result = dataProcessor.process(operation, options);
        expect(result).toBeA(Promise);
      });

      it('should call SyncManager.clearSync()', () => {
        return dataProcessor.process(operation, options)
          .then(() => {
            validateSpyCalls(syncManagerMock.clearSync, 1, [collection, operation.query]);
          });
      });

      it('should call OfflineRepo.delete()', () => {
        return dataProcessor.process(operation, options)
          .then(() => {
            validateSpyCalls(offlineRepoMock.delete, 1, [collection, operation.query, options]);
          });
      });
    });
  });
});
