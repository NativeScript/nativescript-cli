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
    // eslint-disable-next-line object-shorthand, func-names
    reduceFn: function (result, doc, key) {
      // eslint-disable-next-line no-param-reassign
      result.average = ((result.average * result.count) + doc[key]) / (result.count + 1);
      // eslint-disable-next-line no-param-reassign
      result.count += 1;
      return result;
    }
  });
  aggregation.by(field);
  return aggregation;
}
