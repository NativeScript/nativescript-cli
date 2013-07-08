/**
 * Test suite for `Auth`.
 */
describe('Kinvey.Auth', function() {

  // Kinvey.Auth.Default.
  describe('the Default method', function() {

    // Housekeeping: spy on user save.
    before(function() {
      sinon.spy(Kinvey.User, 'create');
    });
    beforeEach(function() {// Reset.
      Kinvey.User.create.reset();
    });
    after(function() {// Restore.
      Kinvey.User.create.restore();
    });

    // Housekeeping: manage the active user.
    afterEach(function() {// Delete the created implicit user.
      var user = Kinvey.getActiveUser();
      return Kinvey.User.destroy(user._id, { hard: true });
    });

    // Test suite.
    it('should create only one implicit user on concurrent requests.', function() {
      // Fire two non-identical requests.
      var promise = Kinvey.Defer.all([
        Kinvey.DataStore.find(this.collection),
        Kinvey.DataStore.find(this.collection)
      ]);
      return promise.then(function() {
        expect(Kinvey.User.create).to.be.calledOnce;
      });
    });

  });

});