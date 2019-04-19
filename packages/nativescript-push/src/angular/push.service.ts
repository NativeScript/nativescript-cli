import { Inject, Injectable, InjectionToken } from '@angular/core';
import { init } from 'kinvey-nativescript-sdk';
import { register, unregister } from '../nativescript';

const KinveyConfigToken = new InjectionToken<any>('kinvey.config');

@Injectable({
  providedIn: 'root'
})
export class PushService {
  constructor(@Inject(KinveyConfigToken) config: any) {
    init(config);
  }

  register(callback: (message: any) => void, options?: any) {
    return register(callback, options);
  }

  unregister(options?: any) {
    return unregister(options);
  }
}
