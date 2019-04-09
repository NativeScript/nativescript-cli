import {
  getAppVersion,
  setAppVersion,
  logger,
  Acl,
  Aggregation,
  StorageProvider,
  DataStoreType,
  Errors,
  Kmd,
  Query,
  AuthorizationGrant
} from 'kinvey-html5-sdk';
import { DataStoreService } from './datastore.service';
import { EndpointService } from './endpoint.service';
import { FilesService } from './files.service';
import { KinveyModule } from './kinvey.module';
import { PingService } from './ping.service';
import { UserService } from './user.service';

export {
  // Init
  KinveyModule,
  StorageProvider,

  // App Version
  getAppVersion,
  setAppVersion,

  // Logger
  logger,

  // Ping
  PingService,

  // Acl
  Acl,

  // Aggregation
  Aggregation,

  // Custom Endpoint
  EndpointService,

  // DataStore
  DataStoreService,
  DataStoreType,

  // Errors
  Errors,

  // Files
  FilesService,

  // Kmd
  Kmd,
  Kmd as Metadata,

  // Query
  Query,

  // User
  UserService,
  AuthorizationGrant
};
