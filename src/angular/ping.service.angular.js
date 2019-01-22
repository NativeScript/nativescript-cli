/* eslint-disable class-methods-use-this */

import { Injectable } from '@angular/core';
import ping from '../ping';

class PingService {
  ping() {
    return ping();
  }
}

PingService.decorators = [
  { type: Injectable }
];

export default PingService;
