import { register as _register } from 'kinvey-cache';
import * as IndexedDB from './indexeddb';

export function register() {
  _register(IndexedDB);
}
