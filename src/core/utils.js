import clone from 'clone';

class Utils {
  static clone(obj) {
    return clone(obj);
  }

  static isDefined(obj) {
    return (obj !== undefined && obj !== null);
  }

  static isFunction(fn) {
    let getType = {};
    return fn && getType.toString.call(fn) === '[object Function]';
  }

  static isObject(obj) {
    return Object(obj) === obj;
  }
}

export default Utils;
