import Aggregation from './aggregation';

export default function max(field = '') {
  const aggregation = new Aggregation({
    initial: { max: -1 * Number.MAX_SAFE_INTEGER },
    reduceFn: ''
      + 'function(doc, out) {'
      + `  out.max = Math.max(out.max, doc["${field.replace('\'', '\\\'')}"]);`
      + '  return out;'
      + '}'
  });
  return aggregation;
}
