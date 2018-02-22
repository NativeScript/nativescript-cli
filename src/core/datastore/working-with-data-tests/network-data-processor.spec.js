import each from 'lodash/each';
import omit from 'lodash/omit';

import { OperationType, Operation } from '../operations';
import { getRepoMock, validateError, validateSpyCalls } from './utils';
import { mockRequiresIn } from '../require-helper';
import { KinveyError } from '../../errors';
import { Query } from '../../query';

const collection = 'books';

describe('NetworkDataProcessor', () => {
  let repoMock = getRepoMock(); // set only for typings, otherwise set in beforeEach
  let dataProcessor;

  beforeEach(() => {
    repoMock = getRepoMock();
    const repoProviderMock = {
      getNetworkRepository: () => repoMock
    };
    const requireMocks = {
      '../repositories': {
        repositoryProvider: repoProviderMock
      }
    };
    const path = '../processors/network-data-processor';
    const ProxiedNetworkProcessor = mockRequiresIn(__dirname, path, requireMocks, 'NetworkDataProcessor');
    dataProcessor = new ProxiedNetworkProcessor();
  });

  describe('process()', () => {
    it('should return an error if an invalid operation type is passed', () => {
      return dataProcessor.process({})
        .then(() => Promise.reject(new Error('Should not happen')))
        .catch((err) => {
          validateError(err, KinveyError, 'Unexpected operation type');
        });
    });

    const validOperationTypes = omit(OperationType, 'Clear');
    each(validOperationTypes, (operationType, operationName) => {
      describe(`processing a ${operationName} operation`, () => {
        let operation;
        let options;
        let expectedArgsMap;

        beforeEach(() => {
          operation = new Operation(operationType, collection, new Query(), { someProp: 123 }, 'some id');
          options = { test: true };
          expectedArgsMap = {
            [OperationType.Create]: [collection, operation.data, options],
            [OperationType.Read]: [collection, operation.query, options],
            [OperationType.ReadById]: [collection, operation.entityId, options],
            [OperationType.Update]: [collection, operation.data, options],
            [OperationType.Delete]: [collection, operation.query, options],
            [OperationType.DeleteById]: [collection, operation.entityId, options],
            [OperationType.Count]: [collection, operation.query, options],
            [OperationType.Clear]: [collection, operation.query, options],
            [OperationType.Group]: [collection, operation.query, options]
          };
        });

        it(`should call NetworkRepo.${operationType}()`, () => {
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
