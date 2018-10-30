
import expect from 'expect';
import { collection, clearCache, DataStoreType } from './index';
import { NetworkStore } from './networkstore';
import { CacheStore } from './cachestore';
import { KinveyError } from '../../errors';
import { init } from 'kinvey-app';
import { randomString } from 'kinvey-test-utils';
import { register as registerCache} from 'kinvey-cache-memory';
const collectionName = 'Books';
var client;

describe('DataStore', () => {
  before(() => {
    registerCache();
    client = init({
      appKey: randomString(),
      appSecret: randomString(),
      apiHostname: "https://baas.kinvey.com",
      micHostname: "https://auth.kinvey.com"
    });
  });

  describe('constructor', () => {// There is no DataStore class
    it('should throw an error if the DataStore class is tried to be instantiated', () => {
      expect(() => {
        const store = new DataStore(collectionName);
        return store;
      }).toThrow(KinveyError);
    });
  });

  describe('collection()', () => {
    it('should throw an error if a collection is not provided', () => {// Errors should be reverted
      expect(() => {
        const store = collection();
        return store;
      }).toThrow(KinveyError);
    });

    it('should throw an error if the collection is not a string', () => {// Errors should be reverted
      expect(() => {
        const store = collection({});
        return store;
      }).toThrow(KinveyError);
    });

    describe('tagging', () => {//No tag value validation, error not thrown when tag is set to Network store
      describe('a NetworkStore', () => {
        it('should throw an error', () => {
          expect(() => {
            collection(collectionName, DataStoreType.Network, { tag: 'any-tag' });
          }).toThrow();
        });
      });

      const offlineCapableStoreTypes = [DataStoreType.Cache, DataStoreType.Sync];
      offlineCapableStoreTypes.forEach((storeType) => {
        describe(`a ${storeType}Store`, () => {
          it('should throw an error if the tag is not a string', () => {
            expect(() => {
              collection(collectionName, storeType, { tag: {} });
            }).toThrow();
          });

          it('should throw an error if the tag is an emptry string', () => {
            expect(() => {
              collection(collectionName, storeType, { tag: '' });
            }).toThrow();
          });

          it('should throw an error if the tag is a whitespace string', () => {
            expect(() => {
              collection(collectionName, storeType, { tag: '    \n  ' });
            }).toThrow();
          });

          it('should throw an error if the tag contains invalid characters', () => {
            expect(() => {
              collection(collectionName, storeType, { tag: '  %  sometag  !' });
            }).toThrow();
          });

          it('should work if the provided tag is valid', () => {
            collection(collectionName, storeType, { tag: 'some-valid-tag' });
          });
        });
      });
    });

    it('should return a NetworkStore', () => {
      const store = collection(collectionName, DataStoreType.Network);
      expect(store).toBeA(NetworkStore);
    });

    it('should return a CacheStore with autoSync === true', () => {
      const store = collection(collectionName, DataStoreType.Cache);
      expect(store).toBeA(CacheStore);
      expect(store.autoSync).toEqual(true);
    });

    it('should return a CacheStore with autoSync === false', () => {
      const store = collection(collectionName, DataStoreType.Sync);
      expect(store).toBeA(CacheStore);
      expect(store.autoSync).toEqual(false);
    });

    it('should return a CacheStore by default', () => {
      const store = collection(collectionName);
      expect(store).toBeA(CacheStore);
      expect(store.autoSync).toEqual(true);
    });
  });

  describe('getInstance()', () => { // No getInstance function
    afterEach(function () {
      expect.restoreSpies();
    });

    it('should call collection()', () => {
      const spy = expect.spyOn(DataStore, 'collection');
      DataStore.getInstance(collectionName);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('clearCache()', () => {
    it('should clear all the entities in the cache', () => {//clearCache does not seem to clear cache
      const entity = {};
      const store = new CacheStore(client.appKey, collectionName, null, {autoSync: false});
      return store.save(entity)
        .then(() => {
          return clearCache();
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
