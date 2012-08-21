/**
 * Kinvey.Aggregation.MongoBuilder test suite.
 */
describe('Kinvey.Aggregation.MongoBuilder', function() {
  beforeEach(function() {
    this.agg = new Kinvey.Aggregation.MongoBuilder();
  });

  // Kinvey.Aggregation.MongoBuilder#on
  describe('.on', function() {
    it('adds a key.', function() {
      this.agg.on('foo');
      this.agg.toJSON().key.should.eql({ foo: true });

      this.agg.on('bar');
      this.agg.toJSON().key.should.eql({ foo: true, bar: true });
    });
  });

  // Kinvey.Aggregation.MongoBuilder#finalize
  describe('.setFinalize', function() {
    it('sets a finalize function.', function() {
      var fn = function(out) {
        out.avg = out.total / out.count;
      };
      this.agg.setFinalize(fn);
      this.agg.toJSON().finalize.should.equal(fn.toString());
    });
    it('sets a finalize function as string.', function() {
      var fn = function(out) {
        out.avg = out.total / out.count;
      }.toString();
      this.agg.setFinalize(fn);
      this.agg.toJSON().finalize.should.equal(fn);
    });
  });

  // Kinvey.Aggregation.MongoBuilder#setInitial
  describe('.setInitial', function() {
    it('sets an initial counter object.', function() {
      this.agg.setInitial({ foo: 0 });
      this.agg.toJSON().initial.should.eql({ foo: 0 });
    });
  });

  // Kinvey.Aggregation.MongoBuilder#setQuery
  describe('.setQuery', function() {
    it('sets a query.', function() {
      var query = new Kinvey.Query();
      query.on('foo').equal('bar').lessThan(25);

      this.agg.setQuery(query);
      this.agg.toJSON().condition.should.eql(query.toJSON().query);
    });
  });

  // Kinvey.Aggregation.MongoBuilder#setReduce
  describe('.setReduce', function() {
    it('sets the reduce function.', function() {
      var fn = function(doc, out) {
        out.count++;
      };
      this.agg.setReduce(fn);
      this.agg.toJSON().reduce.should.eql(fn.toString());
    });
    it('sets the reduce function as string.', function() {
      var fn = function(doc, out) {
        out.count++;
      }.toString();
      this.agg.setReduce(fn);
      this.agg.toJSON().reduce.should.eql(fn);
    });
  });
});