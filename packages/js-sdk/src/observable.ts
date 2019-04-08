import { Observable } from 'rxjs';

export class KinveyObservable<T> extends Observable<T> {
  toPromise() {
    return new Promise((resolve, reject) => {
      let value: any;
      this.subscribe((v) => {
        value = v;
      }, reject, () => {
        resolve(value);
      });
    });
  }
}

