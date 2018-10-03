import { NgModule } from '@angular/core';
import { use as useHttp } from 'kinvey-js-sdk/lib/http';
import { use as useSessionStore } from 'kinvey-js-sdk/lib/http/session';
import { use as useCacheStore } from 'kinvey-js-sdk/lib/cache';
import { init } from 'kinvey-app';
import * as cacheStore from 'kinvey-indexeddb';

import http from './http';
import * as sessionStore from './session';
import { DataStoreService } from './datastore.service';
import { UserService } from './user.service';

export type KinveyConfig = { [key: string]: any };

@NgModule()
export class KinveyModule {
  static init(config?: KinveyConfig) {
    useHttp(http);
    useSessionStore(sessionStore);
    useCacheStore(cacheStore);
    init(config);
    return {
      ngModule: KinveyModule,
      providers: [
        DataStoreService,
        UserService
      ]
    };
  }
}

export {
  DataStoreService,
  UserService
};
