import Query from '../../src/core/query';

describe('Query', function() {
  before(function() {
    ['fields', 'filter', 'sort', 'limit', 'skip'].forEach((name) => {
      this[name] = () => {
        return this.query.toJSON()[name];
      };
    });
  });

  after(function() {
    ['fields', 'filter', 'sort', 'limit', 'skip'].forEach((name) => {
      delete this[name];
    });
  });

  beforeEach(function() {
    this.field = randomString();
    this.query = new Query();
  });

  afterEach(function() {
    delete this.field;
    delete this.query;
  });

  describe('constructor()', function() {
    it('should return a new query', function() {
      expect(new Query()).to.be.an.instanceOf(Query);
    });

    it('should set fields if `options.field` was provided', function() {
      const fields = [global.randomString(), global.randomString()];
      const query = new Query({fields: fields});
      expect(query.toJSON().fields).to.deep.equal(fields);
    });

    it('should set filter if `options.filter` was provided', function() {
      const filter = {attribute: global.randomString()};
      const query = new Query({filter: filter});
      expect(query.toJSON().filter).to.deep.equal(filter);
    });
  });

  describe('equalTo()', function() {
    it('should add an equal to filter.', function() {
      const value = global.randomString();
      this.query.equalTo(this.field, value);
      expect(this.filter()).to.have.property(this.field, value);
    });

    it('should discard any existing filters on the same field.', function() {
      const value = global.randomString();
      this.query.equalTo(this.field, global.randomString());
      this.query.equalTo(this.field, value);
      expect(this.filter()).to.contain.keys([this.field]);
      expect(this.filter()[this.field]).to.equal(value);
    });

    it('should return the query.', function() {
      const value = this.query.equalTo(this.field, global.randomString());
      expect(value).to.equal(this.query);
    });
  });
});
