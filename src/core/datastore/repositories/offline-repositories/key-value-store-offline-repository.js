import { KinveyError } from '../../../errors';

import { InmemoryOfflineRepository } from './inmemory-offline-repository';
import { KeyValueStorePersister } from '../../persisters';
import { ensureArray } from '../../../utils';

export class KeyValueStoreOfflineRepository extends InmemoryOfflineRepository {
  /** @type {KeyValueStorePersister} */
  _persister;

  constructor(persister, promiseQueue) {
    if (!(persister instanceof KeyValueStorePersister)) {
      throw new KinveyError('KeyValueStoreOfflineRepository only works with an instance of KeyValueStorePersister');
    }
    super(persister, promiseQueue);
  }

  // ---- unsupported by parent's persister API

  readById(collection, entityId) {
    return this._persister.readEntity(collection, entityId);
  }

  deleteById(collection, entityId) {
    return this._persister.deleteEntity(collection, entityId);
  }

  // protected

  _formCollectionKey(collection) {
    // no need to namespace collections - they are in a db per app key
    return collection;
  }

  _create(collection, entities) {
    return this._batchUpsert(collection, entities);
  }

  _update(collection, entities) {
    return this._batchUpsert(collection, entities);
  }

  _deleteById(collection, entityId) {
    return this._persister.deleteEntity(collection, entityId);
  }

  // private

  _batchUpsert(collection, entities) {
    const promises = ensureArray(entities).map((entity) => {
      return this._persister.writeEntity(collection, entity);
    });
    return Promise.all(promises);
  }
}
