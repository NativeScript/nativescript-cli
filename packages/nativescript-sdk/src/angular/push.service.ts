import { Inject, Injectable } from '@angular/core';
import { init } from '../nativescript/init';
import * as Push from '../nativescript/push';
import { KinveyConfigToken } from './utils';

@Injectable({
  providedIn: 'root'
})
export class PushService {
  constructor(@Inject(KinveyConfigToken) config: any) {
    init(config);
  }

  register(callback: (message: any) => void, options?: any) {
    return Push.register(callback, options);
  }

  unregister(options?: any) {
    return Push.unregister(options);
  }
}
