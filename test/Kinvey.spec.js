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
    it('throws an Error on empty appSecret and masterSecret.', function() {
      (function() {
        Kinvey.init({ appKey: 'foo' });
      }.should['throw']());
    });
  });

  // Kinvey#ping
  describe('#ping', function() {
    // Destroy the created anonymous user.
    afterEach(function(done) {
      Kinvey.masterSecret = null;// unset
      var user = Kinvey.getCurrentUser();
      user ? user.destroy(callback(done)) : done();
    });

    it('pings the Kinvey service.', function(done) {
      Kinvey.ping(callback(done, {
        success: function(response) {
          (null !== Kinvey.getCurrentUser()).should.be.True;
          response.should.have.property('kinvey');
          response.should.have.property('version');
          done();
        }
      }));
    });
    it('pings the Kinvey service using the master secret.', function(done) {
      Kinvey.masterSecret = MASTER_SECRET;// set property directly
      Kinvey.ping(callback(done, {
        success: function(response) {
          (null === Kinvey.getCurrentUser()).should.be.True;
          response.should.have.property('kinvey');
          response.should.have.property('version');
          done();
        }
      }));
    });
  });

});