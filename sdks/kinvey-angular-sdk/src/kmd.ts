import { Injectable } from '@angular/core';
import { Kmd } from './sdk';

@Injectable({
  providedIn: 'root'
})
export class KinveyKmdService {
  create(kmd) {
    return new Kmd(kmd);
  }
}
