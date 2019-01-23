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
    // eslint-disable-next-line object-shorthand, func-names
    reduceFn: function (result, doc, key) {
      // eslint-disable-next-line no-param-reassign
      result.sum += doc[key];
      return result;
    }
  });
  aggregation.by(field);
  return aggregation;
}
