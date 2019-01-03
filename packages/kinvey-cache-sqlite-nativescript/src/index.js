import { register as _register } from 'kinvey-cache';
import * as SQLite from './sqlite';

export function register() {
  _register(SQLite);
}
