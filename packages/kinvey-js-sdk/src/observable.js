import { Observable } from 'rxjs';

export class KinveyObservable extends Observable {
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
}

/**
 * @private
 */
export function isPromiseLike(obj) {
  return !!obj && (typeof obj.then === 'function') && (typeof obj.catch === 'function');
}

/**
 * @private
 */
export function isObservable(obj) {
  return obj instanceof Observable;
}
