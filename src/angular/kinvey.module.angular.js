import { NgModule } from '@angular/core';
import init from '../kinvey/init';
import DataStoreService from './datastore.service';
import EndpointService from './endpoint.service';
import FilesService from './files.service';
import PingService from './ping.service';
import UserService from './user.service';

class KinveyModule {
  static init(config) {
    init(config);
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

KinveyModule.decorators = [
  { type: NgModule }
];

export default KinveyModule;
