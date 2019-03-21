/* eslint-disable class-methods-use-this */

import { Inject, Injectable } from '@angular/core';
import endpoint from '../core/endpoint';
import init from '../core/kinvey/init';
import { KinveyConfigToken } from './utils';

@Injectable({
  providedIn: 'root'
})
export class EndpointService {
  constructor(@Inject(KinveyConfigToken) config: any) {
    init(config);
  }

  endpoint(endpointUrl, args?, options?) {
    return endpoint(endpointUrl, args, options);
  }

  execute(endpointUrl, args?, options?) {
    return this.endpoint(endpointUrl, args, options);
  }
}
