/* eslint-disable class-methods-use-this */

import { Inject, Injectable } from '@angular/core';
import { collection, getInstance } from '../core/datastore';
import init from '../core/kinvey/init';
import { KinveyConfigToken } from './utils';

@Injectable({
  providedIn: 'root'
})
export class DataStoreService {
  constructor(@Inject(KinveyConfigToken) config: any) {
    init(config);
  }

  collection(collectionName, type?, options?) {
    return collection(collectionName, type, options);
  }

  getInstance(collectionName, type?, options?) {
    return getInstance(collectionName, type, options);
  }
}
