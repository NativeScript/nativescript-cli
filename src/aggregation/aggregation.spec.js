import { expect } from 'chai';
import Query from '../query';
import { randomString } from '../../tests/utils';
import Aggregation from './aggregation';
import AggregationAverage from './average';
import AggregationCount from './count';
import AggregationMax from './max';
import AggregationMin from './min';
import AggregationSum from './sum';

// const sift = require('sift');


describe('Aggregation', () => {
  const commonTitle = 'Kinvey';
  const entities = [];

  before(() => {
    // Returns a random integer between min (included) and max (included)
    // Using Math.round() will give you a non-uniform distribution!
    function getRandomIntInclusive(min, max) {
      // eslint-disable-next-line no-param-reassign
      min = Math.ceil(min);
      // eslint-disable-next-line no-param-reassign
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
      const aggregation = AggregationCount('title');
      aggregation.query = new Query().equalTo('title', commonTitle);
      const result = aggregation.process(entities);
      expect(result).to.deep.equal([{ count: 26, title: commonTitle }]);
    });
  });

  describe('count()', () => {
    it('should return the count of a unique property value for all entities', () => {
      const aggregation = AggregationCount('title');
      const results = aggregation.process(entities);
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
      const aggregation = AggregationSum('count');
      const result = aggregation.process(entities);
      expect(result.sum).to.equal(sum);
    });
  });

  describe('min()', () => {
    it('should return the min value of a property for all entities', () => {
      const min = entities.reduce((min, entity) => Math.min(min, entity.count), Infinity);
      const aggregation = AggregationMin('count');
      const result = aggregation.process(entities);
      expect(result.min).to.equal(min);
    });
  });

  describe('max()', () => {
    it('should return the max value of a property for all entities', () => {
      const max = entities.reduce((max, entity) => Math.max(max, entity.count), -Infinity);
      const aggregation = AggregationMax('count');
      const result = aggregation.process(entities);
      expect(result.max).to.equal(max);
    });
  });

  describe('average()', () => {
    it('should return the count and average of a property for all entities', () => {
      let count = 0;
      const average = entities.reduce((average, entity) => {
        // eslint-disable-next-line no-param-reassign
        average = ((average * count) + entity.count) / (count + 1);
        count += 1;
        return average;
      }, 0);
      const aggregation = AggregationAverage('count');
      const result = aggregation.process(entities);
      expect(result.average).to.equal(average);
      expect(result.count).to.equal(count);
    });
  });
});
