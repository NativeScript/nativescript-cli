// Test user namespace
describe('Kinvey.User', function() {

  // Inheritance
  it('extends Kinvey.Entity', function() {
    var user = new Kinvey.User();
    user.should.be.an.instanceof(Kinvey.Entity);
    user.should.be.an.instanceof(Kinvey.User);
  });

  // Kinvey.User#destroy
  describe('#destroy', function() {
    it('cannot destroy a user', function() {
      (function() {
        new Kinvey.User({ _id: 'test-id' }).destroy();
      }.should.throw());
    });
  });

  // Kinvey.User#login
  describe('#login', function() {
    it('authenticates a known user');
  });

  // Kinvey.User#logout
  describe('#logout', function() {
    it('logs out current user');
  });

  // Kinvey.User#load
  describe('#load', function() {
    it('loads a user');
  });

  // Kinvey.User#save
  describe('#save', function() {
    it('Saves a new user');
    it('Updates an existing user');
  });

});