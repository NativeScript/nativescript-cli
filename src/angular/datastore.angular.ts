/* eslint-disable class-methods-use-this */

import { Injectable } from '@angular/core';
import { collection, getInstance, clear, clearCache } from '../datastore';

@Injectable({
  providedIn: 'root'
})
export default class DataStoreService {
  collection(...args) {
    return collection(...args);
  }

  getInstance(...args) {
    return getInstance(...args);
  }

  clear() {
    return clear();
  }

  clearCache() {
    return clearCache();
  }
}
