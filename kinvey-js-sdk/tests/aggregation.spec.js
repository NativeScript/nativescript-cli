const sift = require('sift');
import { expect } from 'chai';
import Aggregation, { count, sum, min, max, average } from '../src/aggregation';
import Query from '../src/query';
import { randomString } from './utils';

function nested(obj, dotProperty, value) {
  if (!dotProperty) {
    obj = value || obj;
    return obj;
  }

  const parts = dotProperty.split('.');
  let current = parts.shift();
  while (current && obj) {
    obj = obj[current];
    current = parts.shift();
  }

  return value || obj;
}

function processDocsWithQuery(docs, query) {
  if (!query) {
    return docs;
  }

  if (!(query instanceof Query)) {
    throw new Error('Query argument must be an instance of Query.');
  }

  const { fields, filter, sort, limit, skip } = query;

  // Filter
  docs = sift(filter, docs);

  // Sort
  if (sort) {
    docs = docs.sort((doc1, doc2) => {
      for (const field in sort) {
        if (sort.hasOwnProperty(field)) {
          const doc1Field = nested(doc1, field);
          const doc2Field = nested(doc2, field);
          const modifier = sort[field]; // 1 (ascending) or -1 (descending)

          if (doc1Field && !doc2Field) {
            return 1 * modifier;
          } else if (!doc1Field && doc2Field) {
            return -1 * modifier;
          } else if ((typeof doc1Field === 'undefined' || doc1Field === null)
            && (typeof doc2Field === 'undefined' && doc2Field === null)) {
            return 0;
          } else if (doc1Field !== doc2Field) {
            return (doc1Field < doc2Field ? -1 : 1) * modifier;
          }
        }
      }

      return 0;
    });
  }

  // Skip
  if (typeof skip === 'number') {
    docs = docs.slice(skip);
  }

  // Limit
  if (typeof limit === 'number') {
    docs = docs.slice(0, limit);
  }

  // Remove fields
  if (Array.isArray(fields) && fields.length > 0) {
    docs = docs.map((doc) => {
      const keys = Object.keys(doc);
      keys.forEach((key) => {
        if (fields.indexOf(key) === -1) {
          delete doc[key];
        }
      });
      return doc;
    });
  }

  return docs;
}

function processDocsWithAggregation(docs, aggregation) {
  const { query, initial, fields, reduceFn } = aggregation;

  if (query) {
    docs = processDocsWithQuery(docs, query);
  }

  if (fields && fields.length > 0) {
    return fields.reduce((results, field) => {
      results[field] = docs.reduce((result, doc) => {
        return reduceFn(result, doc, field) || result;
      }, initial);
      return results;
    }, {});
  }

  return docs.reduce((result, doc) => reduceFn(doc, result) || result, Object.assign({}, initial));
}

describe('Aggregation', () => {
  const commonTitle = 'Kinvey';
  const docs = [];

  before(() => {
    // Returns a random integer between min (included) and max (included)
    // Using Math.round() will give you a non-uniform distribution!
    function getRandomIntInclusive(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * ((max - min) + 1)) + min;
    }

    function createDoc(title) {
      return {
        _id: randomString(),
        title: title ? title : randomString(),
        count: getRandomIntInclusive(1, 100),
        _acl: {
          creator: randomString()
        },
        _kmd: {
          lmt: new Date().toISOString(),
          ect: new Date().toISOString()
        }
      };
    }

    for (let i = 50; i >= 0; i -= 1) {
      if (i % 2 === 0) {
        docs.push(createDoc(commonTitle));
      } else {
        docs.push(createDoc());
      }
    }
  });

  describe('query', () => {
    it('should throw an error for an invalid query', () => {
      expect(() => {
        const aggregation = new Aggregation();
        aggregation.query = {};
      }).to.throw();
    });

    it('should set the query', () => {
      const aggregation = new Aggregation();
      const query = new Query();
      aggregation.query = query;
      expect(aggregation.query).to.equal(query);
    });

    it('should set the query to null', () => {
      const aggregation = new Aggregation();
      aggregation.query = new Query();
      aggregation.query = null;
      expect(aggregation.query).to.equal(null);
    });

    it('should filter the docs processed using the query', () => {
      const property = 'title';
      const aggregation = count(property);
      const query = new Query().equalTo(property, commonTitle);
      aggregation.query = query;
      const result = processDocsWithAggregation(docs, aggregation);
      expect(Object.keys(result[property]).length).to.equal(1);
      expect(result[property][commonTitle]).to.equal(26);
    });
  });

  describe('count()', () => {
    it('should return the count of a unique property value for all docs', () => {
      const property = 'title';
      const aggregation = count(property);
      const result = processDocsWithAggregation(docs, aggregation);
      Object.keys(result[property]).forEach((title) => {
        if (title === commonTitle) {
          expect(result[property][title]).to.equal(26);
        } else {
          expect(result[property][title]).to.equal(1);
        }
      });
    });
  });

  describe('sum()', () => {
    it('should return the sum of a property for all docs', () => {
      const sumValue = docs.reduce((sum, entity) => sum + entity.count, 0);
      const property = 'count';
      const aggregation = sum(property);
      const result = processDocsWithAggregation(docs, aggregation);
      expect(result[property].sum).to.equal(sumValue);
    });
  });

  describe('min()', () => {
    it('should return the min value of a property for all docs', () => {
      const minValue = docs.reduce((min, entity) => Math.min(min, entity.count), Infinity);
      const property = 'count';
      const aggregation = min(property);
      const result = processDocsWithAggregation(docs, aggregation);
      expect(result[property].min).to.equal(minValue);
    });
  });

  describe('max()', () => {
    it('should return the max value of a property for all docs', () => {
      const maxValue = docs.reduce((max, entity) => Math.max(max, entity.count), -Infinity);
      const property = 'count';
      const aggregation = max(property);
      const result = processDocsWithAggregation(docs, aggregation);
      expect(result[property].max).to.equal(maxValue);
    });
  });

  describe('average()', () => {
    it('should return the count and average of a property for all docs', () => {
      let count = 0;
      const averageValue = docs.reduce((average, entity) => {
        average = ((average * count) + entity.count) / (count + 1);
        count += 1;
        return average;
      }, 0);
      const property = 'count';
      const aggregation = average(property);
      const result = processDocsWithAggregation(docs, aggregation);
      expect(result[property].average).to.equal(averageValue);
      expect(result[property].count).to.equal(count);
    });
  });
});
