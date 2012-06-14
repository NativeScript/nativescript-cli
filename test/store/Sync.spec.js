/**
 * Kinvey.Store.Sync test suite.
 */
describe('Kinvey.Store.Sync', function() {
  before(function() {
    this.store = new Kinvey.Store.Sync(COLLECTION_UNDER_TEST);
  });
  after(function(done) {
    Kinvey.getCurrentUser().destroy(callback(done));
  });

  // Kinvey.Store.Sync#query
  describe('#query', function() {
    before(function(done) {
      this.object = { _id: 'id', foo: 'bar' };
      this.store.save(this.object, callback(done));
    });
    after(function(done) {
      this.store.remove(this.object, callback(done));
    });

    // Test suite.
    it('loads an object.', function(done) {
      // Expect success callback to be invoked twice, once local, once remote.
      var pass = 0;

      var object = this.object;
      this.store.query(object._id, callback(done, {
        success: function(response, info) {
          response._id.should.equal(object._id);
          response.foo.should.equal('bar');

          1 === ++pass ? info.cache.should.eql(true) : done();
        }
      }));
    });
  });

});