/**
 * Kinvey.UserCollection test suite.
 */
describe('Kinvey.UserCollection', function() {
  // Users need an explicit owner.
  before(function(done) {
    Kinvey.User.create(done, done);
  });
  after(function(done) {
    Kinvey.getCurrentUser().destroy(done, done);
  });

  // Inheritance
  it('extends Kinvey.Collection.', function() {
    var collection = new Kinvey.UserCollection();
    collection.should.be.an.instanceOf(Kinvey.Collection);
    collection.should.be.an.instanceOf(Kinvey.UserCollection);
  });
  it('is extendable.', function() {
    var SuperCollection = Kinvey.UserCollection.extend();
    (new SuperCollection()).should.be.an.instanceOf(Kinvey.UserCollection);
  });

  // Kinvey.Collection#clear
  describe('#clear', function() {
    it('throws an error on invoking.', function() {
      var collection = new Kinvey.UserCollection();
      (function() {
        collection.clear();
      }.should['throw']());
    });
  });

  // Kinvey.UserCollection#count
  describe('#count', function() {
    // Test suite.
    it('counts the number of entities.', function(done) {
      var collection = new Kinvey.UserCollection();
      collection.count(function(count) {
        collection.should.equal(this);
        count.should.equal(1);
        done();
      }, function(error) {
        collection.should.equal(this);
        done(new Error(error.error));
      });
    });
  });

  // Kinvey.Collection#fetch
  describe('#fetch', function() {
    // Test suite.
    it('fetches all users.', function(done) {
      var collection = new Kinvey.UserCollection();
      collection.fetch(function() {
        this.should.equal(collection);
        this.list.should.have.length(1);

        // Test entity.
        this.list[0].should.be.an.instanceOf(Kinvey.User);

        done();
      }, function(error) {
        collection.should.equal(this);
        done(new Error(error.error));
      });
    });
  });

});