import { Injectable, Inject } from '@angular/core';
import { init, ping, KinveyConfig, PingResponse } from 'kinvey-nativescript-sdk';
import { KinveyConfigToken } from './utils';

@Injectable({
  providedIn: 'root'
})
export class PingService {
  constructor(@Inject(KinveyConfigToken) config: KinveyConfig) {
    init(config);
  }

  ping(): Promise<PingResponse> {
    return ping();
  }
}
