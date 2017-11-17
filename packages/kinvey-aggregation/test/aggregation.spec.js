/* eslint-env mocha */

const { expect } = require('chai');
const { Aggregation } = require('../src');
const { Query } = require('kinvey-query');
const { isDefined } = require('kinvey-utils/object');
const { randomString } = require('kinvey-utils/string');

describe('Aggregation', () => {
  const commonTitle = 'Kinvey';
  const entities = [];

  before(() => {
    // Returns a random integer between min (included) and max (included)
    // Using Math.round() will give you a non-uniform distribution!
    function getRandomIntInclusive(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * ((max - min) + 1)) + min;
    }

    function createEntity(title) {
      return {
        _id: randomString(),
        title: isDefined(title) ? title : randomString(),
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
        entities.push(createEntity(commonTitle));
      } else {
        entities.push(createEntity());
      }
    }
  });

  describe('query', () => {
    it('should not set an invalid query', () => {
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

    it('should filter the entities processed using the query', () => {
      const aggregation = Aggregation.count('title');
      const query = new Query().equalTo('title', commonTitle);
      aggregation.query = query;
      const results = aggregation.process(entities);
      expect(results.length).to.equal(1);
      expect(results[0].count).to.equal(26);
    });
  });

  describe('count()', () => {
    it('should return the count of a unique property value for all entities', () => {
      const aggregation = Aggregation.count('title');
      const results = aggregation.process(entities);
      expect(results).to.be.an.instanceOf(Array);
      results.forEach((result) => {
        if (result.title === commonTitle) {
          expect(result.count).to.equal(26);
        } else {
          expect(result.count).to.equal(1);
        }
      });
    });
  });

  describe('sum()', () => {
    it('should return the sum of a property for all entities', () => {
      const sum = entities.reduce((sum, entity) => sum + entity.count, 0);
      const aggregation = Aggregation.sum('count');
      const result = aggregation.process(entities);
      expect(result).to.be.an.instanceof(Object);
      expect(result.sum).to.equal(sum);
    });
  });

  describe('min()', () => {
    it('should return the min value of a property for all entities', () => {
      const min = entities.reduce((min, entity) => Math.min(min, entity.count), Infinity);
      const aggregation = Aggregation.min('count');
      const result = aggregation.process(entities);
      expect(result).to.be.an.instanceof(Object);
      expect(result.min).to.equal(min);
    });
  });

  describe('max()', () => {
    it('should return the max value of a property for all entities', () => {
      const max = entities.reduce((max, entity) => Math.max(max, entity.count), -Infinity);
      const aggregation = Aggregation.max('count');
      const result = aggregation.process(entities);
      expect(result).to.be.an.instanceof(Object);
      expect(result.max).to.equal(max);
    });
  });

  describe('average()', () => {
    it('should return the count and average of a property for all entities', () => {
      let count = 0;
      const average = entities.reduce((average, entity) => {
        average = ((average * count) + entity.count) / (count + 1);
        count += 1;
        return average;
      }, 0);
      const aggregation = Aggregation.average('count');
      const result = aggregation.process(entities);
      expect(result).to.be.an.instanceof(Object);
      expect(result.average).to.equal(average);
      expect(result.count).to.equal(count);
    });
  });
});
