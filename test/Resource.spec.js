/**
 * Kinvey.Resource test suite.
 */
describe('Kinvey.Resource', function() {

  // Housekeeping: define mock.
  before(function() {
    this.resource = { name: 'foo.txt', data: 'foobarbaz' };
  });

  // Kinvey.Resource#destroy
  describe('#destroy', function() {
    // Housekeeping: create mock.
    beforeEach(function(done) {
      Kinvey.Resource.upload(this.resource.name, this.resource.data, callback(done));
    });

    // Test suite.
    it('destroys a resource.', function(done) {
      Kinvey.Resource.destroy(this.resource.name, callback(done, {
        success: function(_, info) {
          info.network.should.be['true'];
          done();
        }
      }));
    });
  });

  // Kinvey.Resource#download
  describe('#download', function() {
    it('downloads a resource.');
    it('returns the URI for a download.');
  });

  // Kinvey.Resource#upload
  describe('#upload', function() {
    // Housekeeping: destroy mock.
    afterEach(function(done) {
      Kinvey.Resource.destroy(this.resource.name, callback(done));
    });

    // Test suite.
    it('uploads a resource.', function(done) {
      var resource = this.resource;
      Kinvey.Resource.upload(resource.name, resource.data, callback(done, {
        success: function(response, info) {
          response.should.eql(resource);
          info.network.should.be['true'];
          done();
        }
      }));
    });
  });

});