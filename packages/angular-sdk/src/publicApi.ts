import {
  Acl,
  Aggregation,
  StorageProvider,
  DataStoreType,
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
  // Kinvey
  KinveyModule,

  // App Version
  // getAppVersion,
  // setAppVersion,

  // Acl
  Acl,

  // Aggregation
  Aggregation,

  // DataStore
  StorageProvider,
  DataStoreType,
  DataStoreService,

  // Custom Endpoint
  EndpointService,

  // Files
  FilesService,

  // Kmd
  Kmd,
  Kmd as Metadata,

  // Query
  Query,

  // User
  AuthorizationGrant,
  UserService,

  // Ping
  PingService
};
