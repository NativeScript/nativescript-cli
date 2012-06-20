/**
 * Kinvey.Store.Offline test suite.
 */
describe('Kinvey.Store.Offline', function() {
  before(function() {
    this.store = new Kinvey.Store.Offline(COLLECTION_UNDER_TEST);
    this.cached = this.store.cached;
    this.network = this.store.network;
  });
  after(function(done) {
    var cached = this.cached;
    Kinvey.getCurrentUser().destroy(callback(done, {
      success: function() {
        cached.purge(callback(done));
      }
    }));
  });

  // Kinvey.Store.Offline#remove
  describe('#remove', function() {
    before(function(done) {
      this.object = { _id: 'foo', bar: 'baz' };
      this.network.save(this.object, callback(done));
    });

    // Test suite.
    it('removes and synchronizes an object.', function(done) {
      this.store.remove(this.object, callback(done, {
        success: function(_, info) {
          info.cache.should.be['true'];
        }
      }));
    });
  });

  // Kinvey.Store.Offline#save
  describe('#save', function() {
    before(function(done) {
      this.object = { _id: 'foo', bar: 'baz' };
      this.network.save(this.object, callback(done));
    });
    after(function(done) {
      this.network.remove(this.object, callback(done));
    });

    // Test suite.
    it('saves and synchronizes an object.', function(done) {
      var object = this.object;
      this.store.save(object, callback(done, {
        success: function(response, info) {
          response.should.eql(object);
          info.cache.should.be['true'];
        }
      }));
    });
  });

});