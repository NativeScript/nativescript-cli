/**
 * Kinvey.Collection test suite.
 */
describe('Kinvey.Collection', function() {
  // Destroy the created implicit user.
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
  describe('.constructor', function() {
    it('throws an Error on empty name.', function() {
      (function() {
        new Kinvey.Collection();
      }.should['throw']());
    });
  });

  // Kinvey.Collection#clear
  describe('.clear', function() {
    // Create mock.
    beforeEach(function(done) {
      new Kinvey.Entity({ foo: 'bar' }, COLLECTION_UNDER_TEST).save(callback(done));
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
  describe('.count', function() {
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
        success: function(count) {
          count.should.equal(1);
          done();
        }
      }));
    });
    it('counts the number of entities with no match.', function(done) {
      var collection = this.collection;
      collection.setQuery(new Kinvey.Query().on('bar').equal('baz'));
      collection.count(callback(done, {
        success: function(count) {
          count.should.equal(0);
          collection.setQuery(null);// Clear query.
          done();
        }
      }));
    });
  });

  // Kinvey.Collection#fetch
  describe('.fetch', function() {
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
        success: function(list) {
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
        success: function(list) {
          list.should.have.length(1);
          list[0].should.be.an.instanceOf(MyEntity);
          list[0].get('foo').should.equal('bar');
          done();
        }
      }));
    });
  });

  // Kinvey.Collection#fetch
  describe('.fetch [relational]', function() {
    // Housekeeping: create mock.
    beforeEach(function(done) {
      this.collection = new Kinvey.Collection(COLLECTION_UNDER_TEST);

      this.entity = new Kinvey.Entity({}, COLLECTION_UNDER_TEST);
      this.entity.set('bar', {
        _type: 'KinveyRef',
        _collection: COLLECTION_UNDER_TEST,
        _id: 'bar',
        _obj: { _id: 'bar', bar: true }
      });
      this.entity.save(callback(done));
    });
    afterEach(function(done) {
      this.collection.clear(callback(done));
    });

    // Test suite.
    it('resolves a reference.', function(done) {
      this.collection.fetch(callback(done, {
        resolve: ['bar'],
        success: function(list) {
          list.should.have.length(2);// Entity + reference.
          list.forEach(function(entity) {
            if('bar' !== entity.getId()) {// Entity.
              entity.get('bar').should.be.an['instanceof'](Kinvey.Entity);
              entity.get('bar').get('bar').should.be['true'];
            }
          });

          done();
        }
      }));
    });
  });

});