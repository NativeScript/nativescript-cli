import { register as _register } from 'kinvey-cache';
import * as Memory from './memory';

export function register() {
  _register(Memory);
}
