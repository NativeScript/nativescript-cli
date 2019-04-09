import expect from 'expect';
import KinveyError from '../errors/kinvey';
import init from '../kinvey/init';
import { collection, getInstance, DataStoreType } from './index';
import { CacheStore } from './cachestore';
import { NetworkStore } from './networkstore';

const collectionName = 'Books';

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

describe('DataStore', () => {
  before(() => {
    init({
      appKey: randomString(),
      appSecret: randomString(),
      apiHostname: "https://baas.kinvey.com",
      micHostname: "https://auth.kinvey.com"
    });
  });

  describe('constructor', () => {//TODO:  There is no DataStore class
    it('should throw an error if the DataStore class is tried to be instantiated', () => {
      expect(() => {
        const store = new DataStore(collectionName);
        return store;
      }).toThrow(KinveyError);
    });
  });

  describe('collection()', () => {
    it('should throw an error if a collection is not provided', () => {
      expect(() => {
        const store = collection();
        return store;
      }).toThrow(KinveyError);
    });

    it('should throw an error if the collection is not a string', () => {
      expect(() => {
        const store = collection({});
        return store;
      }).toThrow(KinveyError);
    });

    describe('tagging', () => {
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

  describe('getInstance()', () => {//TODO Failing
    it('should call collection()', () => {
      const spy = expect.createSpy(collection);
      getInstance(collectionName);
      expect(spy).toHaveBeenCalled();
      spy.restore();
    });
  });

  describe('clear()', () => {
    it('should clear all the entities in the cache', () => {
      const entity = {};
      const store = new CacheStore(collectionName, { autoSync: false });
      return store.save(entity)
        .then(() => {
          return store.clear();
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
