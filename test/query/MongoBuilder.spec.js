/**
 * Kinvey.Query.MongoBuilder test suite.
 */
describe('Kinvey.Query.MongoBuilder', function() {
  beforeEach(function() {
    this.query = new Kinvey.Query.MongoBuilder();
  });

  // Kinvey.Query.MongoBuilder#addCondition
  describe('#addCondition', function() {
    it('throws an error on unsupported condition.', function() {
      var query = this.query;
      (function() {
        query.addCondition('foo', 'bar', 'baz');
      }.should['throw']());
    });

    // Kinvey.Query.MongoBuilder#addCondition(.., EQUAL, ..)
    describe('.equal', function() {
      it('sets an equal condition.', function() {
        this.query.addCondition('foo', Kinvey.Query.EQUAL, 'bar');
        this.query.toJSON().query.should.eql({ foo: 'bar' });

        this.query.addCondition('foo', Kinvey.Query.EQUAL, 'baz');
        this.query.toJSON().query.should.eql({ foo: 'baz' });
      });

      it('overwrites a previous condition.', function() {
        this.query.addCondition('foo', Kinvey.Query.NOT_EQUAL, 'bar');
        this.query.addCondition('foo', Kinvey.Query.EQUAL, 'baz');
        this.query.toJSON().query.should.eql({ foo: 'baz' });
      });

      it('is overwritten by a successive condition.', function() {
        this.query.addCondition('foo', Kinvey.Query.EQUAL, 'baz');
        this.query.addCondition('foo', Kinvey.Query.NOT_EQUAL, 'bar');
        this.query.toJSON().query.should.eql({ foo: { $ne: 'bar' } });
      });
    });

    // Kinvey.Query.MongoBuilder#addCondition(.., EXIST, ..)
    describe('.exist', function() {
      it('sets a positive exist condition.', function() {
        this.query.addCondition('foo', Kinvey.Query.EXIST, true);
        this.query.toJSON().query.should.eql({ foo: { $exists: true } });
      });
      it('sets a negative exist condition.', function() {
        this.query.addCondition('foo', Kinvey.Query.EXIST, false);
        this.query.toJSON().query.should.eql({ foo: { $exists: false } });
      });
    });

    // Kinvey.Query.MongoBuilder#addCondition(.., LESS_THAN, ..)
    describe('.lessThan', function() {
      it('sets a less than condition.', function() {
        this.query.addCondition('foo', Kinvey.Query.LESS_THAN, 25);
        this.query.toJSON().query.should.eql({ foo: { $lt: 25 } });
      });

      it('is added to an existing condition.', function() {
        this.query.addCondition('foo', Kinvey.Query.LESS_THAN_EQUAL, 25);
        this.query.addCondition('bar', Kinvey.Query.EQUAL, 'baz');
        this.query.addCondition('foo', Kinvey.Query.LESS_THAN, 50);
        this.query.toJSON().query.should.eql({
          foo: { $lte: 25, $lt: 50 },
          bar: 'baz'
        });
      });
    });

    // Kinvey.Query.MongoBuilder#addCondition(.., LESS_THAN_EQUAL, ..)
    describe('.lessThanEqual', function() {
      it('sets a less than equal condition.', function() {
        this.query.addCondition('foo', Kinvey.Query.LESS_THAN_EQUAL, 25);
        this.query.toJSON().query.should.eql({ foo: { $lte: 25 } });
      });
    });

    // Kinvey.Query.MongoBuilder#addCondition(.., GREATER_THAN, ..)
    describe('.greaterThan', function() {
      it('sets a greater than condition.', function() {
        this.query.addCondition('foo', Kinvey.Query.GREATER_THAN, 25);
        this.query.toJSON().query.should.eql({ foo: { $gt: 25 } });
      });
    });

    // Kinvey.Query.MongoBuilder#addCondition(.., GREATER_THAN_EQUAL, ..)
    describe('.greaterThanEqual', function() {
      it('sets a greater than equal condition.', function() {
        this.query.addCondition('foo', Kinvey.Query.GREATER_THAN_EQUAL, 25);
        this.query.toJSON().query.should.eql({ foo: { $gte: 25 } });
      });
    });

    // Kinvey.Query.MongoBuilder#addCondition(.., NOT_EQUAL, ..)
    describe('.notEqual', function() {
      it('sets a not equal condition.', function() {
        this.query.addCondition('foo', Kinvey.Query.NOT_EQUAL, 'bar');
        this.query.toJSON().query.should.eql({ foo: { $ne: 'bar' } });
      });
    });

    // Kinvey.Query.MongoBuilder#addCondition(.., AND, ..)
    describe('.and', function() {
      it('sets an and condition.', function() {
        var query = new Kinvey.Query.MongoBuilder();
        query.addCondition('baz', Kinvey.Query.EQUAL, 'qux');

        this.query.addCondition(null, Kinvey.Query.AND, query);
        this.query.toJSON().query.should.eql({
          $and: [ {}, { baz: 'qux' }]
        });        
      });
    });

    // Kinvey.Query.MongoBuilder#addCondition(.., OR, ..)
    describe('.or', function() {
      it('sets an or condition.', function() {
        var query = new Kinvey.Query.MongoBuilder();
        query.addCondition('baz', Kinvey.Query.EQUAL, 'qux');

        this.query.addCondition(null, Kinvey.Query.OR, query);
        this.query.toJSON().query.should.eql({
          $or: [ {}, { baz: 'qux' }]
        });
      });
    });

    // Kinvey.Query.MongoBuilder#addCondition(.., NEAR_SPHERE, ..)
    describe('.nearSphere', function() {
      it('sets a near sphere condition.', function() {
        this.query.addCondition('foo', Kinvey.Query.NEAR_SPHERE, { point: [25, 25] });
        this.query.toJSON().query.should.eql({ foo: { $nearSphere: [25, 25] } });
      });
      it('sets a near sphere condition with max distance.', function() {
        this.query.addCondition('foo', Kinvey.Query.NEAR_SPHERE, {
          point: [25, 25],
          maxDistance: 25
        });
        this.query.toJSON().query.should.eql({
          foo: { $nearSphere: [25, 25], $maxDistance: 25 }
        });
      });
    });

    // Kinvey.Query.MongoBuilder#addCondition(.., WITHIN_BOX, ..)
    describe('.withinBox', function() {
      it('sets a within box condition.', function() {
        this.query.addCondition('foo', Kinvey.Query.WITHIN_BOX, [[0, 0], [25, 25]]);
        this.query.toJSON().query.should.eql({
          foo: { $within: { $box: [[0, 0], [25, 25]] } }
        });
      });
    });

    // Kinvey.Query.MongoBuilder#addCondition(.., WITHIN_CENTER_SPHERE, ..)
    describe('.withinCenterSphere', function() {
      it('sets a within center sphere condition.', function() {
        this.query.addCondition('foo', Kinvey.Query.WITHIN_CENTER_SPHERE, {
          center: [25, 25],
          radius: 0.1
        });
        this.query.toJSON().query.should.eql({
          foo: { $within: { $centerSphere: [[25, 25], 0.1] } }
        });
      });
    });

    // Kinvey.Query.MongoBuilder#addCondition(.., WITHIN_POLYGON, ..)
    describe('.withinPolygon', function() {
      it('sets a within polygon condition.', function() {
        this.query.addCondition('foo', Kinvey.Query.WITHIN_POLYGON, [[0, 0], [25, 25], [25, 0]]);
        this.query.toJSON().query.should.eql({
          foo: { $within: { $polygon: [[0, 0], [25, 25], [25, 0]] } }
        });
      });
    });

    // Kinvey.Query.MongoBuilder#addCondition(.., IN, ..)
    describe('.in', function() {
      it('sets an in conidition.', function() {
        this.query.addCondition('foo', Kinvey.Query.IN, ['bar', 'baz']);
        this.query.toJSON().query.should.eql({ foo: { $in: ['bar', 'baz'] } });
      });
    });

    // Kinvey.Query.MongoBuilder#addCondition(.., NOT_IN, ..)
    describe('.notIn', function() {
      it('sets a not in condition.', function() {
        this.query.addCondition('foo', Kinvey.Query.NOT_IN, ['bar', 'baz']);
        this.query.toJSON().query.should.eql({ foo: { $nin: ['bar', 'baz'] } });
      });
    });

    // Kinvey.Query.MongoBuilder#addCondition(.., ALL, ..)
    describe('.all', function() {
      it('sets an all condition.', function() {
        this.query.addCondition('foo', Kinvey.Query.ALL, ['bar', 'baz']);
        this.query.toJSON().query.should.eql({ foo: { $all: ['bar', 'baz'] } });
      });
    });

    // Kinvey.Query.MongoBuilder#addCondition(.., SIZE, ..)
    describe('.size', function() {
      it('sets a size condition.', function() {
        this.query.addCondition('foo', Kinvey.Query.SIZE, 25);
        this.query.toJSON().query.should.eql({ foo: { $size: 25 } });
      });
    });
  });

  // Kinvey.Query.MongoBuilder#setLimit
  describe('#setLimit', function() {
    it('adds a limit.', function() {
      this.query.setLimit(25);
      this.query.toJSON().limit.should.eql(25);
    });
    it('resets any previous limit.', function() {
      this.query.setLimit(25);
      this.query.setLimit(null);
      this.query.toJSON().should.not.have.property('limit');
    });
  });

  // Kinvey.Query.MongoBuilder#setSkip
  describe('#setSkip', function() {
    it('adds a skip.', function() {
      this.query.setSkip(25);
      this.query.toJSON().skip.should.eql(25);
    });
    it('resets any previous skip.', function() {
      this.query.setSkip(25);
      this.query.setSkip(null);
      this.query.toJSON().should.not.have.property('skip');
    });
  });

  // Kinvey.Query.MongoBuilder#setSort
  describe('#setSort', function() {
    it('sorts by field (ascending).', function() {
      this.query.setSort('foo', Kinvey.Query.ASC);
      this.query.toJSON().sort.should.eql({ foo: 1 });
    });
    it('sorts by field (descending).', function() {
      this.query.setSort('foo', Kinvey.Query.DESC);
      this.query.toJSON().sort.should.eql({ foo: -1 });
    });
    it('resets any previous sort.', function() {
      this.query.setSort('foo', Kinvey.Query.ASC);
      this.query.setSort();
      this.query.toJSON().should.not.have.property('sort');
    });
  });

});