import { register as _register } from 'kinvey-cache';
import * as IndexedDB from './indexeddb2';

export function register() {
  _register(IndexedDB);
}
