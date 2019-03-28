import { Query } from './query';

export interface AggregationObject {
  query?: Query;
  initial?: any;
  key?: any;
  reduceFn?: string;
}

export class Aggregation {
  private _query?: Query;
  public initial: any;
  public key: any;
  public reduceFn: string;

  constructor(aggregation?: Aggregation | AggregationObject) {
    const config = Object.assign({}, {
      query: null,
      initial: {},
      key: {},
      // eslint-disable-next-line func-names
      reduceFn: function () { }.toString()
    }, aggregation);

    this.query = config.query;
    this.initial = config.initial;
    this.key = config.key;
    this.reduceFn = config.reduceFn;
  }

  get query() {
    return this._query;
  }

  set query(query) {
    if (query && !(query instanceof Query)) {
      throw new Error('Query must be an instance of Query class.');
    }

    this._query = query;
  }

  /**
   * Adds the filed to the array of fields.
   *
   * @param {string} field
   * @returns {Aggregation} Aggregation
   */
  by(field: string) {
    this.key[field] = true;
    return this;
  }

  process(docs: any = []) {
    // eslint-disable-next-line no-new-func
    const reduceFn = new Function('doc', 'out', this.reduceFn.replace(/function[\s\S]*?\([\s\S]*?\)/, ''));
    let filteredDocs = docs;

    if (this.query) {
      filteredDocs = this.query.process(docs);
    }

    if (filteredDocs.length > 0) {
      const fields = Object.keys(this.key) || [];

      if (fields.length > 0) {
        return filteredDocs.reduce((results: any, doc: { [x: string]: any; }) => {
          const index = results.findIndex((result: any) => fields.reduce((match, field) => match && result[field] === doc[field], true));
          if (index === -1) {
            const result = fields.reduce((result, field) => {
              result[field] = doc[field];
              return result;
            }, Object.assign({}, this.initial));
            results.push(reduceFn(doc, result));
          } else {
            const result = results[index];
            results[index] = reduceFn(doc, result);
          }
          return results;
        }, []);
      }

      return filteredDocs.reduce((result: any, doc: any) => reduceFn(doc, result), Object.assign({}, this.initial));
    }

    return Object.assign({}, this.initial);
  }

  toPlainObject() {
    return {
      key: this.key,
      initial: this.initial,
      reduce: this.reduceFn,
      reduceFn: this.reduceFn,
      condition: this.query ? this.query.toPlainObject().filter : {},
      query: this.query ? this.query.toPlainObject() : null
    };
  }

  static average(field = '') {
    const aggregation = new Aggregation({
      initial: { count: 0, average: 0 },
      reduceFn: ''
        + 'function(doc, out) {'
        + `  out.average = (out.average * out.count + doc["${field.replace('\'', '\\\'')}"]) / (out.count + 1);`
        + '  out.count += 1;'
        + '  return out;'
        + '}'
    });
    return aggregation;
  }

  static count(field = '') {
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

  static max(field = '') {
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

  static min(field = '') {
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

  static sum(field = '') {
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
}
