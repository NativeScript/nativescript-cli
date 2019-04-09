import assert from 'assert';
import { expect } from 'chai';
import indexedDB from 'fake-indexeddb';
import IndexedDB from './indexeddb.html5';

// Setup window
global.window = {
  indexedDB
};

const DB_NAME = 'test';
const OBJECT_STORE_NAME = 'books';

function uid(size = 10) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < size; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

function randomString(size = 18, prefix = '') {
  return `${prefix}${uid(size)}`;
}

describe('IndexedDB', () => {
  const indexedDB = new IndexedDB(DB_NAME, OBJECT_STORE_NAME);

  beforeEach(() => {
    return indexedDB.clearAll();
  });

  describe('find', () => {
    it('should find all the docs', async () => {
      const docs = [{ _id: randomString() }];
      await indexedDB.save(docs);
      const foundDocs = await indexedDB.find();
      assert.deepStrictEqual(foundDocs, docs);
    });
  });

  describe('findById', () => {
    it('should find the doc by id', async () => {
      const doc = { _id: 'test1' };
      await indexedDB.save(doc);
      const foundDoc = await indexedDB.findById(doc._id);
      assert.deepStrictEqual(foundDoc, doc);
    });
  });

  describe('count', () => {
    it('should count all the docs', async () => {
      const doc = { _id: 'test1' };
      await indexedDB.save(doc);
      const count = await indexedDB.count();
      assert.equal(count, 1);
    });
  });

  describe('save', () => {
    it('should throw an error if any of the docs do not have an _id', async () => {
      const docs = [{ id: randomString() }];
      await expect(indexedDB.save(docs)).to.be.rejectedWith(/Data provided to an operation does not meet requirements\./);
    });

    it('should save the docs', async () => {
      const docs = [{ _id: randomString() }];
      const savedDocs = await indexedDB.save(docs);
      assert.deepStrictEqual(savedDocs, docs);
      const foundDocs = await indexedDB.find();
      assert.deepStrictEqual(foundDocs, docs);
    });

    it('should handle multiple save calls at the same time', async () => {
      const docs1 = [{ _id: randomString() }];
      const docs2 = [{ _id: randomString() }];
      const docs3 = [{ _id: randomString() }];
      const savedDocs = await Promise.all([
        indexedDB.save(docs1),
        indexedDB.save(docs2),
        indexedDB.save(docs3)
      ]);
      assert.deepStrictEqual(savedDocs[0], docs1);
      assert.deepStrictEqual(savedDocs[1], docs2);
      assert.deepStrictEqual(savedDocs[2], docs3);
      const foundDocs = await indexedDB.find();
      foundDocs.sort((a, b) => a._id.localeCompare(b._id));
      const docs = [].concat(docs1, docs2, docs3);
      docs.sort((a, b) => a._id.localeCompare(b._id));
      assert.deepEqual(foundDocs, docs);
    });
  });

  describe('removeById', () => {
    it('should remove the doc that matches the id', async () => {
      const doc = { _id: 'test1' };
      await indexedDB.save(doc);
      const count = await indexedDB.removeById(doc._id);
      assert.equal(count, 1);
    });
  });
});
