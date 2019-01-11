import Aggregation from './aggregation';

/**
 * Creates an aggregation that will return the min value for a field on an array of data.
 *
 * @param {string} field Field
 * @returns {Aggregation} Aggregation
 */
export default function min(field = '') {
  const aggregation = new Aggregation({
    initial: { min: Infinity },
    reduceFn: (result, doc, key) => {
      // eslint-disable-next-line no-param-reassign
      result.min = Math.min(result.min, doc[key]);
      return result;
    }
  });
  aggregation.by(field);
  return aggregation;
}
