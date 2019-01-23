import Aggregation from './aggregation';

/**
 * Creates an aggregation that will return the max value for a field on an array of data.
 *
 * @param {string} field Field
 * @returns {Aggregation} Aggregation
 */
export default function max(field = '') {
  const aggregation = new Aggregation({
    initial: { max: -Infinity },
    // eslint-disable-next-line object-shorthand, func-names
    reduceFn: function (result, doc, key) {
      // eslint-disable-next-line no-param-reassign
      result.max = Math.max(result.max, doc[key]);
      return result;
    }
  });
  aggregation.by(field);
  return aggregation;
}
