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

  // Kinvey.Entity#load
  describe('#load [relational]', function() {
    // Housekeeping: create mock.
    beforeEach(function(done) {
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
      new Kinvey.Collection(COLLECTION_UNDER_TEST).clear(callback(done));
    });

    // Test suite.
    it('leaves non-resolved references as is.', function(done) {
      this.entity.load(this.entity.getId(), callback(done, {
        success: function(entity) {
          entity.get('bar').should.eql({
            _type: 'KinveyRef',
            _collection: COLLECTION_UNDER_TEST,
            _id: 'bar'
          });
          done();
        }
      }));
    });
    it('resolves a reference.', function(done) {
      this.entity.load(this.entity.getId(), callback(done, {
        resolve: ['bar'],
        success: function(entity) {
          entity.get('bar').should.be.an['instanceof'](Kinvey.Entity);
          entity.get('bar').get('bar').should.be['true'];
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
          (null !== response.getId()).should.be['true'];// id is auto-generated
          (response.get('key')).should.equal('value');
          done();
        }
      }));
    });
    it('saves a new entity with a predefined id.', function(done) {
      var entity = this.entity;
      entity.setId('foo');
      entity.save(callback(done, {
        success: function(response) {
          response.should.equal(entity);// Kinvey.Entity
          response.getId().should.equal('foo');
          done();
        }
      }));
    });
    it('updates an existing entity.', function(done) {
      var entity = this.entity;
      entity.set('baz', 'quux');
      entity.save(callback(done, {
        success: function(response) {
          response.save(callback(done, {
            success: function(response) {
              response.should.equal(entity);// Kinvey.Entity
              (response.get('baz')).should.equal('quux');
              done();
            }
          }));
        }
      }));
    });
  });

  // Kinvey.Entity#save
  describe('#save [relational]', function() {
    // Housekeeping: create mock.
    beforeEach(function() {
      this.entity = new Kinvey.Entity({}, COLLECTION_UNDER_TEST);
      this.entity.set('bar', {
        _type: 'KinveyRef',
        _collection: COLLECTION_UNDER_TEST,
        _id: 'bar',
        _obj: { _id: 'bar', bar: true }
      });
    });
    afterEach(function(done) {
      new Kinvey.Collection(COLLECTION_UNDER_TEST).clear(callback(done));
    });

    // Test suite.
    it('saves a relational structure.', function(done) {
      var entity = this.entity;
      entity.save(callback(done, {
        success: function(response) {
          // Structure should be identical to pre-save.
          response.should.equal(entity);

          // Reference should have been saved too.
          (null !== entity.get('bar').getMetadata().lastModified).should.be['true'];

          done();
        }
      }));
    });
    it('fails on saving a circular reference.', function(done) {
      this.entity.set('foo', this.entity);
      this.entity.save(callback(done, {
        success: function() {
          done(new Error('Success callback was invoked'));
        },
        error: function(error) {
          error.error.should.equal(Kinvey.Error.OPERATION_DENIED);
          done();
        }
      }));
    });
  });

  // Kinvey.Entity#set
  describe('#set [relational]', function() {
    // Housekeeping: create mock and reference mock.
    beforeEach(function() {
      this.entity = new Kinvey.Entity({}, COLLECTION_UNDER_TEST);
      this.ref = {
        _type: 'KinveyRef',
        _collection: COLLECTION_UNDER_TEST,
        _id: 'bar',
        _obj: { _id: 'bar', bar: true }
      };
    });

    // Test suite.
    it('parses a relational property.', function() {
      this.entity.set('bar', this.ref);

      // Test relation.
      this.entity.get('bar').should.be.an['instanceof'](Kinvey.Entity);
      this.entity.get('bar').get('bar').should.be['true'];
    });
    it('parses a nested relational property.', function() {
      this.entity.set('bar', { baz: this.ref });

      // Test relation.
      this.entity.get('bar').baz.should.be.an['instanceof'](Kinvey.Entity);
      this.entity.get('bar').baz.get('bar').should.be['true'];
    });
    it('parses a relational array member.', function() {
      this.entity.set('bar', [ this.ref ]);

      // Test relation.
      this.entity.get('bar')[0].should.be.an['instanceof'](Kinvey.Entity);
      this.entity.get('bar')[0].get('bar').should.be['true'];
    });

    it('parses a mapped relational property.', function() {
      // Create and map class definition.
      var MyEntity = Kinvey.Entity.extend({});
      this.entity.map.bar = MyEntity;
      this.entity.set('bar', this.ref);

      // Test relation.
      this.entity.get('bar').should.be.an['instanceof'](Kinvey.Entity);
      this.entity.get('bar').should.be.an['instanceof'](MyEntity);
      this.entity.get('bar').get('bar').should.be['true'];
    });
    it('parses nested relational properties.', function() {
      // Append reference to itself.
      this.ref._obj.bar = {
        _type: 'KinveyRef',
        _collection: COLLECTION_UNDER_TEST,
        _id: 'baz',
        _obj: { _id: 'baz', baz: true }
      };
      this.entity.set('bar', this.ref);

      // Test relation.
      this.entity.get('bar').should.be.an['instanceof'](Kinvey.Entity);
      this.entity.get('bar').get('bar').should.be.an['instanceof'](Kinvey.Entity);
      this.entity.get('bar').get('bar').get('baz').should.be['true'];
    });
  });

});