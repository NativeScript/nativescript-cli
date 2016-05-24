import './setup';
import { Query } from '../src/query';
import chai from 'chai';
const expect = chai.expect;

describe('Query', function () {
  describe('toQueryString()', function () {
    it('should have a query property', function () {
      const query = new Query();
      query.equalTo('name', 'tests');
      const queryString = query.toQueryString();
      expect(queryString).to.have.property('query', '{"name":"tests"}');
    });

    it('should not have a query property', function () {
      const query = new Query();
      const queryString = query.toQueryString();
      expect(queryString).to.not.have.property('query');
    });

    it('should have a fields property', function () {
      const query = new Query();
      query.fields = ['foo', 'bar'];
      const queryString = query.toQueryString();
      expect(queryString).to.have.property('fields', 'foo,bar');
    });

    it('should not have a fields property', function () {
      const query = new Query();
      const queryString = query.toQueryString();
      expect(queryString).to.not.have.property('fields');
    });

    it('should have a limit property', function () {
      const query = new Query();
      query.limit = 10;
      const queryString = query.toQueryString();
      expect(queryString).to.have.property('limit', '10');
    });

    it('should not have a limit property', function () {
      const query = new Query();
      const queryString = query.toQueryString();
      expect(queryString).to.not.have.property('limit');
    });

    it('should have a skip property', function () {
      const query = new Query();
      query.skip = 10;
      const queryString = query.toQueryString();
      expect(queryString).to.have.property('skip', '10');
    });

    it('should not have a skip property', function () {
      const query = new Query();
      query.skip = 0;
      const queryString = query.toQueryString();
      expect(queryString).to.not.have.property('skip');
    });

    it('should have a sort property', function () {
      const query = new Query();
      query.ascending('foo');
      const queryString = query.toQueryString();
      expect(queryString).to.have.property('sort', '{"foo":1}');
    });

    it('should not have a sort property', function () {
      const query = new Query();
      const queryString = query.toQueryString();
      expect(queryString).to.not.have.property('sort');
    });
  });
});
