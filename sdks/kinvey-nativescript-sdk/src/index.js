import { Acl } from 'kinvey-acl';
// import { Aggregation } from 'kinvey-aggregation';
// import * as DataStore from 'kinvey-datastore';
// import { Kmd } from 'kinvey-kmd';
// import { Query } from 'kinvey-query';
// import * as Files from 'kinvey-files';
// import { endpoint } from 'kinvey-endpoint';
import * as App from './app';
// import { User } from './user';

// SDK
const SDK = {
  // Acl
  Acl,

  // Aggregation
  // Aggregation,

  // // DataStore
  // DataStore,
  // DataStoreType: DataStore.DataStoreType,

  // // Custom Endpoint
  // CustomEndpoint: endpoint,

  // // Files
  // Files,

  // // Kmd
  // Kmd,
  // Metadata: Kmd,

  // // Query
  // Query,

  // // User
  // User,
  // AuthorizationGrant: User.AuthorizationGrant
};

// Flatten App onto SDK
Object.keys(App).forEach((key) => {
  SDK[key] = App[key];
});

// Export
module.exports = SDK;
