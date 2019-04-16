import { Acl } from './acl';
import { Aggregation } from './aggregation';
import { collection, getInstance, clearCache, DataStoreType } from './datastore';
import { endpoint } from './endpoint';
import * as Errors from './errors';
import * as Files from './files';
import { init, initialize } from './init';
import { Kmd } from './kmd';
import { logger } from './log';
import { ping } from './ping';
import { Query } from './query';
import { User, AuthorizationGrant} from './user';
import { getAppVersion, setAppVersion } from './http';

const CustomEndpoint = { execute: endpoint };
const DataStore = { collection, getInstance, clearCache };

export {
  // Init
  init,
  initialize,

  // App Version
  getAppVersion,
  setAppVersion,

  // Logger
  logger,

  // Ping
  ping,

  // Acl
  Acl,

  // Aggregation
  Aggregation,

  // Custom Endpoint
  CustomEndpoint,

  // DataStore
  DataStore,
  DataStoreType,

  // Errors
  Errors,

  // Files
  Files,

  // Kmd
  Kmd,
  Kmd as Metadata,

  // Query
  Query,

  // User
  User,
  AuthorizationGrant
};
