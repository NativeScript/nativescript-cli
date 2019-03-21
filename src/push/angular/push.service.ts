/* eslint-disable class-methods-use-this */

import { Injectable } from '@angular/core';
import { register, unregister } from '../../push';

@Injectable({
  providedIn: 'root'
})
export class PushService {
  register(callback: any) {
    return register(callback);
  }

  unregister(options?) {
    return unregister(options);
  }
}
