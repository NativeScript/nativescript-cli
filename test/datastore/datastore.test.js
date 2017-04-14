import DataStore, { DataStoreType, NetworkStore, CacheStore, SyncStore } from 'src/datastore';
import { KinveyError } from 'src/errors';
import expect from 'expect';
const collection = 'Books';

describe('DataStore', function() {
  describe('constructor', function() {
    it('should throw an error if the DataStore class is tried to be instantiated', function() {
      expect(() => {
        const store = new DataStore(collection);
        return store;
      }).toThrow(KinveyError);
    });
  });

  describe('collection()', function() {
    it('should throw an error if a collection is not provided', function() {
      expect(() => {
        const store = DataStore.collection();
        return store;
      }).toThrow(KinveyError);
    });

    it('should throw an error if the collection is not a string', function() {
      expect(() => {
        const store = DataStore.collection({});
        return store;
      }).toThrow(KinveyError);
    });

    it('should return a NetworkStore', function() {
      const store = DataStore.collection(collection, DataStoreType.Network);
      expect(store).toBeA(NetworkStore);
    });

    it('should return a CacheStore', function() {
      const store = DataStore.collection(collection, DataStoreType.Cache);
      expect(store).toBeA(CacheStore);
    });

    it('should return a SyncStore', function() {
      const store = DataStore.collection(collection, DataStoreType.Sync);
      expect(store).toBeA(SyncStore);
    });

    it('should return a CacheStore by default', function() {
      const store = DataStore.collection(collection);
      expect(store).toBeA(CacheStore);
    });
  });

  describe('getInstance()', function() {
    afterEach(function () {
      expect.restoreSpies();
    });

    it('should call collection()', function() {
      const spy = expect.spyOn(DataStore, 'collection');
      DataStore.getInstance(collection);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('clearCache()', function() {
    it('should clear all the entities in the cache', function() {
      const entity = {};
      const store = new SyncStore(collection);
      return store.save(entity)
        .then(() => {
          return DataStore.clearCache();
        })
        .then(() => {
          return store.find().toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
          return store.pendingSyncEntities();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });
  });
});
