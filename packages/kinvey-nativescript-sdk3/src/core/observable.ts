import { Observable } from 'rxjs';

export default class KinveyObservable extends Observable<any> {
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

