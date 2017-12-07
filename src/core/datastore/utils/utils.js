import { Metadata } from '../../metadata';
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
  return !!object && (object.length > 0 || Object.keys(object).length > 0);
}

export function isEmpty(object) {
  return !isNotEmpty(object);
}

export function isLocalEntity(entity) {
  const metadata = new Metadata(entity);
  return metadata.isLocal();
}
