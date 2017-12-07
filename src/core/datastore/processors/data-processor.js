import { KinveyError } from '../../errors';

import { OperationType } from '../operations';
import { ensureArray } from '../../utils';

// imported for type definition
// import { Repository } from '../repositories';
// import { NetworkRepository } from '../repositories';

export class DataProcessor {
  _repoPromise; // protected

  _getRepository() {
    throw new Error('_getRepository not implemented');
  }

  process(operation, options) {
    const { collection, data, query, entityId } = operation;

    switch (operation.type) {
      case OperationType.Create:
        return this._processCreate(collection, data, options);
      case OperationType.Read:
        return this._processRead(collection, query, options);
      case OperationType.ReadById:
        return this._processReadById(collection, entityId, options);
      case OperationType.Update:
        return this._processUpdate(collection, data, options);
      case OperationType.Delete:
        return this._processDelete(collection, query, options);
      case OperationType.DeleteById:
        return this._processDeleteById(collection, entityId, options);
      case OperationType.Count:
        return this._processCount(collection, query, options);
      default: {
        const err = new KinveyError(`Unexpected operation type: ${operation.type}`);
        return Promise.reject(err);
      }
    }
  }

  // TODO: decide on options
  _processCreate(collection, data, options) {
    const isSingle = !Array.isArray(data);
    data = ensureArray(data);
    return this._getRepository()
      .then(repo => repo.create(collection, data, options))
      .then((createdItems) => {
        if (isSingle) {
          return createdItems[0];
        }
        return createdItems;
      });
  }

  _processRead(collection, query, options) {
    return this._getRepository()
      .then(repo => repo.read(collection, query, options));
  }

  _processReadById(collection, entityId, options) {
    return this._getRepository()
      .then(repo => repo.readById(collection, entityId, options));
  }

  _processUpdate(collection, data, options) {
    return this._getRepository()
      .then(repo => repo.update(collection, data, options));
  }

  _processDelete(collection, query, options) {
    return this._getRepository()
      .then(repo => repo.delete(collection, query, options));
  }

  _processDeleteById(collection, entityId, options) {
    return this._getRepository()
      .then(repo => repo.deleteById(collection, entityId, options));
  }

  _processCount(collection, query, options) {
    return this._getRepository()
      .then(repo => repo.count(collection, query, options));
  }
}
