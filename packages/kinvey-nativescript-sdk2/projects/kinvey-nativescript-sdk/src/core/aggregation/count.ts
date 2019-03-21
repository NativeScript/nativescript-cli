import Aggregation from './aggregation';

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
