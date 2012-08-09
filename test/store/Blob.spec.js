/**
 * Kinvey.Store.Blob test suite.
 */
describe('Kinvey.Store.Blob', function() {
  before(function() {
    this.store = new Kinvey.Store.Blob();
  });
  after(function(done) {
    Kinvey.getCurrentUser().destroy(callback(done));
  });

  // Kinvey.Store.Blob#query
  describe('#query', function() {
    // Housekeeping: mock file.
    before(function(done) {
      this.file = { name: 'foo.txt', data: 'This is foo.txt' };
      this.store.save(this.file, callback(done));
    });
    after(function(done) {
      this.store.remove(this.file, callback(done));
    });

    // Test suite.
    it('returns a file.', function(done) {
      var file = this.file;
      this.store.query(file.name, callback(done, {
        success: function(response, info) {
          response.should.eql(file);
          info.network.should.be['true'];
          done();
        }
      }));
    });
    it('returns a file URI.', function(done) {
      this.store.query(this.file.name, callback(done, {
        download: false,
        success: function(response, info) {
          response.URI.indexOf('http://').should.equal(0);
          info.network.should.be['true'];
          done();
        }
      }));
    });
  });

  // Kinvey.Store.Blob#remove
  describe('#remove', function() {
    // Housekeeping: mock file.
    before(function(done) {
      this.file = { name: 'foo.txt', data: 'This is foo.txt' };
      this.store.save(this.file, callback(done));
    });

    // Test suite.
    it('removes a file.', function(done) {
      this.store.remove(this.file, callback(done, {
        success: function(_, info) {
          info.network.should.be['true'];
          done();
        }
      }));
    });
  });
    
  // Kinvey.Store.Blob#save
  describe('#save', function() {
    // Housekeeping: mock file.
    before(function() {
      this.file = { name: 'foo.txt', data: 'This is foo.txt' };
    });
    afterEach(function(done) {
      this.store.remove(this.file, callback(done));
    });

    // Test suite.
    it('saves a file.', function(done) {
      var file = this.file;
      this.store.save(file, callback(done, {
        success: function(response, info) {
          response.should.eql(file);
          info.network.should.be['true'];
          done();
        }
      }));
    });
  });

});