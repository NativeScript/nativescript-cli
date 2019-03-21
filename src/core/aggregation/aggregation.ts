import Query from '../query';

export default class Aggregation {
  private query?: Query;
  private initial?: any;
  private key?: any;
  private reduceFn: string;

  constructor(aggregation) {
    const config = Object.assign({}, {
      query: null,
      initial: {},
      key: {},
      // eslint-disable-next-line func-names
      reduceFn: function () { }.toString()
    }, aggregation);

    if (config.query && !(config.query instanceof Query)) {
      throw new Error('Query must be an instance of Query class.');
    }

    this.query = config.query;
    this.initial = config.initial;
    this.key = config.key;
    this.reduceFn = config.reduceFn;
  }

  by(field) {
    this.key[field] = true;
    return this;
  }

  process(docs = []) {
    // eslint-disable-next-line no-new-func
    const reduceFn = new Function('doc', 'out', this.reduceFn.replace(/function[\s\S]*?\([\s\S]*?\)/, ''));
    let filteredDocs = docs;

    if (this.query) {
      filteredDocs = this.query.process(docs);
    }

    if (filteredDocs.length > 0) {
      const fields = Object.keys(this.key) || [];

      if (fields.length > 0) {
        return filteredDocs.reduce((results, doc) => {
          const index = results.findIndex((result) => fields.reduce((match, field) => match && result[field] === doc[field], true));
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

      return filteredDocs.reduce((result, doc) => reduceFn(doc, result), Object.assign({}, this.initial));
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
}
