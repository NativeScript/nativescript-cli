import { NgModule, ModuleWithProviders, InjectionToken } from '@angular/core';
import { HelloService } from './hello.service';

export const KINVEY_CONFIG_TOKEN = new InjectionToken('KINVEY_CONFIG');

@NgModule()
export class KinveyModule {
  static init(config: any): ModuleWithProviders {
    return {
      ngModule: KinveyModule,
      providers: [
        HelloService,
        { provide: KINVEY_CONFIG_TOKEN, useValue: config }
      ]
    }
  }
}
