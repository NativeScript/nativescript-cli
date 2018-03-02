import expect from 'expect';

import { Query } from '../query';
import { splitQueryIntoPages, randomString } from '../utils';

const validatePaginatedQueries = (originalQuery, paginatedQueries, pageSize, totalCount) => {
  paginatedQueries.forEach((query, index) => {
    expect(query.skip).toBe(index * pageSize);
    expect(query.limit).toBe(Math.min(totalCount - (index * pageSize), pageSize));
    expect(query.sort).toEqual(originalQuery.sort);
    expect(query.fields).toEqual(originalQuery.fields);
  });
};

describe('Utilities', () => {
  describe('splitQueryIntoPages()', () => {
    it('should throw an error if no query is passed', () => {
      expect(() => {
        splitQueryIntoPages(null, 12, 123);
      }).toThrow();
    });

    it('should throw an error if invalid page size is passed', () => {
      expect(() => {
        splitQueryIntoPages(new Query(), null, 123);
      }).toThrow();
    });

    it('should throw an error if invalid totalCount is passed', () => {
      expect(() => {
        splitQueryIntoPages(new Query(), 12);
      }).toThrow();
    });

    it('should split into 1 query, if totalCount < pageSize', () => {
      const pageSize = 2;
      const totalCount = 1;
      const query = new Query();
      const result = splitQueryIntoPages(query, pageSize, totalCount);
      expect(result).toBeA(Array);
      expect(result.length).toBe(1);
      validatePaginatedQueries(query, result, pageSize, totalCount);
    });

    it('should split into 1 query, if totalCount = pageSize', () => {
      const pageSize = 2;
      const totalCount = 2;
      const query = new Query();
      const result = splitQueryIntoPages(query, 2, 2);
      expect(result).toBeA(Array);
      expect(result.length).toBe(1);
      validatePaginatedQueries(query, result, pageSize, totalCount);
    });

    it('should split into 2 queries, if totalCount > pageSize && totalCount < 2 * pageSize', () => {
      const pageSize = 2;
      const totalCount = 3;
      const query = new Query();
      const result = splitQueryIntoPages(query, 2, 3);
      expect(result).toBeA(Array);
      expect(result.length).toBe(2);
      validatePaginatedQueries(query, result, pageSize, totalCount);
    });

    it('should ignore the limit field of the passed query - it should use the totalCount parameter', () => {
      const pageSize = 1;
      const totalCount = 5;
      const query = new Query();
      query.limit = 1;
      const result = splitQueryIntoPages(query, 1, 5);
      expect(result).toBeA(Array);
      expect(result.length).toBe(5);
      validatePaginatedQueries(query, result, pageSize, totalCount);
    });

    it('should keep the original query sort', () => {
      const pageSize = 1;
      const totalCount = 5;
      const query = new Query();
      query.limit = 1;
      query.ascending(randomString());
      const result = splitQueryIntoPages(query, 1, 5);
      expect(result).toBeA(Array);
      expect(result.length).toBe(5);
      validatePaginatedQueries(query, result, pageSize, totalCount);
    });

    it('should keep the original query fields modifier', () => {
      const pageSize = 1;
      const totalCount = 5;
      const query = new Query();
      query.fields = [randomString()];
      const result = splitQueryIntoPages(query, 1, 5);
      expect(result).toBeA(Array);
      expect(result.length).toBe(5);
      validatePaginatedQueries(query, result, pageSize, totalCount);
    });
  });
});
