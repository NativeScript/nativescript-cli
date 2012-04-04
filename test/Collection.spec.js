// Collection entity namespace
describe('Kinvey.Collection', function() {
  // Make sure user context is available
  before(function() {
    var user = new Kinvey.User({
      username: 'foo',
      password: 'bar'
    });
    user.isLoggedIn = true;
    Kinvey.setCurrentUser(user);
  });
  after(function() {//reset
    Kinvey.setCurrentUser(null);
  });

  // Kinvey.Collection#constructor
  describe('#constructor', function() {
    it('throws an Error on empty name', function() {
      (function() {
        new Kinvey.Collection();
      }.should.throw());
    });
  });

  // Kinvey.Collection#all
  describe('#all', function() {
    beforeEach(function(done) {// create mock
      this.collection = new Kinvey.Collection('test-collection');

      // Add an entity
      new Kinvey.Entity('test-collection', { 'foo': 'bar' }).save(done, done);
    });
    afterEach(function(done) {
      this.collection.clear(done, done);
    });

    it('fetches all entities', function(done) {
      var collection = this.collection;
      collection.all(function() {
        this.should.equal(collection);
        this.list.should.have.length(1);
        done();
      }, function(error) {
        collection.should.equal(this);
        done(new Error(error.error));
      });
    });
  });

});