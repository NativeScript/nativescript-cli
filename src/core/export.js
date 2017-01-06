import Aggregation from './aggregation';
import { Client } from './client';
import DataStore, { DataStoreType, FileStore, UserStore } from './datastore';
import { CustomEndpoint } from './endpoint';
import { Acl, Metadata, User } from './entity';
import { AuthorizationGrant, SocialIdentity } from './identity';
import Kinvey from './kinvey';
import Query from './query';

// Export modules
export {
  Acl,
  Aggregation,
  Aggregation as Group,
  AuthorizationGrant,
  Client,
  CustomEndpoint,
  DataStore,
  DataStoreType,
  FileStore as Files,
  Kinvey,
  Metadata,
  Query,
  SocialIdentity,
  User,
  UserStore,
  UserStore as Users,
};

// Export errors
export * from 'common/errors';

// Export request
export * from './request';

// Export utils
export * from 'common/utils';

// Export default
export default Kinvey;
