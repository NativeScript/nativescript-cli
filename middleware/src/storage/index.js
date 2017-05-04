import { isDefined } from 'kinvey-js-sdk/dist/export';
import KinveyStorage from 'kinvey-js-sdk/dist/request/src/middleware/src/storage';
import SQLite from './src/sqlite';

export default class Storage extends KinveyStorage {
  loadAdapter() {
    return SQLite.load(this.name);
  }
}
