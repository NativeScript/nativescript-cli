"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isPromiseLike = isPromiseLike;
exports.isObservable = isObservable;
exports.KinveyObservable = void 0;

var _rxjs = require("rxjs");

class KinveyObservable extends _rxjs.Observable {
  toPromise() {
    return new Promise((resolve, reject) => {
      let value;
      this.subscribe(v => {
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


exports.KinveyObservable = KinveyObservable;

function isPromiseLike(obj) {
  return !!obj && typeof obj.then === 'function' && typeof obj.catch === 'function';
}
/**
 * @private
 */


function isObservable(obj) {
  return obj instanceof _rxjs.Observable;
}