import { use as useHttpAdapter } from './http';
import Acl from './acl';
import Aggregation from './aggregation';
import { init } from './client';
import Kmd from './kmd';
import Query from './query';
import * as User from './identity';

export default function sdk(httpAdapter) {
  // Use the provided http adapter
  useHttpAdapter(httpAdapter);

  // Return the sdk object
  return {
    init,

    // Acl
    Acl,

    // Aggregation
    Aggregation,

    // Kmd
    Kmd,
    Metadata: Kmd, // Deprecated

    // Query
    Query,

    // User
    User
  };
}
