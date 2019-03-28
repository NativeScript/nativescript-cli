import { NgModule, ModuleWithProviders } from '@angular/core';
import { KinveyConfig } from 'kinvey-nativescript-sdk';
import { KinveyConfigToken } from './utils';
import { PingService } from './ping.service';

@NgModule()
export class KinveyModule {
  static init(config: KinveyConfig): ModuleWithProviders {
    return {
      ngModule: KinveyModule,
      providers: [
        PingService,
        { provide: KinveyConfigToken, useValue: config }
      ]
    };
  }
}
