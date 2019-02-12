import Aggregation from './aggregation';

/**
 * Creates an aggregation that will return the sum for a field on an array of data.
 *
 * @param {string} field Field
 * @returns {Aggregation} Aggregation
 */
export default function sum(field = '') {
  const aggregation = new Aggregation({
    initial: { sum: 0 },
    reduceFn: ''
      + 'function(doc, out) {'
      + `  out.sum += doc["${field.replace('\'', '\\\'')}"];`
      + '  return out;'
      + '}'
  });
  return aggregation;
}
