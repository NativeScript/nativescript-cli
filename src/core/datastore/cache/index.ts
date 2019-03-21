import isString from 'lodash/isString';
import isEmpty from 'lodash/isEmpty';
import Cache from '../../cache';
import { get as getConfig } from '../../kinvey/config';
import { KinveyHeaders } from '../../http/headers';
import Query from '../../query';
import { get as getStore } from './store';

const QUERY_CACHE_TAG = '_QueryCache';
const SYNC_CACHE_TAG = 'kinvey_sync';

export function isValidTag(tag) {
  const regexp = /^[a-z0-9-]+$/i;
  return isString(tag) && regexp.test(tag);
}

export class DataStoreCache extends Cache {
  constructor(collectionName?, tag?) {
    const { appKey } = getConfig();

    if (tag && !isValidTag(tag)) {
      throw new Error('A tag can only contain letters, numbers, and "-".');
    }

    if (tag) {
      super(getStore(appKey, `${collectionName}.${tag}`));
    } else {
      super(getStore(appKey, collectionName));
    }
  }
}

export class QueryCache extends DataStoreCache {
  constructor(tag?) {
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

  async saveQuery(query, response) {
    const key = this.serializeQuery(query);

    if (key !== null) {
      const headers = new KinveyHeaders(response.headers);
      let doc = await this.findByKey(key);

      if (!doc) {
        // TODO fix
        doc = { query: key };
      }

      doc.lastRequest = headers.requestStart;
      return super.save(doc);
    }

    return null;
  }
}

export class SyncCache extends DataStoreCache {
  constructor(tag?) {
    super(SYNC_CACHE_TAG, tag);
  }
}
