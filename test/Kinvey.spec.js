/**
 * Top-level test suite.
 */
describe('Kinvey', function() {

  // Kinvey#init
  describe('.init', function() {
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
  describe('.ping', function() {
    // Housekeeping.
    afterEach(function() {
      // Unset the master secret.
      delete Kinvey.masterSecret;
    });

    // Test suite.
    it('pings the Kinvey service using the app secret.', function(done) {
      Kinvey.ping(callback(done, {
        success: function(response) {
          (null === Kinvey.getCurrentUser()).should.be['true'];
          response.should.have.property('kinvey');
          response.should.have.property('version');
          done();
        }
      }));
    });
    it('pings the Kinvey service using the master secret.', function(done) {
      Kinvey.masterSecret = MASTER_SECRET;// Set property directly.
      Kinvey.ping(callback(done, {
        success: function(response) {
          (null === Kinvey.getCurrentUser()).should.be['true'];
          response.should.have.property('kinvey');
          response.should.have.property('version');
          done();
        }
      }));
    });
    it('should timeout when the timeout option is set to 1ms.', function(done) {
      Kinvey.ping(callback(done, {
        timeout: 1,
        success: function() {
          done(new Error("Success callback was invoked."));
        },
        error: function(e) {
          e.error.should.equal(Kinvey.Error.REQUEST_FAILED);
          e.description.should.equal('The request timed out');
          done();
        }
      }));
    });
  });

});