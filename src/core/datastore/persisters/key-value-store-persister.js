import { Client } from '../../client';

import { KeyValuePersister } from './key-value-persister';

export class KeyValueStorePersister extends KeyValuePersister {
  get _databaseName() {
    return Client.sharedInstance().appKey;
  }

  readEntity(collection, entityId) {
    this._throwNotImplementedError(entityId);
  }

  writeEntity(collection, entity) {
    return this._writeEntityToPersistance(collection, entity)
      .then((result) => {
        this._invalidateCache(collection);
        return result;
      });
  }

  deleteEntity(collection, entityId) {
    return this._deleteEntityFromPersistance(collection, entityId)
      .then((result) => {
        this._invalidateCache(collection);
        return result;
      });
  }

  // protected
  _writeEntityToPersistance(collection, entity) {
    this._throwNotImplementedError(entity);
  }

  _deleteEntityFromPersistance(collection, entityId) {
    this._throwNotImplementedError(entityId);
  }
}
