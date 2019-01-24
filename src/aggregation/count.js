import Aggregation from './aggregation';

/**
 * Creates an aggregation that will return the count for a field on an array of data.
 *
 * @param {string} field Field
 * @returns {Aggregation} Aggregation
 */
export default function count(field = '') {
  const aggregation = new Aggregation({
    initial: { count: 0 },
    reduceFn: ''
      + 'function(doc, out) {'
      + '  out.count += 1;'
      + '  return out;'
      + '}'
  });
  aggregation.by(field);
  return aggregation;
}
