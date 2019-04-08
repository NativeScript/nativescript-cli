import { Injectable, Inject } from '@angular/core';
import { init, ping } from 'kinvey-nativescript-sdk';
import { KinveyConfigToken } from './utils';

@Injectable({
  providedIn: 'root'
})
export class PingService {
  constructor(@Inject(KinveyConfigToken) config: any) {
    init(config);
  }

  ping(): Promise<any> {
    return ping();
  }
}
