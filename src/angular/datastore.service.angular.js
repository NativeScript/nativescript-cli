/* eslint-disable class-methods-use-this */

import { Injectable } from '@angular/core';
import { collection, getInstance, clear, clearCache } from '../datastore';

class DataStoreService {
  collection(...args) {
    return collection(...args);
  }

  getInstance(...args) {
    return getInstance(...args);
  }

  clear(...args) {
    return clear(...args);
  }

  clearCache(...args) {
    return clearCache(...args);
  }
}

DataStoreService.decorators = [
  { type: Injectable }
];

export default DataStoreService;
