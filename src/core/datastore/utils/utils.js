import _isEmpty from 'lodash/isEmpty';

import { Client } from '../../client';

export function buildCollectionUrl(collectionName, id, restAction) {
  let result = `appdata/${Client.sharedInstance().appKey}/${collectionName}`;
  if (id) {
    result += `/${id}`;
  }
  if (restAction) {
    result += `/${restAction}`;
  }
  return result;
}

export function generateEntityId(length = 24) {
  const chars = 'abcdef0123456789';
  let objectId = '';

  for (let i = 0, j = chars.length; i < length; i += 1) {
    const pos = Math.floor(Math.random() * j);
    objectId += chars.substring(pos, pos + 1);
  }

  return objectId;
}

export function isNotEmpty(object) {
  return !_isEmpty(object);
}

export function isEmpty(object) {
  return _isEmpty(object);
}

export function isLocalEntity(entity) {
  // not using Metadata class because it mutates the entity
  return !!entity && !!entity._kmd && entity._kmd.local === true;
}

export const browserStorageCollectionsMaster = '__master__';
export const webSqlCollectionsMaster = 'sqlite_master'; // wat? check it
export const webSqlDatabaseSize = 2 * 1024 * 1024;
