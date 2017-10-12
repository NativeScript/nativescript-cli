import { isFunction } from 'lodash/isFunction';

export function stubObjectMethods(obj) {
  const result = {};

  for (const key in obj) {
    if (isFunction(obj[key])) {
      result[key] = () => { };
    }
  }

  return result;
}

export function stubClassMethods(ClassConstructor, ...constructurArgs) {
  const obj = new ClassConstructor(...constructurArgs);
  return stubObjectMethods(obj);
}
