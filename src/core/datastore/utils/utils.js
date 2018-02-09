import _isEmpty from 'lodash/isEmpty';

import { isNonemptyString } from '../../utils';

export const dataStoreTagSeparator = '.';

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

export function isValidDataStoreTag(value) {
  const regexp = /^[a-z0-9-]+$/i;
  return isNonemptyString(value) && regexp.test(value);
}

export function formTaggedCollectionName(collection, tag) {
  if (tag) {
    return `${collection}${dataStoreTagSeparator}${tag}`;
  }
  return collection;
}

export function stripTagFromCollectionName(collectionName) {
  return collectionName.split(dataStoreTagSeparator)[0];
}

export function getTagFromCollectionName(collectionName) {
  return collectionName.split(dataStoreTagSeparator)[1];
}
