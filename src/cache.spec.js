import { expect } from 'chai';
import * as sinon from 'sinon';
import Query from './query';
import Aggregation from './aggregation';
import Cache from './cache';
import Memory from './datastore/cache/memory';

describe('Cache', () => {
  const dbName = 'test.db';
  const collectionName = 'test';
  const MemoryAdapter = new Memory(dbName, collectionName);
  const cache = new Cache(MemoryAdapter);

  describe('with no custom cache adapter', () => {
    describe('find()', () => {
      it('should throw an error', async () => {
        await expect(cache.count()).to.be.rejectedWith(/You must override the default cache adapter\./);
      });
    });

    describe('reduce()', () => {
      it('should throw an error', async () => {
        await expect(cache.reduce()).to.be.rejectedWith(/Invalid aggregation. It must be an instance of the Aggregation class\./);
      });
    });

    describe('count()', () => {
      it('should throw an error', async () => {
        await expect(cache.count()).to.be.rejectedWith(/You must override the default cache adapter\./);
      });
    });

    describe('findById()', () => {
      it('should throw an error', async () => {
        await expect(cache.findById()).to.be.rejectedWith(/You must override the default cache adapter\./);
      });
    });

    describe('save()', () => {
      it('should throw an error', async () => {
        await expect(cache.save([{}])).to.be.rejectedWith(/You must override the default cache adapter\./);
      });
    });

    describe('remove()', () => {
      it('should throw an error', async () => {
        await expect(cache.remove()).to.be.rejectedWith(/You must override the default cache adapter\./);
      });
    });

    describe('removeById()', () => {
      it('should throw an error', async () => {
        await expect(cache.removeById()).to.be.rejectedWith(/You must override the default cache adapter\./);
      });
    });

    describe('clear()', () => {
      it('should throw an error', async () => {
        await expect(cache.clear()).to.be.rejectedWith(/You must override the default cache adapter\./);
      });
    });
  });

  describe('with custom cache adapter', () => {
    describe('find()', () => {
      it('should call find() on the adapter', () => {
        const query = new Query();
        const spy = sinon.spy(cache, 'find');
        cache.find(query);
        expect(spy.calledOnceWithExactly(query)).to.be.true;
        spy.restore();
      });
    });

    describe('reduce()', () => {
      it('should call reduce() on the adapter', () => {
        const aggregation = new Aggregation();
        const spy = sinon.spy(cache, 'reduce');
        cache.reduce(aggregation);
        expect(spy.calledOnceWithExactly(aggregation)).to.be.true;
        spy.restore();
      });
    });

    describe('count()', () => {
      it('should call count() on the adapter', () => {
        const query = new Query();
        const spy = sinon.spy(cache, 'count');
        cache.count(query);
        expect(spy.calledOnceWithExactly(query)).to.be.true;
        spy.restore();
      });
    });

    describe('findById()', () => {
      it('should call findById() on the adapter', () => {
        const id = 1;
        const spy = sinon.spy(cache, 'findById');
        cache.findById(id);
        expect(spy.calledOnceWithExactly(id)).to.be.true;
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
        const spy = sinon.spy(cache, 'save');
        cache.save(docs);
        expect(spy.calledOnceWithExactly(docs)).to.be.true;
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
        const spy = sinon.spy(cache, 'remove');
        cache.remove(query);
        expect(spy.calledOnceWithExactly(query)).to.be.true;
        spy.restore();
      });
    });

    describe('removeById()', () => {
      it('should call removeById() on the adapter', () => {
        const id = 1;
        const spy = sinon.spy(cache, 'removeById');
        cache.removeById(id);
        expect(spy.calledOnceWithExactly(id)).to.be.true;
        spy.restore();
      });
    });

    describe('clear()', () => {
      it('should call clear() on the adapter', () => {
        const spy = sinon.spy(cache, 'clear');
        cache.clear();
        expect(spy.calledOnceWithExactly()).to.be.true;
        spy.restore();
      });
    });
  });
});
