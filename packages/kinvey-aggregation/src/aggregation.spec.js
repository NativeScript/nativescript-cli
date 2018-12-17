import { Query } from 'kinvey-query';
import { expect } from 'chai';
import { randomString } from 'kinvey-test-utils';
import * as aggr from './aggregation';

// const sift = require('sift');


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
        title: typeof title !== 'undefined' && title !== null ? title : randomString(),
        count: getRandomIntInclusive(1, 100),
        count2: getRandomIntInclusive(1, 100),
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
        const aggregation = new aggr.Aggregation();
        aggregation.query = {};
      }).to.throw();
    });

    it('should set the query', () => {
      const aggregation = new aggr.Aggregation();
      const query = new Query();
      aggregation.query = query;
      expect(aggregation.query).to.equal(query);
    });

    it('should set the query to null', () => {
      const aggregation = new aggr.Aggregation();
      aggregation.query = new Query();
      aggregation.query = null;
      expect(aggregation.query).to.equal(null);
    });

    it('should filter the entities processed using the query', () => {
      const aggregation = aggr.count('title');
      aggregation.query = new Query().equalTo('title', commonTitle);
      const result = aggregation.process(entities);
      expect(result).to.deep.equal({ title: { [commonTitle]: 26 } });
    });
  });

  describe('count()', () => {
    it('should return the count of a unique property value for all entities', () => {
      const aggregation = aggr.count('title');
      const result = aggregation.process(entities);
      Object.keys(result.title).forEach((title) => {
        if (title === commonTitle) {
          expect(result.title[title]).to.equal(26);
        } else {
          expect(result.title[title]).to.equal(1);
        }
      });
    });
  });

  describe('sum()', () => {
    it('should return the sum of a property for all entities', () => {
      const sum = entities.reduce((sum, entity) => sum + entity.count, 0);
      const aggregation = aggr.sum('count');
      const result = aggregation.process(entities);
      expect(result.count.sum).to.equal(sum);
    });
  });

  describe('min()', () => {
    it('should return the min value of a property for all entities', () => {
      const min = entities.reduce((min, entity) => Math.min(min, entity.count), Infinity);
      const aggregation = aggr.min('count');
      const result = aggregation.process(entities);
      expect(result.count.min).to.equal(min);
    });
  });

  describe('max()', () => {
    it('should return the max value of a property for all entities', () => {
      const max = entities.reduce((max, entity) => Math.max(max, entity.count), -Infinity);
      const aggregation = aggr.max('count');
      const result = aggregation.process(entities);
      expect(result.count.max).to.equal(max);
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
      const aggregation = aggr.average('count');
      const result = aggregation.process(entities);
      expect(result.count.average).to.equal(average);
      expect(result.count.count).to.equal(count);
    });
  });
});
