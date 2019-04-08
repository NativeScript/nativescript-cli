import { Inject, Injectable } from '@angular/core';
import { init, CustomEndpoint } from 'kinvey-html5-sdk';
import { KinveyConfigToken } from './utils';

@Injectable({
  providedIn: 'root'
})
export class EndpointService {
  constructor(@Inject(KinveyConfigToken) config: any) {
    init(config);
  }

  endpoint(endpoint: string, args?: any, options?: any) {
    return CustomEndpoint.execute(endpoint, args, options);
  }

  execute(endpoint: string, args?: any, options?: any) {
    return this.endpoint(endpoint, args, options);
  }
}
