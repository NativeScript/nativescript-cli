import { register as _register } from 'kinvey-cache';
import * as IndexedDB from './indexeddb.old';

export function register() {
  _register(IndexedDB);
}
