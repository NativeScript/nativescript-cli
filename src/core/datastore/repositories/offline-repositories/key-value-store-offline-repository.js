import { KinveyError } from '../../../errors';

import { InmemoryOfflineRepository } from './inmemory-offline-repository';

// imported for typings
import { KeyValueStorePersister } from '../../persisters';

export class KeyValueStoreOfflineRepository extends InmemoryOfflineRepository {
  /** @type {KeyValueStorePersister} */
  _persister;

  constructor(persister, promiseQueue) {
    if (!(persister instanceof KeyValueStorePersister)) {
      throw new KinveyError('KeyValueStoreOfflineRepository only works with an instance of KeyValueStorePersister');
    }
    super(persister, promiseQueue);
  }

  _formCollectionKey(collection) {
    // no need to namespace collections - they are in a db per app key
    return collection;
  }

  // protected

  _create(collection, entitiesToSave) {
    return this._persister.write(collection, entitiesToSave);
  }

  _update(collection, entities) {
    return this._persister.write(collection, entities);
  }

  _deleteById(collection, entityId) {
    return this._persister.deleteEntity(collection, entityId);
  }

  // ---- unsupported by parent's persister API

  readById(collection, entityId) {
    return this._persister.readEntity(collection, entityId);
  }

  deleteById(collection, entityId) {
    return this._persister.deleteEntity(collection, entityId);
  }
}
