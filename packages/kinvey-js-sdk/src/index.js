import { use as useHttp } from './http';
import { use as useSessionStore } from './http/session';
import { use as useCacheStore } from './cache';
import Acl from './acl';
import Aggregation from './aggregation';
import * as DataStore from './datastore';
import { init } from './client';
import Kmd from './kmd';
import Query from './query';
import { use as usePopup } from './identity/popup';
import { AuthorizationGrant } from './identity/mic';
import * as User from './identity/user';

export default function sdk(http, sessionStore, popup, cacheStore) {
  // Use the provided http adapter
  useHttp(http);

  // Use the provided session store
  useSessionStore(sessionStore);

  // Use the provided popup
  usePopup(popup);

  // Use the provided cache store
  useCacheStore(cacheStore);

  // Return the sdk object
  return {
    init,

    // Acl
    Acl,

    // Aggregation
    Aggregation,

    // DataStore
    DataStore,
    DataStoreType: DataStore.DataStoreType,

    // Kmd
    Kmd,
    Metadata: Kmd,

    // Query
    Query,

    // User
    User,
    AuthorizationGrant
  };
}
