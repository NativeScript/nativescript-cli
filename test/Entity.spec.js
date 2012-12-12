/**
 * Kinvey.Entity test suite.
 */
describe('Kinvey.Entity', function() {
  // Destroy the created implicit user.
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
  describe('.constructor', function() {
    it('throws an Error on empty collection.', function() {
      (function() {
        new Kinvey.Entity();
      }.should['throw']());
    });
  });

  // Kinvey.Entity#destroy
  describe('.destroy', function() {
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
  describe('.load', function() {
    // Housekeeping: create mock.
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
          response.getId().should.equal(entity.getId());
          response.attr.should.eql(entity.attr);
          done();
        }
      }));
    });
  });

  // Kinvey.Entity#load
  describe('.load [relational]', function() {
    // Housekeeping: create and save mock with a reference.
    beforeEach(function(done) {
      this.reference = new Kinvey.Entity({ bar: true }, COLLECTION_UNDER_TEST);
      this.entity = new Kinvey.Entity({ foo: this.reference }, COLLECTION_UNDER_TEST);
      this.entity.save(callback(done));
    });
    afterEach(function(done) {
      var reference = this.reference;
      this.entity.destroy(callback(done, {
        success: function() {
          reference.destroy(callback(done));
        }
      }));
    });

    // Test suite.
    it('does not resolve a reference.', function(done) {
      var reference = this.reference;
      this.entity.load(this.entity.getId(), callback(done, {
        success: function(entity) {
          entity.get('foo').should.eql({
            _type: 'KinveyRef',
            _collection: COLLECTION_UNDER_TEST,
            _id: reference.getId()
          });
          done();
        }
      }));
    });/*
    it('resolves a reference.', function(done) {
      var reference = this.reference;
      this.entity.load(this.entity.getId(), callback(done, {
        resolve: ['foo'],
        success: function(entity) {
          entity.get('foo').should.be.an['instanceof'](Kinvey.Entity);
          entity.get('foo').attr.should.eql(reference.attr);
          done();
        }
      }));
    });*/
  });

  // Kinvey.Entity#save
  describe('.save', function() {
    // Housekeeping: create mock.
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
    it('saves a new entity with a predefined id with reserved characters.', function(done) {
      var entity = this.entity;
      var id = '~!@#?=$%^&*()€áç<>,./\\';
      entity.setId(id);
      entity.save(callback(done, {
        success: function(response) {
          response.should.equal(entity);// Kinvey.Entity
          response.getId().should.equal(id);
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
  describe('.save [relational]', function() {
    // Housekeeping: create mock with a reference.
    beforeEach(function() {
      this.reference = new Kinvey.Entity({ bar: true }, COLLECTION_UNDER_TEST);
      this.entity = new Kinvey.Entity({ foo: this.reference }, COLLECTION_UNDER_TEST);
    });
    afterEach(function(done) {
      var reference = this.reference;
      this.entity.destroy(callback(done, {
        success: function() {
          reference.destroy(callback(done));
        }
      }));
    });

    // Test suite.
    it('saves a relational structure.', function(done) {
      var entity = this.entity;
      entity.save(callback(done, {
        success: function(response) {
          // Structure should be identical to pre-save.
          response.should.equal(entity);

          // Reference should have been saved too.
          entity.get('foo').should.be.an['instanceof'](Kinvey.Entity);
          (null !== entity.get('foo').getMetadata().lastModified).should.be['true'];

          done();
        }
      }));
    });
    it('saves a circular relational structure.', function(done) {
      this.reference.set('foo', this.entity);
      this.entity.save(callback(done, {
        success: function(response) {
          (null !== response.getId()).should.be['true'];
          (null !== response.get('foo').getId()).should.be['true'];

          // Circular reference should point to response itself.
          response.get('foo').should.be.an['instanceof'](Kinvey.Entity);
          response.get('foo').get('foo').should.equal(response);

          done();
        }
      }));
    });
  });

  // Kinvey.Entity#_resolve
  describe('._resolve', function() {
    // Housekeeping: create resolved and unresolved objects.
    before(function() {
      this.resolved = {
        _type: 'KinveyRef',
        _collection: COLLECTION_UNDER_TEST,
        _id: 'foo',
        _obj: { _id: 'foo', foo: true }
      };
      this.unresolved = {
        _type: 'KinveyRef',
        _collection: COLLECTION_UNDER_TEST,
        _id: 'bar'
      };
      this.nested = {
        _type: 'KinveyRef',
        _collection: COLLECTION_UNDER_TEST,
        _id: 'bar',
        _obj: { _id: 'bar', foo: this.resolved }
      };
    });

    // Test suite.
    it('resolves a reference.', function() {
      var entity = { foo: this.resolved };

      var attr = Kinvey.Entity._resolve({}, entity, ['foo']);
      attr.foo.should.be.an['instanceof'](Kinvey.Entity);
    });
    it('resolves a non-reference.', function() {
      var entity = { foo: this.resolved };

      var attr = Kinvey.Entity._resolve({}, entity, ['bar']);
      attr.foo.should.eql(this.resolved);
      (null == attr.bar).should.be['true'];
    });
    it('maps a resolved reference.', function() {
      var ClassDef = Kinvey.Entity.extend();
      var entity = { foo: this.resolved };

      var attr = Kinvey.Entity._resolve({ foo: ClassDef }, entity, ['foo']);
      attr.foo.should.be.an['instanceof'](ClassDef);
    });

    it('resolves a child reference.', function() {
      var entity = { foo: { bar: this.resolved } };

      var attr = Kinvey.Entity._resolve({}, entity, ['foo.bar']);
      attr.foo.bar.should.be.an['instanceof'](Kinvey.Entity);
    });
    it('resolves an array member reference.', function() {
      var entity = { foo: [ 'bar', this.resolved, 'baz' ] };

      var attr = Kinvey.Entity._resolve({}, entity, ['foo']);
      attr.foo[1].should.be.an['instanceof'](Kinvey.Entity);
    });
    it('does not resolve a array member child reference.', function() {
      var entity = { foo: [ 'bar', { baz: this.resolved }, 'qux' ] };

      var attr = Kinvey.Entity._resolve({}, entity, ['foo']);
      attr.foo[1].baz.should.eql(this.resolved);
    });

    it('leaves a non-resolved reference as is.', function() {
      var entity = { foo: this.unresolved };

      var attr = Kinvey.Entity._resolve({}, entity, ['foo']);
      attr.foo.should.eql(this.unresolved);
    });

    it('resolves a reference with nested reference.', function() {
      var entity = { foo: this.nested };

      var attr = Kinvey.Entity._resolve({}, entity, ['foo']);
      attr.foo.should.be.an['instanceof'](Kinvey.Entity);
      attr.foo.get('foo').should.equal(this.resolved);
    });
    it('resolves a nested reference.', function() {
      var entity = { foo: this.nested };

      var attr = Kinvey.Entity._resolve({}, entity, ['foo.foo']);
      attr.foo.should.be.an['instanceof'](Kinvey.Entity);
      attr.foo.get('foo').should.be.an['instanceof'](Kinvey.Entity);
    });

    it('maps a nested reference.', function() {
      var ClassDef = Kinvey.Entity.extend();
      var entity = { foo: this.nested };

      var attr = Kinvey.Entity._resolve({ foo: ClassDef }, entity, ['foo.foo']);
      attr.foo.should.be.an['instanceof'](ClassDef);
      attr.foo.get('foo').should.be.an['instanceof'](Kinvey.Entity);
      attr.foo.get('foo').should.not.be.an['instanceof'](ClassDef);
    });
  });

});