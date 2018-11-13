import { Cache, clear as _clear } from 'kinvey-cache';
import { getConfig } from 'kinvey-app';
import { NotFoundError } from 'kinvey-errors';
import isString from 'lodash/isString';

export function isValidTag(tag) {
  const regexp = /^[a-z0-9-]+$/i;
  return isString(tag) && regexp.test(tag);
}

export class DataStoreCache extends Cache {
  constructor(collectionName, tag) {
    const { appKey } = getConfig();

    if (tag && !isValidTag(tag)) {
      throw new Error('A tag can only contain letters, numbers, and "-".');
    }

    if (tag) {
      super(appKey, `${collectionName}.${tag}`);
    } else {
      super(appKey, collectionName);
    }
  }

  // async findById(id) {
  //   const doc = await super.findById(id);

  //   if (!doc) {
  //     throw new NotFoundError();
  //   }

  //   return doc;
  // }
}

export async function clear() {
  const { appKey } = getConfig();
  await _clear(appKey);
  return null;
}
