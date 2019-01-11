import Query from '../query';

export default class Aggregation {
  constructor(aggregation) {
    const config = Object.assign({}, {
      query: null,
      initial: {},
      key: {},
      reduceFn: () => null
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
  by(field) {
    this.key[field] = true;
    return this;
  }

  process(docs = []) {
    if (docs.length > 0) {
      const fields = Object.keys(this.key);
      let filteredDocs = docs;

      if (this.query) {
        filteredDocs = this.query.process(docs);
      }

      if (fields.length > 0) {
        return fields.reduce((results, field) => {
          results[field] = filteredDocs.reduce((result, doc) => this.reduceFn(result, doc, field) || result, Object.assign({}, this.initial));
          return results;
        }, {});
      }

      return filteredDocs.reduce((result, doc) => this.reduceFn(doc, result) || result, Object.assign({}, this.initial));
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
