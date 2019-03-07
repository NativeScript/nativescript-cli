import { NgModule } from '@angular/core';
import sdkInit from '../kinvey/init';
import DataStoreService from './datastore';
import EndpointService from './endpoint';
import FilesService from './files';
import PingService from './ping';
import UserService from './user';

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
