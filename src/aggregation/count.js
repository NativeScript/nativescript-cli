import Aggregation from './aggregation';

/**
 * Creates an aggregation that will return the count for a field on an array of data.
 *
 * @param {string} field Field
 * @returns {Aggregation} Aggregation
 */
export default function count(field = '') {
  const aggregation = new Aggregation({
    reduceFn: (result, doc, key) => {
      const val = doc[key];
      if (val) {
        // eslint-disable-next-line no-param-reassign
        result[val] = typeof result[val] === 'undefined' ? 1 : result[val] + 1;
      }
      return result;
    }
  });
  aggregation.by(field);
  return aggregation;
}
