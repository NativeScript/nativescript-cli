/**
 * Kinvey.Store.Rpc test suite.
 */
describe('Kinvey.Store.Rpc', function() {
  // Housekeeping.
  before(function() {
    this.store = new Kinvey.Store.Rpc();
  });

  // Kinvey.Store.Rpc#resetPassword
  describe('.resetPassword', function() {
    // Housekeeping: maintain current user.
    before(function(done) {
      Kinvey.User.create({}, callback(done));
    });
    after(function(done) {
      Kinvey.getCurrentUser().destroy(callback(done));
    });

    // Test suite.
    it('resets password.', function(done) {
      var username = Kinvey.getCurrentUser().getUsername();
      this.store.resetPassword(username, callback(done, {
        success: function(_, info) {
          info.network.should.be['true'];
          done();
        }
      }));
    });
  });
});