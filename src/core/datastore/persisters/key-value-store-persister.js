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
    return this._readEntityFromPersistance(collection, entityId)
      .then((entity) => {
        if (!entity) {
          return Promise.reject(this._getEntityNotFoundError(collection, entityId));
        }
        return entity;
      });
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
          return Promise.reject(this._getEntityNotFoundError(collection, entityId));
        }
        if (deletedCount > 1) {
          return Promise.reject(new KinveyError('Delete by id matched more than one entity'));
        }
        return true;
      });
  }

  // protected

  _readEntityFromPersistance(collection, entityIds) {
    this._throwNotImplementedError(entityId);
  }

  _writeEntitiesToPersistance(collection, entities) {
    this._throwNotImplementedError(entities);
  }

  _deleteEntityFromPersistance(collection, entityIds) {
    this._throwNotImplementedError(entityIds);
  }

  _getEntityNotFoundError(collection, id) {
    return new NotFoundError(`An entity with _id = ${id} was not found in the ${collection}`
      + ` collection on the ${this._storeName} IndexedDB database.`);
  }
}
