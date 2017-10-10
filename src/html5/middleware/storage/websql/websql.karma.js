/* eslint-env mocha */
/* eslint-disable consistent-return */

import { expect } from 'chai';
import { WebSQLAdapter } from './websql';
import { randomString } from '../../../../core/utils';

describe('WebSQL', () => {
  let storageAdapter;

  before(() => {
    return WebSQLAdapter.load(randomString())
      .then((adapter) => {
        storageAdapter = adapter;
      });
  });

  describe('save()', () => {
    it('should save data', () => {
      if (storageAdapter) {
        const collection = randomString();
        const data = { _id: randomString() };
        return storageAdapter.save(collection, data)
          .then(() => {
            return storageAdapter.find(collection);
          })
          .then((storedData) => {
            expect(storedData).to.deep.equal([data]);
          });
      }
    });

    it('should save an array of data', () => {
      if (storageAdapter) {
        const collection = randomString();
        const data = [{ _id: randomString() }, { _id: randomString() }];
        return storageAdapter.save(collection, data)
          .then(() => {
            return storageAdapter.find(collection);
          })
          .then((storedData) => {
            expect(storedData).to.deep.equal(data);
          });
      }
    });

    it('should overwrite saved data', () => {
      if (storageAdapter) {
        const collection = randomString();
        const data = { _id: randomString() };
        const updateData = { _id: data._id, title: randomString() };
        return storageAdapter.save(collection, data)
          .then(() => {
            return storageAdapter.save(collection, updateData);
          })
          .then(() => {
            return storageAdapter.find(collection);
          })
          .then((storedData) => {
            expect(storedData).to.deep.equal([updateData]);
          });
      }
    });

    it('should add data to existing data', () => {
      if (storageAdapter) {
        const collection = randomString();
        const data = { _id: randomString() };
        const data2 = { _id: randomString(), title: randomString() };
        return storageAdapter.save(collection, data)
          .then(() => {
            return storageAdapter.save(collection, data2);
          })
          .then(() => {
            return storageAdapter.find(collection);
          })
          .then((storedData) => {
            expect(storedData).to.deep.equal([data, data2]);
          });
      }
    });
  });
});
