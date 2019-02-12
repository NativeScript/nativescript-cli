/* eslint-disable class-methods-use-this */

import { Injectable } from '@angular/core';
import ping from '../ping';

@Injectable({
  providedIn: 'root'
})
export default class PingService {
  ping() {
    return ping();
  }
}
