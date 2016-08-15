import { Observable } from 'rxjs/Observable';
import { toPromise } from 'rxjs/operator/toPromise';

/**
 * @private
 */
export class KinveyObservable extends Observable {
  toPromise() {
    return toPromise.call(this);
  }

  static create(subscriber) {
    return new KinveyObservable(subscriber);
  }
}
