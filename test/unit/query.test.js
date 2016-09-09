import { Query } from '../../src/query';
import expect from 'expect';

describe('Query', function() {
  describe('isSupportedOffline()', function() {
    it('should be false when trying to filter geo queries', function() {
      const query = new Query();
      query.near('loc', [0, 0]);
      expect(query.isSupportedOffline()).toEqual(false);
    });

    it('should be true', function() {
      const query = new Query();
      query.equalTo('foo', 'bar');
      expect(query.isSupportedOffline()).toEqual(true);
    });
  });

  describe('process()', function() {
    it('throw an error when a query is not supported local', function() {
      expect(() => {
        const query = new Query();
        query.near('loc', [0, 0]);
        return query.process([]);
      }).toThrow(/This query is not able to run locally./);
    });
  });

  describe('toQueryString()', function() {
    it('should have a query property', function() {
      const query = new Query();
      query.equalTo('name', 'tests');
      const queryString = query.toQueryString();
      expect(queryString).toInclude({ query: '{"name":{"$eq":"tests"}}' });
    });

    it('should not have a query property', function () {
      const query = new Query();
      const queryString = query.toQueryString();
      expect(queryString).toExcludeKey('query');
    });

    it('should have a fields property', function () {
      const query = new Query();
      query.fields = ['foo', 'bar'];
      const queryString = query.toQueryString();
      expect(queryString).toInclude({ fields: 'foo,bar' });
    });

    it('should not have a fields property', function () {
      const query = new Query();
      const queryString = query.toQueryString();
      expect(queryString).toExcludeKey('fields');
    });

    it('should have a limit property', function () {
      const query = new Query();
      query.limit = 10;
      const queryString = query.toQueryString();
      expect(queryString).toInclude({ limit: 10 });
    });

    it('should not have a limit property', function () {
      const query = new Query();
      const queryString = query.toQueryString();
      expect(queryString).toExcludeKey('limit');
    });

    it('should have a skip property', function () {
      const query = new Query();
      query.skip = 10;
      const queryString = query.toQueryString();
      expect(queryString).toInclude({ skip: 10 });
    });

    it('should not have a skip property', function () {
      const query = new Query();
      query.skip = 0;
      const queryString = query.toQueryString();
      expect(queryString).toExcludeKey('skip');
    });

    it('should have a sort property', function () {
      const query = new Query();
      query.ascending('foo');
      const queryString = query.toQueryString();
      expect(queryString).toInclude({ sort: '{"foo":1}' });
    });

    it('should not have a sort property', function () {
      const query = new Query();
      const queryString = query.toQueryString();
      expect(queryString).toExcludeKey('sort');
    });
  });
});
