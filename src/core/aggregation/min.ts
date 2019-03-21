import Aggregation from './aggregation';

export default function min(field = '') {
  const aggregation = new Aggregation({
    initial: { min: Number.MAX_SAFE_INTEGER },
    reduceFn: ''
      + 'function(doc, out) {'
      + `  out.min = Math.min(out.min, doc["${field.replace('\'', '\\\'')}"]);`
      + '  return out;'
      + '}'
  });
  return aggregation;
}
