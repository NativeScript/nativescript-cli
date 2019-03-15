/* eslint-disable class-methods-use-this */

import { Injectable } from '@angular/core';
import { register, unregister } from '../push';

@Injectable({
  providedIn: 'root'
})
export default class PushService {
  register(...args) {
    return register(...args);
  }

  unregister(...args) {
    return unregister(...args);
  }
}
