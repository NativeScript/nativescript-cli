// import { RequestMethod } from '../../request';
import { SyncOperation } from './sync-operation';
import { generateEntityId } from '../utils';

export function groupBy(array, propOrPredicate) {
  return array.reduce((result, elem) => {
    let currVal = elem[propOrPredicate];
    if (typeof propOrPredicate === 'function') {
      currVal = propOrPredicate(elem);
    }
    result[currVal] = result[currVal] || [];
    result[currVal].push(elem);
    return result;
  }, {});
}

// TODO: this exists in... datastore?
const syncOpToPushOpMap = {
  [SyncOperation.Create]: 'create',
  [SyncOperation.Update]: 'update',
  [SyncOperation.Delete]: 'delete'
};

export function syncOpToCrudOp(syncOp) {
  return syncOpToPushOpMap[syncOp];
}

export function buildSyncItem(collection, type, entityId) {
  return {
    _id: generateEntityId(),
    collection,
    entityId,
    state: {
      operation: type
    }
  };
}

export const syncCollectionName = 'kinvey_sync';
export const syncBatchSize = 100;
