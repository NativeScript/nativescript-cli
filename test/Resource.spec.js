/**
 * Kinvey.Resource test suite.
 */
describe('Kinvey.Resource', function() {

  // Housekeeping: define mock.
  before(function() {
    this.resource = { name: 'foo.txt', data: 'foobarbaz' };
  });

  // Kinvey.Resource#destroy
  describe('.destroy', function() {
    // Housekeeping: create mock.
    beforeEach(function(done) {
      Kinvey.Resource.upload(this.resource, callback(done));
    });

    // Test suite.
    it('destroys a resource.', function(done) {
      Kinvey.Resource.destroy(this.resource.name, callback(done, {
        success: function(_, info) {
          (null === _).should.be['true'];
          info.network.should.be['true'];
          done();
        }
      }));
    });
  });

  // Kinvey.Resource#download
  describe('.download', function() {
    // Housekeeping: create mock.
    before(function(done) {
      Kinvey.Resource.upload(this.resource, callback(done));
    });
    after(function(done) {
      Kinvey.Resource.destroy(this.resource.name, callback(done));
    });

    // Test suite.
    it('downloads a resource.', function(done) {
      var resource = this.resource;
      Kinvey.Resource.download(resource.name, callback(done, {
        success: function(file) {
          file.should.eql(resource);
          done();
        }
      }));
    });
    it('returns the URI for a download.', function(done) {
      var resource = this.resource;
      Kinvey.Resource.download(resource.name, callback(done, {
        download: false,
        success: function(file) {
          file.should.have.property('URI');
          file.URI.indexOf('http://').should.equal(0);
          done();
        }
      }));
    });
  });

  // Kinvey.Resource#upload
  describe('.upload', function() {
    // Housekeeping: destroy mock.
    afterEach(function(done) {
      Kinvey.Resource.destroy(this.resource.name, callback(done));
    });

    // Test suite.
    it('uploads a resource.', function(done) {
      var resource = this.resource;
      Kinvey.Resource.upload(resource, callback(done, {
        success: function(response, info) {
          response.should.eql(resource);
          info.network.should.be['true'];
          done();
        }
      }));
    });
  });

});