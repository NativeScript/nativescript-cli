import { expect, use } from 'chai';
import * as sinon from 'sinon';
import Cache, { use as useCacheAdapter } from '../src/cache';
import Query from '../src/query';
import Aggregation from '../src/aggregation';

// Use chai-as-promised
use(require('chai-as-promised'));

describe('Cache', () => {
  const dbName = 'test.db';
  const collectionName = 'test';
  const cache = new Cache(dbName, collectionName);

  describe('with no custom cache adapter', () => {
    describe('find()', () => {
      it('should throw an error', () => {
        expect(cache.find()).to.be.rejectedWith(/You must override the default cache adapter\./);
      });
    });

    describe('reduce()', () => {
      it('should throw an error', () => {
        expect(cache.reduce()).to.be.rejectedWith(/You must override the default cache adapter\./);
      });
    });

    describe('count()', () => {
      it('should throw an error', () => {
        expect(cache.count()).to.be.rejectedWith(/You must override the default cache adapter\./);
      });
    });

    describe('findById()', () => {
      it('should throw an error', () => {
        expect(cache.findById()).to.be.rejectedWith(/You must override the default cache adapter\./);
      });
    });

    describe('save()', () => {
      it('should throw an error', () => {
        expect(cache.save([{}])).to.be.rejectedWith(/You must override the default cache adapter\./);
      });
    });

    describe('remove()', () => {
      it('should throw an error', () => {
        expect(cache.remove()).to.be.rejectedWith(/You must override the default cache adapter\./);
      });
    });

    describe('removeById()', () => {
      it('should throw an error', () => {
        expect(cache.removeById()).to.be.rejectedWith(/You must override the default cache adapter\./);
      });
    });

    describe('clear()', () => {
      it('should throw an error', () => {
        expect(cache.clear()).to.be.rejectedWith(/You must override the default cache adapter\./);
      });
    });
  });

  describe('with custom cache adapter', () => {
    const MemoryAdapter = {
      find() { },
      reduce() { },
      count() { },
      findById() { },
      save() { },
      remove() { },
      removeById() { },
      clear() { }
    };

    before(() => {
      useCacheAdapter(MemoryAdapter);
    });

    after(() => {
      useCacheAdapter(null);
    });

    describe('find()', () => {
      it('should call find() on the adapter', () => {
        const query = new Query();
        const spy = sinon.spy(MemoryAdapter, 'find');
        cache.find(query);
        expect(spy.calledOnceWithExactly(dbName, collectionName, query)).to.be.true;
        spy.restore();
      });
    });

    describe('reduce()', () => {
      it('should call reduce() on the adapter', () => {
        const aggregation = new Aggregation();
        const spy = sinon.spy(MemoryAdapter, 'reduce');
        cache.reduce(aggregation);
        expect(spy.calledOnceWithExactly(dbName, collectionName, aggregation)).to.be.true;
        spy.restore();
      });
    });

    describe('count()', () => {
      it('should call count() on the adapter', () => {
        const query = new Query();
        const spy = sinon.spy(MemoryAdapter, 'count');
        cache.count(query);
        expect(spy.calledOnceWithExactly(dbName, collectionName, query)).to.be.true;
        spy.restore();
      });
    });

    describe('findById()', () => {
      it('should call findById() on the adapter', () => {
        const id = 1;
        const spy = sinon.spy(MemoryAdapter, 'findById');
        cache.findById(id);
        expect(spy.calledOnceWithExactly(dbName, collectionName, id)).to.be.true;
        spy.restore();
      });
    });

    describe('save()', () => {
      it('should not call save() on the adapter', () => {
        const spy = sinon.spy(MemoryAdapter, 'save');
        cache.save();
        expect(spy.notCalled).to.be.true;
        spy.restore();
      });

      it('should call save() on the adapter', () => {
        const docs = [{ _id: 1 }];
        const spy = sinon.spy(MemoryAdapter, 'save');
        cache.save(docs);
        expect(spy.calledOnceWithExactly(dbName, collectionName, docs)).to.be.true;
        spy.restore();
      });

      it('should save a single doc', async () => {
        const doc = { _id: 1 };
        const savedDoc = await cache.save(doc);
        expect(savedDoc).to.deep.equal(doc);
      });

      it('should generate an _id for the doc', async () => {
        const doc = {};
        const savedDoc = await cache.save(doc);
        expect(savedDoc).to.have.property('_id');
        expect(savedDoc).to.have.deep.property('_kmd', { local: true });
      });
    });

    describe('remove()', () => {
      it('should call remove() on the adapter', () => {
        const query = new Query();
        const spy = sinon.spy(MemoryAdapter, 'remove');
        cache.remove(query);
        expect(spy.calledOnceWithExactly(dbName, collectionName, query)).to.be.true;
        spy.restore();
      });
    });

    describe('removeById()', () => {
      it('should call removeById() on the adapter', () => {
        const id = 1;
        const spy = sinon.spy(MemoryAdapter, 'removeById');
        cache.removeById(id);
        expect(spy.calledOnceWithExactly(dbName, collectionName, id)).to.be.true;
        spy.restore();
      });
    });

    describe('clear()', () => {
      it('should call clear() on the adapter', () => {
        const spy = sinon.spy(MemoryAdapter, 'clear');
        cache.clear();
        expect(spy.calledOnceWithExactly(dbName, collectionName, undefined)).to.be.true;
        spy.restore();
      });
    });
  });
});
