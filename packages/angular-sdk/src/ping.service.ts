import { Injectable, Inject } from '@angular/core';
import { init, HTML5KinveyConfig } from 'kinvey-html5-sdk/lib/init';
import { ping } from 'kinvey-html5-sdk';
import { KinveyConfigToken } from './utils';

@Injectable({
  providedIn: 'root'
})
export class PingService {
  constructor(@Inject(KinveyConfigToken) config: HTML5KinveyConfig) {
    init(config);
  }

  ping(): Promise<any> {
    return ping();
  }
}
