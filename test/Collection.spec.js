/**
 * Kinvey.Collection test suite.
 */
describe('Kinvey.Collection', function() {
  // Destroy the created anonymous user.
  after(function(done) {
    Kinvey.getCurrentUser().destroy(done, done);
  });

  // Inheritance
  it('is extendable.', function() {
    var TestCollection = Kinvey.Collection.extend({
      constructor: function() {
        Kinvey.Collection.prototype.constructor.call(this, COLLECTION_UNDER_TEST);
      }
    });
    (new TestCollection()).should.be.an.instanceOf(Kinvey.Collection);
  });

  // Kinvey.Collection#constructor
  describe('#constructor', function() {
    it('throws an Error on empty name.', function() {
      (function() {
        new Kinvey.Collection();
      }.should['throw']());
    });
  });

  // Kinvey.Collection#clear
  describe('#clear', function() {
    // Create mock.
    beforeEach(function(done) {// create mock
      new Kinvey.Entity(COLLECTION_UNDER_TEST, { 'foo': 'bar' }).save(done, done);
    });

    // Test suite.
    it('clears all entities.', function(done) {
      var collection = new Kinvey.Collection(COLLECTION_UNDER_TEST);
      collection.clear(function() {
        this.should.equal(collection);
        this.list.should.have.length(0);
        done();
      }, function(error) {
        collection.should.equal(this);
        done(new Error(error.error));
      });
    });
  });

  // Kinvey.Collection#count
  describe('#count', function() {
    // Create mock.
    beforeEach(function(done) {// create mock
      this.collection = new Kinvey.Collection(COLLECTION_UNDER_TEST);
      new Kinvey.Entity(COLLECTION_UNDER_TEST, { 'foo': 'bar' }).save(done, done);
    });
    afterEach(function(done) {
      this.collection.clear(done, done);
    });

    // Test suite.
    it('counts the number of entities.', function(done) {
      var collection = this.collection;
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
    // Create mock.
    beforeEach(function(done) {// create mock
      this.collection = new Kinvey.Collection(COLLECTION_UNDER_TEST);
      new Kinvey.Entity(COLLECTION_UNDER_TEST, { 'foo': 'bar' }).save(done, done);
    });
    afterEach(function(done) {
      this.collection.clear(done, done);
    });

    // Test suite.
    it('fetches all entities.', function(done) {
      var collection = this.collection;
      collection.fetch(function() {
        this.should.equal(collection);
        this.list.should.have.length(1);

        // Test entity.
        this.list[0].should.be.an.instanceOf(Kinvey.Entity);

        done();
      }, function(error) {
        collection.should.equal(this);
        done(new Error(error.error));
      });
    });
  });

});