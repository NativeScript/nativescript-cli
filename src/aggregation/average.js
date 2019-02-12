import Aggregation from './aggregation';

/**
 * Creates an aggregation that will return the average value for a field on an array of data.
 *
 * @param {string} field Field
 * @returns {Aggregation} Aggregation
 */
export default function average(field = '') {
  const aggregation = new Aggregation({
    initial: { count: 0, average: 0 },
    reduceFn: ''
      + 'function(doc, out) {'
      + `  out.average = (out.average * out.count + doc["${field.replace('\'', '\\\'')}"]) / (out.count + 1);`
      + '  out.count += 1;'
      + '  return out;'
      + '}'
  });
  return aggregation;
}
