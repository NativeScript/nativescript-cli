import Aggregation from './aggregation';

/**
 * Creates an aggregation that will return the min value for a field on an array of data.
 *
 * @param {string} field Field
 * @returns {Aggregation} Aggregation
 */
export default function min(field = '') {
  const aggregation = new Aggregation({
    initial: { min: Number.MAX_SAFE_INTEGER },
    reduceFn: ''
      + 'function(doc, out) {'
      + `  out.min = Math.min(out.min, doc["${field.replace('\'', '\\\'')}"]);`
      + '  return out;'
      + '}'
  });
  return aggregation;
}
