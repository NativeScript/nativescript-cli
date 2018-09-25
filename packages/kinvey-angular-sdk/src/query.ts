import { Injectable } from '@angular/core';
import { Query } from './sdk';

@Injectable({
  providedIn: 'root'
})
export class KinveyQueryService {
  create(query) {
    return new Query(query);
  }
}
