import {
  CacheMiddleware as Html5CacheMiddelware,
  DB as Html5DB,
  DBAdapter
} from 'kinvey-html5-sdk/dist/cache';
import { KinveyError } from 'kinvey-javascript-sdk-core/dist/errors';
import { Log } from 'kinvey-javascript-sdk-core/dist/utils';
import { LocalStorage, SessionStorage } from 'kinvey-html5-sdk/dist/storage';
import { IndexedDB } from 'kinvey-html5-sdk/dist/indexeddb';
import { WebSQL } from 'kinvey-html5-sdk/dist/websql';
import { Device } from './device';
import forEach from 'lodash/forEach';
import isArray from 'lodash/isArray';
const dbCache = {};

export class DB extends Html5DB {
  constructor(name = 'kinvey', adapters = [
    DBAdapter.WebSQL,
    DBAdapter.IndexedDB,
    DBAdapter.LocalStorage,
    DBAdapter.SessionStorage
  ]) {
    super(name);

    if (!isArray(adapters)) {
      adapters = [adapters];
    }

    forEach(adapters, adapter => {
      switch (adapter) {
        case DBAdapter.IndexedDB:
          if (IndexedDB.isSupported()) {
            this.adapter = new IndexedDB(name);
            return false;
          }

          break;
        case DBAdapter.LocalStorage:
          if (LocalStorage.isSupported()) {
            this.adapter = new LocalStorage(name);
            return false;
          }

          break;
        case DBAdapter.SessionStorage:
          if (SessionStorage.isSupported()) {
            this.adapter = new SessionStorage(name);
            return false;
          }

          break;
        case DBAdapter.WebSQL:
          if (WebSQL.isSupported()) {
            this.adapter = new WebSQL(name);
            return false;
          }

          break;
        default:
          Log.warn(`The ${adapter} adapter is is not recognized.`);
      }

      return true;
    });
  }
}

export class CacheMiddleware extends Html5CacheMiddelware {
  constructor(name = 'PhoneGap Cache Middleware') {
    super(name);
  }

  openDatabase(name, adapters = [
    DBAdapter.WebSQL,
    DBAdapter.IndexedDB,
    DBAdapter.LocalStorage,
    DBAdapter.SessionStorage
  ]) {
    if (!name) {
      throw new KinveyError('A name is required to open a database.');
    }

    let db = dbCache[name];

    if (!db) {
      db = new DB(name, adapters);
    }

    return db;
  }

  handle(request) {
    return Device.ready().then(() => super.handle(request));
  }
}
