import { Client } from '../../client';

import { KeyValuePersister } from './key-value-persister';

export class KeyValueStorePersister extends KeyValuePersister {
  get _databaseName() {
    return Client.sharedInstance().appKey;
  }

  readEntity(collection, entityId) {
    this._throwNotImplementedError(entityId);
  }

  writeEntities(collection, entities) {
    return this._writeEntitiesToPersistance(collection, entities)
      .then((result) => {
        this._invalidateCache(collection);
        return result;
      });
  }

  deleteEntities(collection, entityIds) {
    return this._deleteEntitiesFromPersistance(collection, entityIds)
      .then((result) => {
        this._invalidateCache(collection);
        return result;
      });
  }

  // protected
  _writeEntitiesToPersistance(collection, entities) {
    this._throwNotImplementedError(entities);
  }

  _deleteEntitiesFromPersistance(collection, entityIds) {
    this._throwNotImplementedError(entityIds);
  }
}
