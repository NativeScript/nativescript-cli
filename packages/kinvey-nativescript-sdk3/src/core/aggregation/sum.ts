import Aggregation from './aggregation';

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
