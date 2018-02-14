import expect from 'expect';

import { randomString } from '../../utils';

import { OperationType } from '../operations';
import { DataStoreType } from '../datastore';
import { Query } from '../../query';
import { Aggregation } from '../../aggregation';

import { validateOperationObj, datastoreFactory } from './utils';

const collection = 'books';
const dataStoreTypes = [DataStoreType.Sync, DataStoreType.Cache, DataStoreType.Network];

/**
 * @param {expect.Spy} spy
 * @param {string} type
 * @param {string} collection
 * @param {Query} query
 * @param {object} data
 * @param {string} entityId
 */
const validateSpyCall = (spy, ...args) => {
  expect(spy.calls.length).toBe(1);
  const firstCall = spy.calls[0];
  expect(firstCall.arguments.length).toBe(2);
  const operation = firstCall.arguments[0];
  const options = firstCall.arguments[1];
  expect(options).toContainKeys(['test']);
  validateOperationObj(operation, ...args);
};

describe('Data stores delegate correctly to data processor', () => {
  const dataProcessorMock = { process: () => { } };

  dataStoreTypes.forEach((type) => {
    describe(`${type}Store`, () => {
      /** @type {CacheStore} */ // just for auto completion
      let store;
      /** @type {expect.Spy} */
      let spy;
      let testOptions;

      beforeEach(() => {
        expect.restoreSpies();
        spy = expect.spyOn(dataProcessorMock, 'process')
          .andReturn(Promise.resolve());
        const buildStore = datastoreFactory[type];
        store = buildStore(collection, dataProcessorMock);
        testOptions = { test: randomString() };
      });

      // methods, common for all stores

      it('find()', () => {
        const query = new Query();
        return store.find(query, testOptions).toPromise()
          .then(() => {
            validateSpyCall(spy, OperationType.Read, collection, query);
          });
      });

      it('findById', () => {
        const id = randomString();
        return store.findById(id, testOptions).toPromise()
          .then(() => {
            validateSpyCall(spy, OperationType.ReadById, collection, undefined, undefined, id);
          });
      });

      it('group', () => {
        const aggregation = new Aggregation();
        return store.group(aggregation, testOptions).toPromise()
          .then(() => {
            validateSpyCall(spy, OperationType.Group, collection, aggregation);
          });
      });

      it('count', () => {
        const query = new Query();
        return store.count(query, testOptions).toPromise()
          .then(() => {
            validateSpyCall(spy, OperationType.Count, collection, query);
          });
      });

      it('create', () => {
        const entity = { test: true };
        return store.create(entity, testOptions)
          .then(() => {
            validateSpyCall(spy, OperationType.Create, collection, undefined, entity);
          });
      });

      it('update', () => {
        const entity = { _id: randomString(), test: true };
        return store.update(entity, testOptions)
          .then(() => {
            validateSpyCall(spy, OperationType.Update, collection, undefined, entity);
          });
      });

      it('save with _id', () => {
        const entity = { _id: randomString(), test: true };
        return store.save(entity, testOptions)
          .then(() => {
            validateSpyCall(spy, OperationType.Update, collection, undefined, entity);
          });
      });

      it('save without _id', () => {
        const entity = { test: true };
        return store.save(entity, testOptions)
          .then(() => {
            validateSpyCall(spy, OperationType.Create, collection, undefined, entity);
          });
      });

      it('remove', () => {
        const query = new Query();
        return store.remove(query, testOptions)
          .then(() => {
            validateSpyCall(spy, OperationType.Delete, collection, query);
          });
      });

      it('removeById', () => {
        const id = randomString();
        return store.removeById(id, testOptions)
          .then(() => {
            validateSpyCall(spy, OperationType.DeleteById, collection, undefined, undefined, id);
          });
      });

      if (type !== DataStoreType.Network) {
        it('clear', () => {
          const query = new Query();
          return store.clear(query, testOptions)
            .then(() => {
              validateSpyCall(spy, OperationType.Clear, collection, query);
            });
        });
      }
    });
  });
});
