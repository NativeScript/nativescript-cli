// Number.isNaN
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN
export function isNaN(value) {
  /* eslint-disable no-self-compare  */
  return value !== value;
  /* eslint-enable no-self-compare  */
}
Number.isNaN = Number.isNaN || isNaN;
