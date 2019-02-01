import { NgModule } from '@angular/core';
import sdkInit from '../kinvey/init';
import DataStoreService from './datastore.service';
import EndpointService from './endpoint.service';
import FilesService from './files.service';
import PingService from './ping.service';
import UserService from './user.service';

@NgModule()
export default class KinveyModule {
  static init(config: any) {
    sdkInit(config);
    return {
      ngModule: KinveyModule,
      providers: [
        DataStoreService,
        EndpointService,
        FilesService,
        PingService,
        UserService
      ]
    };
  }
}
