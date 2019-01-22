/* eslint-disable class-methods-use-this */

import { Injectable } from '@angular/core';
import endpoint from '../endpoint';

class EndpointService {
  endpoint(...args) {
    return endpoint(...args);
  }

  execute(...args) {
    return this.endpoint(...args);
  }
}

EndpointService.decorators = [
  { type: Injectable }
];

export default EndpointService;
