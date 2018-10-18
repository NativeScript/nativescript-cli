import { Query } from 'kinvey-query';
import { expect } from 'chai';
import { Aggregation } from './aggregation';

describe('Aggregation', () => {
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
  });
});
