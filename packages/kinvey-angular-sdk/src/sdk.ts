import sdk from 'kinvey-js-sdk';
import http from './http';
import * as sessionStore from './session';
import popup from './popup';
import * as cacheStore from './indexeddb';

export const {
  init,
  Acl,
  Aggregation,
  DataStore,
  DataStoreType,
  Kmd,
  Metadata,
  Query,
  User,
  AuthorizationGrant
} = sdk(http, sessionStore, popup, cacheStore);
