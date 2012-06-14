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
    beforeEach(function(done) {
      new Kinvey.Entity({ foo: 'bar' }, COLLECTION_UNDER_TEST).save(callback(done));
    });

    // Test suite.
    it('clears all entities.', function(done) {
      new Kinvey.Collection(COLLECTION_UNDER_TEST).clear(callback(done, {
        success: function(collection) {
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
      new Kinvey.Entity({ foo: 'bar' }, COLLECTION_UNDER_TEST).save(callback(done));
    });
    afterEach(function(done) {
      this.collection.clear(callback(done));
    });

    // Test suite.
    it('counts the number of entities.', function(done) {
      this.collection.count(callback(done, {
        success: function(_, count) {
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
      new Kinvey.Entity({ foo: 'bar' }, COLLECTION_UNDER_TEST).save(callback(done));
    });
    afterEach(function(done) {
      this.collection.clear(callback(done));
    });

    // Test suite.
    it('fetches all entities.', function(done) {
      this.collection.fetch(callback(done, {
        success: function(_, list) {
          list.should.have.length(1);
          list[0].should.be.an.instanceOf(Kinvey.Entity);
          done();
        }
      }));
    });

    it('fetches custom entities.', function(done) {
      var MyEntity = Kinvey.Entity.extend({
        constructor: function(attr) {
          Kinvey.Entity.prototype.constructor.call(this, attr, COLLECTION_UNDER_TEST);
        }
      });
      var MyCollection = Kinvey.Collection.extend({
        entity: MyEntity,
        constructor: function(query) {
          Kinvey.Collection.prototype.constructor.call(this, COLLECTION_UNDER_TEST, query);
        }
      });

      new MyCollection().fetch(callback(done, {
        success: function(_, list) {
          list.should.have.length(1);
          list[0].should.be.an.instanceOf(MyEntity);
          list[0].get('foo').should.equal('bar');
          done();
        }
      }));
    });
  });

});