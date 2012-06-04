/**
 * Local test suite.
 */
describe('LocalDatabase', function() {
  // Configure network adapter.
  before(function() {
    Kinvey.local = true;
  });
  after(function() {
    Kinvey.local = false;
  });

  // Create mock.
  beforeEach(function() {
    this.entity = new Kinvey.Entity(COLLECTION_UNDER_TEST, {
      key: 'value'
    });
  });

  // Clears entities locally.
  describe('#clear', function() {
    // Create mock.
    beforeEach(function(done) {
      this.entity.save(callback(done));
    });
    afterEach(function(done) {
      this.entity.destroy(callback(done));
    });

    // Test suite.
    it('fails when a query is specified.', function(done) {
      var collection = new Kinvey.Collection(COLLECTION_UNDER_TEST);
      collection.setQuery(new Kinvey.Query().on('foo').equal('bar'));
      collection.clear(callback(done, {
        success: function() {
          done(new Error('Queries are not allowed'));
        },
        error: function() {
          done();
        }
      }));
    });
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

  // Destroy entity locally.
  describe('#destroy', function() {
    // Create mock.
    beforeEach(function(done) {
      this.entity.save(callback(done));
    });

    // Test suite.
    it('destroys an entity.', function(done) {
      this.entity.destroy(callback(done));
    });
  });

  // Fetches entities locally.
  describe('#fetch', function() {
    // Create mock.
    beforeEach(function(done) {
      this.entity.save(callback(done));
    });
    afterEach(function(done) {
      this.entity.destroy(callback(done));
    });

    // Test suite.
    it('fails when a query is specified.', function(done) {
      var collection = new Kinvey.Collection(COLLECTION_UNDER_TEST);
      collection.setQuery(new Kinvey.Query().on('foo').equal('bar'));
      collection.fetch(callback(done, {
        success: function() {
          done(new Error('Queries are not allowed'));
        },
        error: function() {
          done();
        }
      }));
    });
    it('fetches all entities.', function(done) {
      var entity = this.entity;
      new Kinvey.Collection(COLLECTION_UNDER_TEST).fetch(callback(done, {
        success: function(response) {
          response.should.have.length(1);
          response[0].should.eql(entity);
          done();
        }
      }));
    });
  });

  // Load entity locally.
  describe('#load', function() {
    // Create mock.
    beforeEach(function(done) {
      this.entity.save(callback(done));
    });
    afterEach(function(done) {
      this.entity.destroy(callback(done));
    });

    // Test suite.
    it('loads an existing entity.', function(done) {
      var entity = this.entity;
      new Kinvey.Entity(COLLECTION_UNDER_TEST).load(entity.getId(), callback(done, {
        success: function(response) {
          response.should.eql(entity);// Kinvey.Entity
          (response.getId()).should.equal(entity.getId());
          done();
        }
      }));
    });
    it('loads an nonexistent entity.', function(done) {
      new Kinvey.Entity(COLLECTION_UNDER_TEST).load('foo', callback(done, {
        success: function() {
          done(new Error('Entity should not exist.'));
        },
        error: function() {
          done();
        }
      }));
    });
  });

  // Pinging the local database is not possible.
  describe('#ping', function() {
    it('fails when pinging the local database.', function(done) {
      Kinvey.ping(callback(done, {
        success: function(response) {
          response.should.have.property('kinvey');
          response.should.have.property('version');
          done();
        }
      }));
    });
  });

  // Save entity locally.
  describe('#save', function() {
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
      entity.save(callback(done, {
        success: function(response) {
          response.set('foo', 'bar');
          response.save(callback(done, {
            success: function(response) {
              response.should.equal(entity);// Kinvey.Entity
              (response.get('foo')).should.equal('bar');
              done();
            }
          }));
        }
      }));
    });
  });

});