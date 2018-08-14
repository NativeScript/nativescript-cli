import { use } from './http';
import Acl from './acl';
import Aggregation from './aggregation';
import * as DataStore from './datastore';
import { init } from './client';
import Kmd from './kmd';
import Query from './query';
import * as User from './identity';

export default function sdk(httpAdapter, sessionStore) {
  // Use the provided http adapter and session store
  use(httpAdapter, sessionStore);

  // Return the sdk object
  return {
    init,

    // Acl
    Acl,

    // Aggregation
    Aggregation,

    // DataStore
    DataStore,

    // Kmd
    Kmd,
    Metadata: Kmd, // Deprecated

    // Query
    Query,

    // User
    User
  };
}
