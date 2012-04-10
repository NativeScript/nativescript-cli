/**
 * Kinvey.Entity test suite.
 */
describe('Kinvey.Entity', function() {
  // Entities need an owner.
  before(function(done) {
    this.user = Kinvey.User.create(done, done);
  });
  after(function(done) {
    this.user.destroy(done, done);
  });

  // Inheritance
  it('is extendable.', function() {
    var TestEntity = Kinvey.Entity.extend({
      constructor: function() {
        Kinvey.Entity.prototype.constructor.call(this, 'test-collection');
      }
    });
    (new TestEntity()).should.be.an.instanceof(Kinvey.Entity);
  });

  // Kinvey.Entity#constructor
  describe('#constructor', function() {
    it('throws an Error on empty collection.', function() {
      (function() {
        new Kinvey.Entity();
      }.should.throw());
    });
  });

  // Kinvey.Entity#destroy
  describe('#destroy', function() {
    // Create mock.
    beforeEach(function(done) {
      this.entity = new Kinvey.Entity('test-collection');
      this.entity.save(done, done);
    });

    // Test suite.
    it('destroys an entity', function(done) {
      var entity = this.entity;
      entity.destroy(function() {
        this.should.equal(entity);
        done();
      }, function(error) {
        this.should.equal(entity);
        done(new Error(error.error));
      });
    });
  });

  // Kinvey.Entity#load
  describe('#load', function() {
    // Create mock.
    beforeEach(function(done) {
      this.entity = new Kinvey.Entity('test-collection');
      this.entity.save(done, done);
    });
    afterEach(function(done) {
      this.entity.destroy(done, done);
    });

    // Test suite.
    it('loads an entity', function(done) {
      var id = this.entity.getId();
     
      var entity = new Kinvey.Entity('test-collection');
      entity.load(id, function() {
        this.should.equal(entity);
        (this.getId()).should.equal(id);
        done();
      }, function(error) {
        this.should.equal(entity);
        done(new Error(error.error));
      });
    });
  });

  // Kinvey.Entity#save
  describe('#save', function() {
    // Create mock.
    beforeEach(function() {
      this.entity = new Kinvey.Entity('test-collection', { key: 'value' });
    });
    afterEach(function(done) {
      this.entity.destroy(done, done);
    });

    // Test suite.
    it('saves a new entity', function(done) {
      var entity = this.entity;
      entity.save(function() {
        this.should.equal(entity);
        (this.getId()).should.not.equal(null);// id is auto-generated
        (this.get('key')).should.equal('value');
        done();
      }, function(error) {
        this.should.equal(entity);
        done(new Error(error.error));
      });
    });
    it('updates an existing entity', function(done) {
      var entity = this.entity;
      entity.set('baz', 'quux');
      entity.save(function() {
        this.should.equal(entity);
        (this.get('baz')).should.equal('quux');
        done();
      }, function(error) {
        this.should.equal(entity);
        done(new Error(error.error));
      });
    });
  });

});