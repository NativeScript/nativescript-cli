/**
 * Kinvey.execute test suite.
 */
describe('Kinvey.execute', function() {
  // Destroy the created implicit user.
  after(function(done) {
    Kinvey.getCurrentUser().destroy(callback(done));
  });
  
  // Test suite.
  it('should return the command response.', function(done) {
    var args = { foo: 'bar' };
    Kinvey.execute('rpc-test', args, callback(done, {
      success: function(response) {
        response.foo.should.equal('bar');
        done();
      }
    }));
  });
});