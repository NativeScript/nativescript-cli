import each from 'lodash/each';
import omit from 'lodash/omit';

import { OperationType, Operation } from '../operations';
import { mockRequiresIn } from '../require-helper';
import { KinveyError } from '../../errors';
import { Query } from '../../query';
import {
  getRepoMock,
  validateError,
  validateSpyCalls,
  getSyncManagerMock,
  addExpectedCreateEntityMeta,
  createPromiseSpy
} from './utils';
import { randomString } from '../../utils';

const collection = 'books';

describe('NetworkDataProcessor', () => {
  let repoMock = getRepoMock(); // set only for typings, otherwise set in beforeEach
  let syncManagerMock = getSyncManagerMock();
  let dataProcessor;

  beforeEach(() => {
    repoMock = getRepoMock();
    const repoProviderMock = {
      getOfflineRepository: () => Promise.resolve(repoMock)
    };
    const requireMocks = {
      '../repositories': {
        repositoryProvider: repoProviderMock
      }
    };
    syncManagerMock = getSyncManagerMock();
    const path = '../processors/offline-data-processor';
    const ProxiedNetworkProcessor = mockRequiresIn(__dirname, path, requireMocks, 'OfflineDataProcessor');
    dataProcessor = new ProxiedNetworkProcessor(syncManagerMock);
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

    it('should return an error if an invalid operation type is passed', () => {
      return dataProcessor.process({})
        .then(() => Promise.reject(new Error('Should not happen')))
        .catch((err) => {
          validateError(err, KinveyError, 'Unexpected operation type');
        });
    });

    describe('processing a Clear operation', () => {
      before(() => {
        operationType = OperationType.Clear;
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
            validateSpyCalls(repoMock.delete, 1, [collection, operation.query, options]);
          });
      });
    });

    describe('processing a Delete operation', () => {
      before(() => {
        operationType = OperationType.Delete;
      });

      it('should call OfflineRepo.read()', () => {
        return dataProcessor.process(operation, options)
          .then(() => {
            validateSpyCalls(repoMock.read, 1, [collection, operation.query, options]);
          });
      });

      it('should call OfflineRepo.delete() if the query matches any entities', () => {
        const matchingEntitiesMock = [{}];
        repoMock.read = createPromiseSpy(matchingEntitiesMock);
        return dataProcessor.process(operation, options)
          .then(() => {
            validateSpyCalls(repoMock.delete, 1, [collection, operation.query, options]);
            validateSpyCalls(syncManagerMock.addDeleteEvent, 1, [collection, matchingEntitiesMock]);
          });
      });

      it('should NOT call OfflineRepo.delete() if the query matches NO entities', () => {
        const matchingEntitiesMock = [];
        repoMock.read = createPromiseSpy(matchingEntitiesMock);
        return dataProcessor.process(operation, options)
          .then(() => {
            validateSpyCalls(repoMock.delete, 0, [collection, operation.query, options]);
            validateSpyCalls(syncManagerMock.addDeleteEvent, 0);
          });
      });
    });

    describe('processing a DeleteById operation', () => {
      before(() => {
        operationType = OperationType.DeleteById;
      });

      it('should call OfflineRepo.readById()', () => {
        return dataProcessor.process(operation, options)
          .then(() => {
            validateSpyCalls(repoMock.readById, 1, [collection, entityId]);
          });
      });

      it('should call OfflineRepo.deleteById()', () => {
        repoMock.readById = createPromiseSpy(entity);
        return dataProcessor.process(operation, options)
          .then(() => {
            validateSpyCalls(repoMock.deleteById, 1, [collection, entityId, options]);
          });
      });

      it('should call SyncManager.addDeleteEvent()', () => {
        repoMock.readById = createPromiseSpy(entity);
        return dataProcessor.process(operation, options)
          .then(() => {
            validateSpyCalls(syncManagerMock.addDeleteEvent, 1, [collection, entity]);
          });
      });
    });

    describe('processing a Update operation', () => {
      before(() => {
        operationType = OperationType.Update;
      });

      it('should call OfflineRepo.update()', () => {
        return dataProcessor.process(operation, options)
          .then(() => {
            validateSpyCalls(repoMock.update, 1, [collection, operation.data, options]);
          });
      });

      it('should call SyncManager.addUpdateEvent()', () => {
        repoMock.update = createPromiseSpy(entity);
        return dataProcessor.process(operation, options)
          .then(() => {
            validateSpyCalls(syncManagerMock.addUpdateEvent, 1, [collection, entity]);
          });
      });
    });

    describe('processing a Create operation', () => {
      before(() => {
        operationType = OperationType.Create;
      });

      it('should call OfflineRepo.create() without offline metadata when entity has an _id', () => {
        return dataProcessor.process(operation, options)
          .then(() => {
            validateSpyCalls(repoMock.create, 1, [collection, entity, options]);
          });
      });

      it('should call OfflineRepo.create() and add offline metadata when entity has no _id', () => {
        operation = new Operation(OperationType.Create, collection, null, {});
        return dataProcessor.process(operation, options)
          .then(() => {
            const spy = repoMock.create;
            const expectedEntity = addExpectedCreateEntityMeta({});
            delete spy.calls[0].arguments[1]._id; // delete the id, since there is no way to know it
            validateSpyCalls(spy, 1, [collection, expectedEntity, options]);
          });
      });

      it('should call SyncManager.addCreateEvent()', () => {
        repoMock.create = createPromiseSpy(entity);
        return dataProcessor.process(operation, options)
          .then(() => {
            validateSpyCalls(syncManagerMock.addCreateEvent, 1, [collection, entity]);
          });
      });
    });

    describe('processing a DeleteById operation', () => {
      before(() => {
        operationType = OperationType.DeleteById;
      });

      it('should call OfflineRepo.readById()', () => {
        return dataProcessor.process(operation, options)
          .then(() => {
            validateSpyCalls(repoMock.readById, 1, [collection, entityId]);
          });
      });

      it('should call OfflineRepo.deleteById()', () => {
        repoMock.readById = createPromiseSpy(entity);
        return dataProcessor.process(operation, options)
          .then(() => {
            validateSpyCalls(repoMock.deleteById, 1, [collection, entityId, options]);
          });
      });

      it('should call SyncManager.addDeleteEvent() if an entity was deleted', () => {
        repoMock.readById = createPromiseSpy(entity);
        repoMock.deleteById = createPromiseSpy(1);
        return dataProcessor.process(operation, options)
          .then(() => {
            validateSpyCalls(syncManagerMock.addDeleteEvent, 1, [collection, entity]);
          });
      });

      it('should NOT call SyncManager.addDeleteEvent() if an entity was NOT deleted', () => {
        repoMock.readById = createPromiseSpy(entity);
        repoMock.deleteById = createPromiseSpy(0);
        return dataProcessor.process(operation, options)
          .then(() => {
            validateSpyCalls(syncManagerMock.addDeleteEvent, 0);
          });
      });
    });

    const alreadyTestedOps = ['Clear', 'Delete', 'DeleteById', 'Update', 'Create', 'DeleteById'];
    const remainingOps = omit(OperationType, alreadyTestedOps);

    each(remainingOps, (operationType, operationName) => {
      describe(`processing a ${operationName} operation`, () => {
        let operation;
        let options;
        let expectedArgsMap;

        beforeEach(() => {
          operation = new Operation(operationType, collection, new Query(), { someProp: 123 }, 'some id');
          options = { test: true };
          expectedArgsMap = {
            [OperationType.Read]: [collection, operation.query, options],
            [OperationType.ReadById]: [collection, operation.entityId, options],
            [OperationType.Count]: [collection, operation.query, options],
            [OperationType.Group]: [collection, operation.query, options]
          };
        });

        it(`should call OfflineRepo.${operationType}()`, () => {
          return dataProcessor.process(operation, options)
            .then(() => {
              const spy = repoMock[operationType];
              const expectedArgs = expectedArgsMap[operationType];
              validateSpyCalls(spy, 1, expectedArgs);
            });
        });
      });
    });
  });
});
