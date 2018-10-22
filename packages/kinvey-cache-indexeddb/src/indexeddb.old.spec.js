import assert from 'assert';
import indexedDB from 'fake-indexeddb';
import { randomString, arraysEqual } from 'kinvey-test-utils';
import * as IndexedDB from './indexeddb.old';

// Setup window
global.window = {
  indexedDB
};

const DB_NAME = 'test';
const OBJECT_STORE_NAME = 'books';

describe('IndexedDB (old)', () => {
  beforeEach(() => {
    return IndexedDB.clearAll(DB_NAME);
  });

  describe('find', () => {
    it('should find all the docs', async () => {
      const docs = [{ _id: randomString() }];
      await IndexedDB.save(DB_NAME, OBJECT_STORE_NAME, docs);
      const foundDocs = await IndexedDB.find(DB_NAME, OBJECT_STORE_NAME);
      assert.deepStrictEqual(foundDocs, docs);
    });
  });

  describe('findById', () => {
    it('should find the doc by id', async () => {
      const doc = { _id: 'test1' };
      await IndexedDB.save(DB_NAME, OBJECT_STORE_NAME, doc);
      const foundDoc = await IndexedDB.findById(DB_NAME, OBJECT_STORE_NAME, doc._id);
      assert.deepStrictEqual(foundDoc, doc);
    });
  });

  describe('count', () => {
    it('should count all the docs', async () => {
      const doc = { _id: 'test1' };
      await IndexedDB.save(DB_NAME, OBJECT_STORE_NAME, doc);
      const count = await IndexedDB.count(DB_NAME, OBJECT_STORE_NAME);
      assert.equal(count, 1);
    });
  });

  describe('save', () => {
    it('should throw an error if any of the docs do not have an _id', async () => {
      const docs = [{ id: randomString() }];
      return assert.rejects(IndexedDB.save(DB_NAME, OBJECT_STORE_NAME, docs), {
        name: 'DataError',
        message: 'Data provided to an operation does not meet requirements.'
      });
    });

    it('should save the docs', async () => {
      const docs = [{ _id: randomString() }];
      const savedDocs = await IndexedDB.save(DB_NAME, OBJECT_STORE_NAME, docs);
      assert.deepStrictEqual(savedDocs, docs);
      const foundDocs = await IndexedDB.find(DB_NAME, OBJECT_STORE_NAME);
      assert.deepStrictEqual(foundDocs, docs);
    });

    it('should handle multiple save calls at the same time', async () => {
      const docs1 = [{ _id: randomString() }];
      const docs2 = [{ _id: randomString() }];
      const docs3 = [{ _id: randomString() }];
      const savedDocs = await Promise.all([
        IndexedDB.save(DB_NAME, OBJECT_STORE_NAME, docs1),
        IndexedDB.save(DB_NAME, OBJECT_STORE_NAME, docs2),
        IndexedDB.save(DB_NAME, OBJECT_STORE_NAME, docs3)
      ]);
      assert.deepStrictEqual(savedDocs[0], docs1);
      assert.deepStrictEqual(savedDocs[1], docs2);
      assert.deepStrictEqual(savedDocs[2], docs3);
      const foundDocs = await IndexedDB.find(DB_NAME, OBJECT_STORE_NAME);
      foundDocs.sort((a, b) => a._id.localeCompare(b._id));
      const docs = [].concat(docs1, docs2, docs3);
      docs.sort((a, b) => a._id.localeCompare(b._id));
      assert.deepEqual(foundDocs, docs);
    });
  });

  describe('removeById', () => {
    it('should remove the doc that matches the id', async () => {
      const doc = { _id: 'test1' };
      await IndexedDB.save(DB_NAME, OBJECT_STORE_NAME, doc);
      const count = await IndexedDB.removeById(DB_NAME, OBJECT_STORE_NAME, doc._id);
      assert.equal(count, 1);
    });
  });
});
