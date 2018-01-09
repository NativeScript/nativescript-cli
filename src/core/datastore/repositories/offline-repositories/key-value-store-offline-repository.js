import { InmemoryOfflineRepository } from './inmemory-offline-repository';

// imported for typings
import { KeyValueStorePersister } from '../../persisters';

export class KeyValueStoreOfflineRepository extends InmemoryOfflineRepository {
  /** @type {KeyValueStorePersister} */
  _persister;

  _formCollectionKey(collection) {
    // no need to namespace collections - they are in a db per app key
    return collection;
  }

  readById(collection, entityId) {
    return this._persister.readEntity(collection, entityId);
  }
}
