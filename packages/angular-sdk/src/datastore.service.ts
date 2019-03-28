import { Inject, Injectable } from '@angular/core';
import { HTML5KinveyConfig, init } from 'kinvey-html5-sdk/lib/init';
import { DataStore, DataStoreType } from 'kinvey-html5-sdk';
import { NetworkStore } from 'kinvey-js-sdk/lib/datastore/networkstore';
import { CacheStore } from 'kinvey-js-sdk/lib/datastore/cachestore';
import { KinveyConfigToken } from './utils';
;

@Injectable({
  providedIn: 'root'
})
export class DataStoreService {
  constructor(@Inject(KinveyConfigToken) config: HTML5KinveyConfig) {
    init(config);
  }

  collection(collectionName: string, type?: DataStoreType, options?: any): NetworkStore | CacheStore {
    return DataStore.collection(collectionName, type, options);
  }
}
