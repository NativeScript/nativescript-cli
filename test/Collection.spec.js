/**
 * Kinvey.Collection test suite.
 */
describe('Kinvey.Collection', function() {
  // Destroy the created anonymous user.
  after(function(done) {
    Kinvey.getCurrentUser().destroy(callback(done));
  });

  // Inheritance
  it('is extendable.', function() {
    var TestCollection = Kinvey.Collection.extend({
      constructor: function() {
        Kinvey.Collection.prototype.constructor
            .call(this, COLLECTION_UNDER_TEST);
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
      new Kinvey.Entity(COLLECTION_UNDER_TEST, {
        'foo': 'bar'
      }).save(callback(done));
    });

    // Test suite.
    it('clears all entities.', function(done) {
      var collection = new Kinvey.Collection(COLLECTION_UNDER_TEST);
      collection.clear(callback(done, {
        success: function() {
          collection.list.should.have.length(0);
          done();
        }
      }));
    });
  });

  // Kinvey.Collection#count
  describe('#count', function() {
    // Create mock.
    beforeEach(function(done) {// create mock
      this.collection = new Kinvey.Collection(COLLECTION_UNDER_TEST);
      new Kinvey.Entity(COLLECTION_UNDER_TEST, {
        'foo': 'bar'
      }).save(callback(done));
    });
    afterEach(function(done) {
      this.collection.clear(callback(done));
    });

    // Test suite.
    it('counts the number of entities.', function(done) {
      this.collection.count(callback(done, {
        success: function(count) {
          count.should.equal(1);
          done();
        }
      }));
    });
  });

  // Kinvey.Collection#fetch
  describe('#fetch', function() {
    // Create mock.
    beforeEach(function(done) {// create mock
      this.collection = new Kinvey.Collection(COLLECTION_UNDER_TEST);
      new Kinvey.Entity(COLLECTION_UNDER_TEST, {
        'foo': 'bar'
      }).save(callback(done));
    });
    afterEach(function(done) {
      this.collection.clear(callback(done));
    });

    // Test suite.
    it('fetches all entities.', function(done) {
      this.collection.fetch(callback(done, {
        success: function(list) {
          list.should.have.length(1);
          list[0].should.be.an.instanceOf(Kinvey.Entity);
          done();
        }
      }));
    });
  });

});