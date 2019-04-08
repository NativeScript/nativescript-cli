import isString from 'lodash/isString';
import isEmpty from 'lodash/isEmpty';
import { Storage, Entity } from '../storage';
import { KinveyHttpHeaders, HttpResponse } from '../http';
import { Query } from '../query';
import { getAppKey } from '../kinvey';

const QUERY_CACHE_TAG = '_QueryCache';
const SYNC_CACHE_TAG = 'kinvey_sync';

export function isValidTag(tag: string) {
  const regexp = /^[a-z0-9-]+$/i;
  return isString(tag) && regexp.test(tag);
}

export class DataStoreCache<T extends Entity> extends Storage<T> {
  constructor(collectionName: string, tag?: string) {
    if (tag && !isValidTag(tag)) {
      throw new Error('A tag can only contain letters, numbers, and "-".');
    }

    if (tag) {
      super(getAppKey(), `${collectionName}.${tag}`);
    } else {
      super(getAppKey(), collectionName);
    }
  }

  static clear() {
    return Storage.clear(getAppKey());
  }
}

export interface QueryEntity extends Entity {
  collectionName: string;
  query: string;
  lastRequest: string | null;
}

export class QueryCache extends DataStoreCache<QueryEntity> {
  constructor(tag?: string) {
    super(QUERY_CACHE_TAG, tag);
  }

  serializeQuery(query?: Query) {
    if (!query) {
      return '';
    }

    if ((query.skip && query.skip > 0) || (query.limit && query.limit < Number.MAX_SAFE_INTEGER)) {
      return null;
    }

    const queryObject = query.toQueryObject();
    return queryObject && !isEmpty(queryObject) ? JSON.stringify(queryObject) : '';
  }

  async findByKey(key: string) {
    const query = new Query().equalTo('query', key);
    const docs = await this.find(query);
    return docs.shift();
  }

  async saveQuery(query: Query, response: HttpResponse) {
    const key = this.serializeQuery(query);

    if (key !== null) {
      const headers = new KinveyHttpHeaders(response.headers.toPlainObject());
      let doc = await this.findByKey(key);

      if (!doc) {
        doc = { collectionName: this.collectionName, query: key, lastRequest: null };
      }

      doc.lastRequest = headers.requestStart;
      return super.save(doc);
    }

    return null;
  }
}

export enum SyncEvent {
  Create = 'POST',
  Update = 'PUT',
  Delete = 'DELETE'
};

export interface SyncEntity extends Entity {
  entityId: string;
  entity: Entity;
  collection: string;
  state: {
    operation: SyncEvent;
  }
}

export class SyncCache extends DataStoreCache<SyncEntity> {
  constructor(tag?: string) {
    super(SYNC_CACHE_TAG, tag);
  }
}
