import { Promise } from 'es6-promise';

import { Client } from '../../client';
import { NotFoundError, KinveyError } from '../../errors';

import { KeyValuePersister } from './key-value-persister';

export class KeyValueStorePersister extends KeyValuePersister {
  // protected property
  get _storeName() {
    return Client.sharedInstance().appKey;
  }

  readEntity(collection, entityId) {
    this._throwNotImplementedError(entityId);
  }

  writeEntities(collection, entities) {
    return this._writeEntitiesToPersistance(collection, entities)
      .then(() => {
        this._invalidateCache(collection);
        return true;
      });
  }

  deleteEntity(collection, entityId) {
    return this._deleteEntityFromPersistance(collection, entityId)
      .then((deletedCount) => {
        this._invalidateCache(collection);

        if (deletedCount === 0) {
          return Promise.reject(new NotFoundError(`Entity with id ${entityId} was not found`));
        }
        if (deletedCount > 1) {
          return Promise.reject(new KinveyError('Delete by id matched more than one entity'));
        }
        return true;
      });
  }

  // protected
  _writeEntitiesToPersistance(collection, entities) {
    this._throwNotImplementedError(entities);
  }

  _deleteEntityFromPersistance(collection, entityIds) {
    this._throwNotImplementedError(entityIds);
  }
}
