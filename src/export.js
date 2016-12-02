import Aggregation from './aggregation';
import DataStore, { DataStoreType, FileStore, UserStore } from './datastore';
import { CustomEndpoint } from './endpoint';
import { Acl, Metadata, User } from './entity';
import { AuthorizationGrant, SocialIdentity } from './identity';
import Kinvey from './kinvey';
import Query from './query';
import { Log } from './utils';

// Export modules
export {
  Acl,
  Aggregation,
  Aggregation as Group,
  AuthorizationGrant,
  CustomEndpoint,
  DataStore,
  DataStoreType,
  FileStore as File,
  FileStore as Files,
  Kinvey,
  Log,
  Metadata,
  Query,
  SocialIdentity,
  User,
  UserStore,
  UserStore as Users,
};

// Export errors
export * from './errors';

// Export default
export default Kinvey;
