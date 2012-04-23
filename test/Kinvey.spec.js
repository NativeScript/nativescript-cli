/**
 * Top-level test suite.
 */
describe('Kinvey', function() {

  // Kinvey#init
  describe('#init', function() {
    it('throws an Error on empty appKey.', function() {
      (function() {
        Kinvey.init({ appSecret: 'foo' });
      }.should['throw']());
    });
    it('throws an Error on empty appSecret.', function() {
      (function() {
        Kinvey.init({ appKey: 'foo' });
      }.should['throw']());
    });
  });

  // Kinvey#ping
  describe('#ping', function() {
    // Destroy the created anonymous user.
    after(function(done) {
      Kinvey.getCurrentUser().destroy(callback(done));
    });

    it('pings the Kinvey service', function(done) {
      Kinvey.ping(callback(done, {
        success: function(response) {
          response.should.have.property('kinvey');
          response.should.have.property('version');
          done();
        }
      }));
    });
  });

});