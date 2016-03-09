import { DataStore, CacheStore, FileStore, NetworkStore, SyncStore, UserStore } from 'kinvey-sdk-core/stores/datastore';
import { DataStoreType } from 'kinvey-sdk-core/enums';
import chai from 'chai';
const expect = chai.expect;

describe('DataStore', function() {
  describe('getInstance()', function() {
    it('should be a static function', function() {
      expect(DataStore).itself.to.respondTo('getInstance');
    });

    it('should return a CacheStore by default', function() {
      const store = DataStore.getInstance();
      expect(store).to.be.instanceof(CacheStore);
    });

    it('should should accept a name as an argument', function() {
      const name = 'foo';
      const store = DataStore.getInstance(name);
      expect(store.name).to.equal(name);
    });

    it('should return a FileStore when the type is set to DataStoreType.File', function() {
      const store = DataStore.getInstance(null, DataStoreType.File);
      expect(store).to.be.instanceof(FileStore);
    });

    it('should return a NetworkStore when the type is set to DataStoreType.Network', function() {
      const store = DataStore.getInstance(null, DataStoreType.Network);
      expect(store).to.be.instanceof(NetworkStore);
    });

    it('should return a SyncStore when the type is set to DataStoreType.Sync', function() {
      const store = DataStore.getInstance(null, DataStoreType.Sync);
      expect(store).to.be.instanceof(SyncStore);
    });

    it('should return a UserStore when the type is set to DataStoreType.User', function() {
      const store = DataStore.getInstance(null, DataStoreType.User);
      expect(store).to.be.instanceof(UserStore);
    });
  });
});
