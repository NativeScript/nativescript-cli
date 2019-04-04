import { NgModule, ModuleWithProviders } from '@angular/core';
import { KinveyConfigToken } from './utils';
import { DataStoreService } from './datastore.service';
import { EndpointService } from './endpoint.service';
import { FilesService } from './files.service';
import { PingService } from './ping.service';
import { UserService } from './user.service';

@NgModule()
export class KinveyModule {
  static init(config?: any): ModuleWithProviders {
    return {
      ngModule: KinveyModule,
      providers: [
        DataStoreService,
        EndpointService,
        FilesService,
        PingService,
        UserService,
        { provide: KinveyConfigToken, useValue: config }
      ]
    };
  }
}
