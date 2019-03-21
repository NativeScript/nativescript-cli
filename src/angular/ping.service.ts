/* eslint-disable class-methods-use-this */

import { Inject, Injectable } from '@angular/core';
import ping from '../core/ping';
import init from '../core/kinvey/init';
import { KinveyConfigToken } from './utils';

@Injectable({
  providedIn: 'root'
})
export class PingService {
  constructor(@Inject(KinveyConfigToken) config: any) {
    init(config);
  }

  ping() {
    return ping();
  }
}
