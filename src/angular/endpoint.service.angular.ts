/* eslint-disable class-methods-use-this */

import { Injectable } from '@angular/core';
import endpoint from '../endpoint';

@Injectable({
  providedIn: 'root'
})
export default class EndpointService {
  endpoint(...args) {
    return endpoint(...args);
  }

  execute(...args) {
    return this.endpoint(...args);
  }
}
