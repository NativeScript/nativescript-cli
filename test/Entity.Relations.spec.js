/**
 * Kinvey.Entity relations test suite.
 */
describe('Kinvey.Entity -> Relations', function() {
  // Housekeeping: remove user.
  after(function(done) {
    Kinvey.getCurrentUser().destroy(callback(done));
  });

  // Mapper.
  describe('Mapper', function() {
    // Housekeeping: create definition.
    before(function() {
      this.FooEntity = Kinvey.Entity.extend({});
      this.BarEntity = Kinvey.Entity.extend({
        map: { foo: this.FooEntity, 'bar.baz': this.FooEntity }
      });
    });

    // Test suite.
    it('maps a property to an object.', function() {
      var entity = new this.BarEntity({
        foo: {
          _type: 'KinveyRef',
          _collection: COLLECTION_UNDER_TEST,
          _id: null,
          _obj: { bar: true }
        }
      }, COLLECTION_UNDER_TEST);

      // Test properties.
      entity.get('foo').should.be.an['instanceof'](Kinvey.Entity);
      entity.get('foo').should.be.an['instanceof'](this.FooEntity);
      entity.get('foo').get('bar').should.be['true'];
    });

    // Test suite.
    it('maps an array to an object.', function() {
      var entity = new this.BarEntity({
        bar: {
          baz: [{
            _type: 'KinveyRef',
            _collection: COLLECTION_UNDER_TEST,
            _id: null,
            _obj: { bar: true }
          }]
        }
      }, COLLECTION_UNDER_TEST);

      // Test properties.
      entity.get('bar').baz[0].should.be.an['instanceof'](this.FooEntity);
    });
  });

  // Parser.
  describe('Parser', function() {
    // Test suite.
    it('parses a relational property (top-level).', function() {
      // Create object.
      var entity = new Kinvey.Entity({
        foo: {
          _type: 'KinveyRef',
          _collection: COLLECTION_UNDER_TEST,
          _id: null,
          _obj: { bar: true }
        }
      }, COLLECTION_UNDER_TEST);

      // Test properties.
      entity.get('foo').should.be.an['instanceof'](Kinvey.Entity);
      entity.get('foo').get('bar').should.be['true'];
    });
    it('parses a relational property (depth 2).', function() {
      // Create object.
      var entity = new Kinvey.Entity({
        foo: {
          bar: {
            _type: 'KinveyRef',
            _collection: COLLECTION_UNDER_TEST,
            _id: null,
            _obj: { baz: true }
          }
        }
      }, COLLECTION_UNDER_TEST);

      // Test properties.
      entity.get('foo').bar.should.be.an['instanceof'](Kinvey.Entity);
      entity.get('foo').bar.get('baz').should.be['true'];
    });
    it('parses a nested relational property.', function() {
      // Create object.
      var entity = new Kinvey.Entity({
        foo: {
          _type: 'KinveyRef',
          _collection: COLLECTION_UNDER_TEST,
          _id: null,
          _obj: {
            baz: {
              _type: 'KinveyRef',
              _collection: COLLECTION_UNDER_TEST,
              _id: null,
              _obj: { qux: true }
            }
          }
        }
      }, COLLECTION_UNDER_TEST);

      // Test properties.
      entity.get('foo').get('baz').should.be.an['instanceof'](Kinvey.Entity);
      entity.get('foo').get('baz').get('qux').should.be['true'];
    });

    it('parses a relational array element.', function() {
      // Create object.
      var entity = new Kinvey.Entity({
        foo: [{
          _type: 'KinveyRef',
          _collection: COLLECTION_UNDER_TEST,
          _id: null,
          _obj: { bar: true }
        }]
      }, COLLECTION_UNDER_TEST);

      // Test properties.
      entity.get('foo')[0].should.be.an['instanceof'](Kinvey.Entity);
      entity.get('foo')[0].get('bar').should.be['true'];
    });
  });

  // Kinvey.Collection#fetch
  describe('Kinvey.Collection#fetch', function() {
    // Housekeeping: create mock.
    before(function(done) {
      // Create collection, and add query to exclude relational entities.
      this.collection = new Kinvey.Collection(COLLECTION_UNDER_TEST, {
        query: new Kinvey.Query().on('bar.baz').exist(true)
      });

      // Create mock.
      this.entity = new Kinvey.Entity({
        foo: {
          _type: 'KinveyRef',
          _collection: COLLECTION_UNDER_TEST,
          _id: null,
          _obj: { bar: true }
        },
        bar: {
          baz: {
            _type: 'KinveyRef',
            _collection: COLLECTION_UNDER_TEST,
            _id: null,
            _obj: { qux: true }
          }
        }
      }, COLLECTION_UNDER_TEST);
      this.entity.save(callback(done));
    });
    after(function(done) {
      this.collection.setQuery(null);// Reset.
      this.collection.clear(callback(done));
    });

    // Test suite.
    it('fetches entities.', function(done) {
      this.collection.fetch(callback(done, {
        resolve: ['foo', 'bar.baz'],
        success: function(list) {
          list.should.have.length(1);
          list[0].should.be.an['instanceof'](Kinvey.Entity);
          list[0].get('foo').should.be.an['instanceof'](Kinvey.Entity);
          list[0].get('bar').baz.should.be.an['instanceof'](Kinvey.Entity);
          done();
        }
      }));
    });
  });

  // Kinvey.Entity#load
  describe('Kinvey.Entity#load', function() {
    // Housekeeping: create mock.
    before(function(done) {
      this.entity = new Kinvey.Entity({
        foo: {
          _type: 'KinveyRef',
          _collection: COLLECTION_UNDER_TEST,
          _id: null,
          _obj: { bar: true }
        },
        bar: {
          baz: {
            _type: 'KinveyRef',
            _collection: COLLECTION_UNDER_TEST,
            _id: null,
            _obj: { qux: true }
          }
        }
      }, COLLECTION_UNDER_TEST);
      this.entity.save(callback(done));
    });
    after(function(done) {
      new Kinvey.Collection(COLLECTION_UNDER_TEST).clear(callback(done));
    });

    // Test suite.
    it('resolves a property reference.', function(done) {
      new Kinvey.Entity({}, COLLECTION_UNDER_TEST).load(this.entity.getId(), callback(done, {
        resolve: ['foo'],
        success: function(response) {
          response.get('foo').should.be.an['instanceof'](Kinvey.Entity);
          response.get('foo').get('bar').should.be['true'];
          response.get('bar').baz.should.not.be.an['instanceof'](Kinvey.Entity);
          done();
        }
      }));
    });
    it('resolves a (nested) property reference.', function(done) {
      new Kinvey.Entity({}, COLLECTION_UNDER_TEST).load(this.entity.getId(), callback(done, {
        resolve: ['bar.baz'],
        success: function(response) {
          response.get('foo').should.not.be.an['instanceof'](Kinvey.Entity);
          response.get('bar').baz.should.be.an['instanceof'](Kinvey.Entity);
          response.get('bar').baz.get('qux').should.be['true'];
          done();
        }
      }));
    });
  });

  // Kinvey.Entity#save
  describe('Kinvey.Entity#save', function() {
    // Housekeeping: clear collection.
    afterEach(function(done) {
      new Kinvey.Collection(COLLECTION_UNDER_TEST).clear(callback(done));
    });

    // Test suite.
    it('saves an object with relational property.', function(done) {
      new Kinvey.Entity({
        foo: {
          _type: 'KinveyRef',
          _collection: COLLECTION_UNDER_TEST,
          _id: null,
          _obj: { bar: true }
        }
      }, COLLECTION_UNDER_TEST).save(callback(done, {
        success: function(response) {
          response.should.be.an['instanceof'](Kinvey.Entity);
          response.get('foo').should.be.an['instanceof'](Kinvey.Entity);
          (null !== response.getId()).should.be['true'];
          response.get('foo').get('bar').should.be['true'];
          done();
        }
      }));
    });
    it('saves an object with relational array.', function(done) {
      new Kinvey.Entity({
        foo: [{
          _type: 'KinveyRef',
          _collection: COLLECTION_UNDER_TEST,
          _id: null,
          _obj: { bar: true }
        }]
      }, COLLECTION_UNDER_TEST).save(callback(done, {
        success: function(response) {
          response.should.be.an['instanceof'](Kinvey.Entity);
          response.get('foo')[0].should.be.an['instanceof'](Kinvey.Entity);
          (null !== response.getId()).should.be['true'];
          response.get('foo')[0].get('bar').should.be['true'];
          done();
        }
      }));
    });
    it('fails on saving a circular reference.', function(done) {
      var entity = new Kinvey.Entity({}, COLLECTION_UNDER_TEST);
      entity.set('key', entity);
      entity.save(callback(done, {
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
});