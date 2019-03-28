/* eslint-disable class-methods-use-this */

import { Inject, Injectable } from '@angular/core';
import { init, HTML5KinveyConfig } from 'kinvey-html5-sdk/lib/init';
import { CustomEndpoint } from 'kinvey-html5-sdk';
import { KinveyConfigToken } from './utils';

@Injectable({
  providedIn: 'root'
})
export class EndpointService {
  constructor(@Inject(KinveyConfigToken) config: HTML5KinveyConfig) {
    init(config);
  }

  endpoint(endpoint: string, args?: any, options?: any) {
    return CustomEndpoint.execute(endpoint, args, options);
  }

  execute(endpoint: string, args?: any, options?: any) {
    return this.endpoint(endpoint, args, options);
  }
}
