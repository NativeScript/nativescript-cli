import { Observable } from 'rxjs/Observable';
import { toPromise } from 'rxjs/operator/toPromise';

export class KinveyObservable extends Observable {
  toPromise() {
    return this::toPromise();
  }
}
