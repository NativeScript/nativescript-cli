import { KinveyError } from '../../../errors';

import { InmemoryOfflineRepository } from './inmemory-offline-repository';
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

  // ---- unsupported by parent's persister API

  readById(collection, entityId) {
    return this._persister.readEntity(collection, entityId);
  }

  deleteById(collection, entityId) {
    return this._persister.deleteEntity(collection, entityId)
      .then(didDelete => (didDelete ? 1 : 0));
  }

  // protected

  // TODO: is this ok from OOD perspective
  _formCollectionKey(collection) {
    // no need to namespace collections - they are in a db per app key
    return collection;
  }

  _getAllCollections() {
    return this._persister.getKeys();
  }

  create(collection, entities) {
    return this._batchUpsert(collection, entities);
  }

  update(collection, entities) {
    return this._batchUpsert(collection, entities);
  }

  // private

  _batchUpsert(collection, entities) {
    return this._persister.writeEntities(collection, entities)
      .then(() => entities);
  }
}
