import { Injectable } from '@angular/core';
import { Acl } from './sdk';

@Injectable({
  providedIn: 'root'
})
export class KinveyAclService {
  create(acl) {
    return new Acl(acl);
  }
}
