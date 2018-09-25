import { Injectable } from '@angular/core';
import { DataStore, DataStoreType } from './sdk';

@Injectable({
  providedIn: 'root'
})
export class KinveyDataStoreService {
  get DataStoreType() {
    return DataStoreType;
  }

  collection(collectionName: string, type?, options?) {
    return DataStore.collection(collectionName, type, options);
  }

  clearCache() {
    return DataStore.clearCache();
  }
}
