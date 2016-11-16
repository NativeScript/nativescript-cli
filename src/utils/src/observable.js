import { Observable } from 'rxjs/Observable';
import Promise from 'es6-promise';

/**
 * @private
 */
export default class KinveyObservable extends Observable {
  toPromise() {
    return new Promise((resolve, reject) => {
      let value;
      this.subscribe((v) => {
        value = v;
      }, reject, () => {
        resolve(value);
      });
    });
  }

  static create(subscriber) {
    return new KinveyObservable(subscriber);
  }
}
