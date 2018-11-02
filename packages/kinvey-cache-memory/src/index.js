import { register as _register } from 'kinvey-cache';
import * as Memory from './loki';

export function register() {
  _register(Memory);
}
