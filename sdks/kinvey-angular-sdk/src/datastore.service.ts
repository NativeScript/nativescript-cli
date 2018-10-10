import { Injectable } from '@angular/core';
import { collection, clearCache } from 'kinvey-js-sdk/lib/datastore';

@Injectable({
  providedIn: 'root'
})
export class DataStoreService {
  collection(collectionName: string, type?, options?) {
    return collection(collectionName, type, options);
  }

  clearCache() {
    return clearCache();
  }
}
