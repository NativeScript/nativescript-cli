import { Observable } from 'rxjs/Observable';

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
