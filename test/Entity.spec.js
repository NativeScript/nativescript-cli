// Test entity namespace
describe('Kinvey.Entity', function() {
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

  // Kinvey.Entity#constructor
  describe('#constructor', function() {
    it('throws an Error on empty collection', function() {
      (function() {
        new Kinvey.Entity();
      }.should.throw());
    });
  });

  // Kinvey.Entity#destroy
  describe('#destroy', function() {
    beforeEach(function(done) {// create mock
      this.entity = new Kinvey.Entity('test-collection', { _id: 'test-id' });
      this.entity.save(done, done);
    });

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
    beforeEach(function(done) {// create mock
      new Kinvey.Entity('test-collection', { _id: 'test-id' }).save(done, done);
    });
    afterEach(function(done) {// destroy mock
      new Kinvey.Entity('test-collection', { _id: 'test-id' }).destroy(done, done);
    });

    it('loads an entity', function(done) {
      var entity = new Kinvey.Entity('test-collection');
      entity.load('test-id', function() {
        this.should.equal(entity);
        (this.getId()).should.equal('test-id');
        done();
      }, function(error) {
        this.should.equal(entity);
        done(new Error(error.error));
      });
    });
  });

  // Kinvey.Entity#save
  describe('#save', function() {
    before(function() {
      this.entity = new Kinvey.Entity('test-collection', { foo: 'bar' });
    });
    after(function(done) {// cleanup
      this.entity.destroy(done, done);
    });

    it('saves a new entity', function(done) {
      var entity = this.entity;
      entity.save(function() {
        this.should.equal(entity);
        (this.getId()).should.not.equal(null);// id is auto-generated
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