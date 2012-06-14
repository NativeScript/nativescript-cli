/**
 * Kinvey.Entity test suite.
 */
describe('Kinvey.Entity', function() {
  // Destroy the created anonymous user.
  after(function(done) {
    Kinvey.getCurrentUser().destroy(callback(done));
  });

  // Inheritance
  it('is extendable.', function() {
    var TestEntity = Kinvey.Entity.extend({
      constructor: function() {
        Kinvey.Entity.prototype.constructor.call(this, {}, COLLECTION_UNDER_TEST);
      }
    });
    (new TestEntity()).should.be.an.instanceOf(Kinvey.Entity);
  });

  // Kinvey.Entity#constructor
  describe('#constructor', function() {
    it('throws an Error on empty collection.', function() {
      (function() {
        new Kinvey.Entity();
      }.should['throw']());
    });
  });

  // Kinvey.Entity#destroy
  describe('#destroy', function() {
    // Create mock.
    beforeEach(function(done) {
      this.entity = new Kinvey.Entity({}, COLLECTION_UNDER_TEST);
      this.entity.save(callback(done));
    });

    // Test suite.
    it('destroys an entity.', function(done) {
      this.entity.destroy(callback(done));
    });
  });

  // Kinvey.Entity#load
  describe('#load', function() {
    // Create mock.
    beforeEach(function(done) {
      this.entity = new Kinvey.Entity({}, COLLECTION_UNDER_TEST);
      this.entity.save(callback(done));
    });
    afterEach(function(done) {
      this.entity.destroy(callback(done));
    });

    // Test suite.
    it('loads an entity.', function(done) {
      var entity = this.entity;
      new Kinvey.Entity({}, COLLECTION_UNDER_TEST).load(entity.getId(), callback(done, {
        success: function(response) {
          response.should.eql(entity);// Kinvey.Entity
          (response.getId()).should.equal(entity.getId());
          done();
        }
      }));
    });
  });

  // Kinvey.Entity#save
  describe('#save', function() {
    // Create mock.
    beforeEach(function() {
      this.entity = new Kinvey.Entity({ key: 'value' }, COLLECTION_UNDER_TEST);
    });
    afterEach(function(done) {
      this.entity.destroy(callback(done));
    });

    // Test suite.
    it('saves a new entity.', function(done) {
      var entity = this.entity;
      entity.save(callback(done, {
        success: function(response) {
          response.should.equal(entity);// Kinvey.Entity
          (null !== response.getId()).should.be.True;// id is auto-generated
          (response.get('key')).should.equal('value');
          done();
        }
      }));
    });
    it('updates an existing entity.', function(done) {
      var entity = this.entity;
      entity.set('baz', 'quux');
      entity.save(callback(done, {
        success: function(response) {
          response.should.equal(entity);// Kinvey.Entity
          (response.get('baz')).should.equal('quux');
          done();
        }
      }));
    });
  });

});