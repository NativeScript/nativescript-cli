import { Cache, clear as _clear } from 'kinvey-cache';
import { getConfig } from 'kinvey-app';
import { KinveyHeaders } from 'kinvey-http';
import { Query } from 'kinvey-query';
import isString from 'lodash/isString';
import isEmpty from 'lodash/isEmpty';

const QUERY_CACHE_TAG = '_QueryCache';

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
}

export class QueryCache extends DataStoreCache {
  constructor(tag) {
    super(QUERY_CACHE_TAG, tag);
  }

  // eslint-disable-next-line class-methods-use-this
  serializeQuery(query) {
    if (!query) {
      return '';
    }

    if (query.skip > 0 || query.limit < Infinity) {
      return null;
    }

    const queryObject = query.toQueryObject();
    return queryObject && !isEmpty(queryObject) ? JSON.stringify(queryObject) : '';
  }

  async findByKey(key) {
    const query = new Query().equalTo('query', key);
    const docs = await this.find(query);
    return docs.shift();
  }

  async save(query, response) {
    const key = this.serializeQuery(query);

    if (key !== null) {
      const headers = new KinveyHeaders(response.headers);
      let doc = await this.findByKey(key);

      if (!doc) {
        doc = { collectionName: this.collectionName, query: key };
      }

      doc.lastRequest = headers.requestStart;
      return super.save(doc);
    }

    return null;
  }
}


export async function clear() {
  const { appKey } = getConfig();
  await _clear(appKey);
  return null;
}
