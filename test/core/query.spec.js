/**
 * Copyright 2013 Kinvey, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Test suite for `Kinvey.Query`.
 */
describe('Kinvey.Query', function() {

  // Housekeeping: allow easy access to query properties.
  before(function() {
    var _this = this;
    ['filter', 'sort', 'limit', 'skip'].forEach(function(name) {
      _this[name] = function() {
        return _this.query.toJSON()[name];
      };
    });
  });
  after(function() {// Cleanup.
    var _this = this;
    ['filter', 'sort', 'limit', 'skip'].forEach(function(name) {
      delete _this[name];
    });
  });

  // Housekeeping: generate field and query under test.
  beforeEach(function() {
    this.field = this.randomID();
    this.query = new Kinvey.Query();
  });
  afterEach(function() {// Cleanup.
    delete this.query;
    delete this.field;
  });

  // Kinvey.Query.
  describe('the constructor', function() {
    // Test suite.
    it('should return a new query.', function() {
      expect(new Kinvey.Query()).to.be.an.instanceOf(Kinvey.Query);
    });
    it('should preseed filter if `options.filter` was set.', function() {
      var filter = { attribute: this.randomID() };
      var query  = new Kinvey.Query({ filter: filter });
      expect(query.toJSON().filter).to.deep.equal(filter);
    });
    it('should preseed sort if `options.sort` was set.', function() {
      var sort  = { attribute: 1 };
      var query = new Kinvey.Query({ sort: sort });
      expect(query.toJSON().sort).to.deep.equal(sort);
    });
    it('should preseed limit if `options.limit` was set.', function() {
      var limit = 10;
      var query = new Kinvey.Query({ limit: limit });
      expect(query.toJSON().limit).to.deep.equal(limit);
    });
    it('should preseed skip if `options.skip` was set.', function() {
      var skip  = 10;
      var query = new Kinvey.Query({ skip: skip });
      expect(query.toJSON().skip).to.equal(skip);
    });
  });

  // Kinvey.Query#equalTo.
  describe('the equalTo method', function() {
    // Test suite.
    it('should add an equal to filter.', function() {
      var value = this.randomID();
      this.query.equalTo(this.field, value);
      expect(this.filter()).to.have.property(this.field, value);
    });
    it('should discard any existing filters on the same field.', function() {
      var value = this.randomID();
      this.query.equalTo(this.field, this.randomID());// Should be discarded.
      this.query.equalTo(this.field, value);
      expect(this.filter()).to.contain.keys([this.field]);
      expect(this.filter()[this.field]).to.equal(value);
    });
    it('should return the query.', function() {
      var value = this.query.equalTo(this.field, this.randomID());
      expect(value).to.equal(this.query);
    });
  });

  // Kinvey.Query#contains.
  describe('the contains method', function() {
    // Test suite.
    it('should throw on invalid argument: values.', function() {
      var _this = this;
      expect(function() {
        _this.query.contains(_this.field, _this.randomID());
      }).to.Throw('Array');
    });
    it('should add a contains filter.', function() {
      var value = [ this.randomID(), this.randomID() ];
      this.query.contains(this.field, value);
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.deep.equal({ $in: value });
    });
    it('should respect any existing filters on the same field.', function() {
      this.query.greaterThan(this.field, this.randomID());
      this.query.contains(this.field, [ this.randomID() ]);
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.contain.keys([ '$gt' ]);
    });
    it('should return the query.', function() {
      var value = this.query.contains(this.field, [ this.randomID() ]);
      expect(value).to.equal(this.query);
    });
  });

  // Kinvey.Query#containsAll.
  describe('the containsAll method', function() {
    // Test suite.
    it('should throw on invalid argument: values.', function() {
      var _this = this;
      expect(function() {
        _this.query.containsAll(_this.field, _this.randomID());
      }).to.Throw('Array');
    });
    it('should add a contains all filter.', function() {
      var value = [ this.randomID(), this.randomID() ];
      this.query.containsAll(this.field, value);
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.deep.equal({ $all: value });
    });
    it('should respect any existing filters on the same field.', function() {
      this.query.greaterThan(this.field, this.randomID());
      this.query.containsAll(this.field, [ this.randomID() ]);
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.contain.keys([ '$gt' ]);
    });
    it('should return the query.', function() {
      var value = this.query.containsAll(this.field, [ this.randomID() ]);
      expect(value).to.equal(this.query);
    });
  });

  // Kinvey.Query#greaterThan.
  describe('the greaterThan method', function() {
    // Test suite.
    it('should throw on invalid arguments: value.', function() {
      var _this = this;
      expect(function() {
        _this.query.greaterThan(_this.field, null);
      }).to.Throw('type');
    });
    it('should add a greater than filter.', function() {
      var value = this.randomID();
      this.query.greaterThan(this.field, value);
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.deep.equal({ $gt: value });
    });
    it('should respect any existing filters on the same field.', function() {
      this.query.contains(this.field, [ this.randomID() ]);
      this.query.greaterThan(this.field, this.randomID());
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.contain.keys([ '$in' ]);
    });
    it('should return the query.', function() {
      var value = this.query.greaterThan(this.field, this.randomID());
      expect(value).to.equal(this.query);
    });
  });

  // Kinvey.Query#greaterThanOrEqualTo.
  describe('the greaterThanOrEqualTo method', function() {
    // Test suite.
    it('should throw on invalid arguments: value.', function() {
      var _this = this;
      expect(function() {
        _this.query.greaterThanOrEqualTo(_this.field, null);
      }).to.Throw('type');
    });
    it('should add a greater than filter.', function() {
      var value = this.randomID();
      this.query.greaterThanOrEqualTo(this.field, value);
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.deep.equal({ $gte: value });
    });
    it('should respect any existing filters on the same field.', function() {
      this.query.greaterThanOrEqualTo(this.field, this.randomID());
      this.query.greaterThan(this.field, this.randomID());
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.contain.keys([ '$gt' ]);
    });
    it('should return the query.', function() {
      var value = this.query.greaterThanOrEqualTo(this.field, this.randomID());
      expect(value).to.equal(this.query);
    });
  });

  // Kinvey.Query#lessThan.
  describe('the lessThan method', function() {
    // Test suite.
    it('should throw on invalid arguments: value.', function() {
      var _this = this;
      expect(function() {
        _this.query.lessThan(_this.field, null);
      }).to.Throw('type');
    });
    it('should add a greater than filter.', function() {
      var value = this.randomID();
      this.query.lessThan(this.field, value);
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.deep.equal({ $lt: value });
    });
    it('should respect any existing filters on the same field.', function() {
      this.query.lessThan(this.field, this.randomID());
      this.query.greaterThan(this.field, this.randomID());
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.contain.keys([ '$gt' ]);
    });
    it('should return the query.', function() {
      var value = this.query.lessThan(this.field, this.randomID());
      expect(value).to.equal(this.query);
    });
  });

  // Kinvey.Query#lessThanOrEqualTo.
  describe('the lessThanOrEqualTo method', function() {
    // Test suite.
    it('should throw on invalid arguments: value.', function() {
      var _this = this;
      expect(function() {
        _this.query.lessThanOrEqualTo(_this.field, null);
      }).to.Throw('type');
    });
    it('should add a greater than filter.', function() {
      var value = this.randomID();
      this.query.lessThanOrEqualTo(this.field, value);
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.deep.equal({ $lte: value });
    });
    it('should respect any existing filters on the same field.', function() {
      this.query.lessThanOrEqualTo(this.field, this.randomID());
      this.query.greaterThan(this.field, this.randomID());
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.contain.keys([ '$gt' ]);
    });
    it('should return the query.', function() {
      var value = this.query.lessThanOrEqualTo(this.field, this.randomID());
      expect(value).to.equal(this.query);
    });
  });

  // Kinvey.Query#notEqualTo.
  describe('the notEqualTo method', function() {
    // Test suite.
    it('should add a not equal to filter.', function() {
      var value = this.randomID();
      this.query.notEqualTo(this.field, value);
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.deep.equal({ $ne: value });
    });
    it('should respect any existing filters on the same field.', function() {
      this.query.notEqualTo(this.field, this.randomID());
      this.query.greaterThan(this.field, this.randomID());
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.contain.keys([ '$gt' ]);
    });
    it('should return the query.', function() {
      var value = this.query.notEqualTo(this.field, this.randomID());
      expect(value).to.equal(this.query);
    });
  });

  // Kinvey.Query#notContainedIn.
  describe('the notContainedIn method', function() {
    // Test suite.
    it('should throw on invalid argument: values.', function() {
      var _this = this;
      expect(function() {
        _this.query.notContainedIn(_this.field, _this.randomID());
      }).to.Throw('Array');
    });
    it('should add a contains all filter.', function() {
      var value = [ this.randomID(), this.randomID() ];
      this.query.notContainedIn(this.field, value);
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.deep.equal({ $nin: value });
    });
    it('should respect any existing filters on the same field.', function() {
      this.query.notContainedIn(this.field, [ this.randomID() ]);
      this.query.greaterThan(this.field, this.randomID());
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.contain.keys([ '$gt' ]);
    });
    it('should return the query.', function() {
      var value = this.query.notContainedIn(this.field, [ this.randomID() ]);
      expect(value).to.equal(this.query);
    });
  });

  // Kinvey.Query#and.
  describe('the and method', function() {
    describe('when called with arguments', function() {
      // Test suite.
      it('should throw on invalid arguments: invalid query.', function() {
        var _this = this;
        expect(function() {
          _this.query.and(null);
        }).to.Throw('Kinvey.Query');
      });
      it('should join a query.', function() {
        this.query.and(new Kinvey.Query());
        expect(this.filter()).to.have.property('$and');
        expect(this.filter().$and).to.have.length(2);
      });
      it('should join an query object.', function() {
        this.query.and({ filter: {} });
        expect(this.filter()).to.have.property('$and');
        expect(this.filter().$and).to.have.length(2);
      });
      it('should join multiple queries at once.', function() {
        this.query.and(new Kinvey.Query(), new Kinvey.Query());
        expect(this.filter()).to.have.property('$and');
        expect(this.filter().$and).to.have.length(3);
      });
      it('should return the query.', function() {
        var value = this.query.and(new Kinvey.Query());
        expect(value).to.equal(this.query);
      });
    });

    describe('when called without arguments', function() {
      // Test suite.
      it('should return a subquery.', function() {
        var value = this.query.and();
        expect(value).to.be.an.instanceOf(Kinvey.Query);
        expect(value._parent).to.equal(this.query);
      });
      it('should update the original query.', function() {
        var value = this.randomID();
        this.query.and().greaterThan(this.field, value);
        expect(this.filter()).to.have.deep.property('$and[1].' + this.field);
        expect(this.filter().$and[1][this.field]).to.deep.equal({ $gt: value });
      });
    });
  });

  // Kinvey.Query#nor.
  describe('the nor method', function() {
    describe('when called with arguments', function() {
      // Test suite.
      it('should throw on invalid arguments: invalid query.', function() {
        var _this = this;
        expect(function() {
          _this.query.nor(null);
        }).to.Throw('Kinvey.Query');
      });
      it('should join a query.', function() {
        this.query.nor(new Kinvey.Query());
        expect(this.filter()).to.have.property('$nor');
        expect(this.filter().$nor).to.have.length(2);
      });
      it('should join an query object.', function() {
        this.query.nor({ filter: {} });
        expect(this.filter()).to.have.property('$nor');
        expect(this.filter().$nor).to.have.length(2);
      });
      it('should join multiple queries at once.', function() {
        this.query.nor(new Kinvey.Query(), new Kinvey.Query());
        expect(this.filter()).to.have.property('$nor');
        expect(this.filter().$nor).to.have.length(3);
      });
      it('should return the query.', function() {
        var value = this.query.nor(new Kinvey.Query());
        expect(value).to.equal(this.query);
      });
    });

    describe('when called without arguments', function() {
      // Test suite.
      it('should return a subquery.', function() {
        var value = this.query.nor();
        expect(value).to.be.an.instanceOf(Kinvey.Query);
        expect(value._parent).to.equal(this.query);
      });
      it('should update the original query.', function() {
        var value = this.randomID();
        this.query.nor().greaterThan(this.field, value);
        expect(this.filter()).to.have.deep.property('$nor[1].' + this.field);
        expect(this.filter().$nor[1][this.field]).to.deep.equal({ $gt: value });
      });
    });
  });
  // Kinvey.Query#or.
  describe('the or method', function() {
    describe('when called with arguments', function() {
      // Test suite.
      it('should throw on invalid arguments: invalid query.', function() {
        var _this = this;
        expect(function() {
          _this.query.or(null);
        }).to.Throw('Kinvey.Query');
      });
      it('should join a query.', function() {
        this.query.or(new Kinvey.Query());
        expect(this.filter()).to.have.property('$or');
        expect(this.filter().$or).to.have.length(2);
      });
      it('should join an query object.', function() {
        this.query.or({ filter: {} });
        expect(this.filter()).to.have.property('$or');
        expect(this.filter().$or).to.have.length(2);
      });
      it('should join multiple queries at once.', function() {
        this.query.or(new Kinvey.Query(), new Kinvey.Query());
        expect(this.filter()).to.have.property('$or');
        expect(this.filter().$or).to.have.length(3);
      });
      it('should return the query.', function() {
        var value = this.query.or(new Kinvey.Query());
        expect(value).to.equal(this.query);
      });
    });

    describe('when called without arguments', function() {
      // Test suite.
      it('should return a subquery.', function() {
        var value = this.query.or();
        expect(value).to.be.an.instanceOf(Kinvey.Query);
        expect(value._parent).to.equal(this.query);
      });
      it('should update the original query.', function() {
        var value = this.randomID();
        this.query.or().greaterThan(this.field, value);
        expect(this.filter()).to.have.deep.property('$or[1].' + this.field);
        expect(this.filter().$or[1][this.field]).to.deep.equal({ $gt: value });
      });
    });
  });

  // Kinvey.Query#exists.
  describe('the exists method', function() {
    // Test suite.
    it('should add an exists filter.', function() {
      this.query.exists(this.field);
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.deep.equal({ $exists: true });
    });
    it('should add an exists filter with flag set to `false`.', function() {
      this.query.exists(this.field, false);
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.deep.equal({ $exists: false });
    });
    it('should respect any existing filters on the same field.', function() {
      this.query.exists(this.field);
      this.query.greaterThan(this.field, this.randomID());
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.contain.keys([ '$gt' ]);
    });
    it('should return the query.', function() {
      var value = this.query.exists(this.field);
      expect(value).to.equal(this.query);
    });
  });

  // Kinvey.Query#mod.
  describe('the mod method', function() {
    // Test suite.
    it('should throw on invalid arguments: divisor.', function() {
      var _this = this;
      expect(function() {
        _this.query.mod(_this.field, null);
      }).to.Throw('divisor');
    });
    it('should throw on invalid arguments: remainder.', function() {
      var _this = this;
      expect(function() {
        _this.query.mod(_this.field, 5, null);
      }).to.Throw('remainder');
    });
    it('should add a mod filter.', function() {
      var divisor   = 5;
      var remainder = 0;
      this.query.mod(this.field, divisor, remainder);
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.deep.equal({ $mod: [ divisor, remainder ]});
    });
    it('should respect any existing filters on the same field.', function() {
      this.query.mod(this.field, 5);
      this.query.greaterThan(this.field, this.randomID());
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.contain.keys([ '$gt' ]);
    });
    it('should return the query.', function() {
      var value = this.query.exists(this.field);
      expect(value).to.equal(this.query);
    });
  });

  describe('the matches method', function() {
    it('should add a match filter by string', function() {
      var value = this.randomID();
      this.query.matches(this.field, value);

      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.deep.equal({ $regex: value });
    });
    it('should add a match filter by RegExp literal.', function() {
      var value = /foo/;
      this.query.matches(this.field, value);

      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.deep.equal({ $regex: value.source });
    });
    it('should add a match filter by RegExp object.', function() {
      var value = new RegExp('foo');
      this.query.matches(this.field, value);

      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.deep.equal({ $regex: value.source });
    });
    it('should respect any existing filters on the same field.', function() {
      this.query.matches(this.field, this.randomID());
      this.query.greaterThan(this.field, this.randomID());
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.contain.keys([ '$gt' ]);
    });
    it('should return the query.', function() {
      var value = this.query.matches(this.field, /foo/);
      expect(value).to.equal(this.query);
    });

    describe('with options', function() {
      // Test suite.
      it('should set the ignoreCase flag if part of the RegExp.', function() {
        var value = /foo/i;
        this.query.matches(this.field, value);

        expect(this.filter()).to.have.property(this.field);
        expect(this.filter()[this.field]).to.have.property('$options', 'i');
      });
      it('should set the ignoreCase flag if `options.ignoreCase`.', function() {
        var value = /foo/;
        this.query.matches(this.field, value, { ignoreCase: true });

        expect(this.filter()).to.have.property(this.field);
        expect(this.filter()[this.field]).to.have.property('$options', 'i');
      });
      it('should unset the ignoreCase flag if `options.ignoreCase` is `false`.', function() {
        var value = /foo/i;
        this.query.matches(this.field, value, { ignoreCase: false });

        expect(this.filter()).to.have.property(this.field);
        expect(this.filter()[this.field]).not.to.have.property('$options');
      });
      it('should set the multiline flag if part of the RegExp.', function() {
        var value = /foo/m;
        this.query.matches(this.field, value);

        expect(this.filter()).to.have.property(this.field);
        expect(this.filter()[this.field]).to.have.property('$options', 'm');
      });
      it('should set the multiline flag if `options.multiline`.', function() {
        var value = /foo/;
        this.query.matches(this.field, value, { multiline: true });

        expect(this.filter()).to.have.property(this.field);
        expect(this.filter()[this.field]).to.have.property('$options', 'm');
      });
      it('should unset the multiline flag if `options.multiline` is `false`.', function() {
        var value = /foo/m;
        this.query.matches(this.field, value, { multiline: false });

        expect(this.filter()).to.have.property(this.field);
        expect(this.filter()[this.field]).not.to.have.property('$options');
      });
      it('should set the extended flag if `options.extended`.', function() {
        this.query.matches(this.field, this.randomID(), { extended: true });

        expect(this.filter()).to.have.property(this.field);
        expect(this.filter()[this.field]).to.have.property('$options', 'x');
      });
      it('should not set the multiline flag if `options.extended` is `false`.', function() {
        this.query.matches(this.field, this.randomID(), { extended: false });

        expect(this.filter()).to.have.property(this.field);
        expect(this.filter()[this.field]).not.to.have.property('$options');
      });
      it('should set the dotMatchesAll flag if `options.dotMatchesAll`.', function() {
        this.query.matches(this.field, this.randomID(), { dotMatchesAll: true });

        expect(this.filter()).to.have.property(this.field);
        expect(this.filter()[this.field]).to.have.property('$options', 's');
      });
      it(
        'should not set the dotMatchesAll flag if `options.dotMatchesAll` is `false`.',
        function() {
          this.query.matches(this.field, this.randomID(), { dotMatchesAll: false });

          expect(this.filter()).to.have.property(this.field);
          expect(this.filter()[this.field]).not.to.have.property('$options');
        }
      );
      it('should set multiple flags.', function() {
        var value = /foo/im;
        this.query.matches(this.field, value, {
          ignoreCase    : false,
          extended      : true,
          dotMatchesAll : true
        });

        expect(this.filter()).to.have.property(this.field);
        expect(this.filter()[this.field]).to.have.property('$options', 'mxs');
      });
    });
  });

  // Kinvey.Query#near.
  describe('the near method', function() {
    // Test suite.
    it('should throw on invalid arguments: coord.', function() {
      var _this = this;
      expect(function() {
        _this.query.near(_this.field, []);
      }).to.Throw('number, number');
    });
    it('should add a near filter.', function() {
      var coord = [ -1, 1 ];
      this.query.near(this.field, coord);
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.deep.equal({ $nearSphere: coord });
    });
    it('should add a near filter, with `maxDistance`.', function() {
      var maxDistance = 10;
      this.query.near(this.field, [ -1, 1 ], maxDistance);
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.contain.keys(['$nearSphere', '$maxDistance']);
      expect(this.filter()[this.field].$maxDistance).to.equal(maxDistance);
    });
    it('should return the query.', function() {
      var value = this.query.near(this.field, [ -1, 1 ]);
      expect(value).to.equal(this.query);
    });
  });

  // Kinvey.Query#withinBox.
  describe('the withinBox method', function() {
    // Test suite.
    it('should throw on invalid arguments: bottomLeftCoord.', function() {
      var _this = this;
      expect(function() {
        _this.query.withinBox(_this.field, [], [1, 1]);
      }).to.Throw('bottomLeftCoord');
    });
    it('should throw on invalid arguments: upperRightCoord.', function() {
      var _this = this;
      expect(function() {
        _this.query.withinBox(_this.field, [1, 1], []);
      }).to.Throw('upperRightCoord');
    });
    it('should add a within box filter.', function() {
      var box = [ [-1, -1], [1, 1] ];
      this.query.withinBox(this.field, box[0], box[1]);
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.deep.equal({ $within: { $box: box } });
    });
    it('should return the query.', function() {
      var value = this.query.withinBox(this.field, [-1, -1], [1, 1]);
      expect(value).to.equal(this.query);
    });
  });

  // Kinvey.Query#withinPolygon.
  describe('the withinPolygon method', function() {
    // Test suite.
    it('should throw on invalid arguments: coord.', function() {
      var _this = this;
      expect(function() {
        _this.query.withinPolygon(_this.field, [ ]);
      }).to.Throw('number, number');
    });
    it('should add a within polygon filter.', function() {
      var polygon = [ [-1, -1], [-1, 1], [1, 1] ];
      this.query.withinPolygon(this.field, polygon);
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.deep.equal({ $within: { $polygon: polygon } });
    });
    it('should return the query.', function() {
      var value = this.query.withinPolygon(this.field, [ [-1, -1], [-1, 1], [1, 1] ]);
      expect(value).to.equal(this.query);
    });
  });

  // Kinvey.Query#size.
  describe('the size method', function() {
    // Test suite.
    it('should throw on invalid arguments: size.', function() {
      var _this = this;
      expect(function() {
        _this.query.size(_this.field, null);
      }).to.Throw('type');
    });
    it('should add a size filter.', function() {
      var value = 10;
      this.query.size(this.field, value);
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.deep.equal({ $size: value });
    });
    it('should respect any existing filters on the same field.', function() {
      this.query.size(this.field, 10);
      this.query.greaterThan(this.field, this.randomID());
      expect(this.filter()).to.have.property(this.field);
      expect(this.filter()[this.field]).to.contain.keys([ '$gt' ]);
    });
    it('should return the query.', function() {
      var value = this.query.size(this.field, 10);
      expect(value).to.equal(this.query);
    });
  });

  // Kinvey.Query#limit.
  describe('the limit method', function() {
    // Test suite.
    it('should throw on invalid arguments: limit.', function() {
      var _this = this;
      expect(function() {
        _this.query.limit({});
      }).to.Throw('type');
    });
    it('should set the limit.', function() {
      var value = 10;
      this.query.limit(value);
      expect(this.limit()).to.equal(value);
    });
    it('should unset the limit.', function() {
      var value = null;
      this.query.limit(value);
      expect(this.limit()).to.equal(value);
    });
    it('should return the query.', function() {
      var value = this.query.limit(10);
      expect(value).to.equal(this.query);
    });
  });

  // Kinvey.Query#skip.
  describe('the skip method', function() {
    // Test suite.
    it('should throw on invalid arguments: skip.', function() {
      var _this = this;
      expect(function() {
        _this.query.skip(null);
      }).to.Throw('type');
    });
    it('should set the skip.', function() {
      var value = 10;
      this.query.skip(value);
      expect(this.skip()).to.equal(value);
    });
    it('should reset the skip.', function() {
      var value = 0;
      this.query.skip(value);
      expect(this.skip()).to.equal(value);
    });
    it('should return the query.', function() {
      var value = this.query.skip(10);
      expect(value).to.equal(this.query);
    });
  });

  // Kinvey.Query#ascending.
  describe('the ascending method', function() {
    // Test suite.
    it('should set the field.', function() {
      this.query.ascending(this.field);
      expect(this.sort()).to.have.property(this.field, 1);
    });
    it('should append a field.', function() {
      var field = this.randomID();
      this.query.ascending(this.field).ascending(field);
      expect(this.sort()).to.have.property(this.field, 1);
      expect(this.sort()).to.have.property(field, 1);
    });
    it('should append a descending field.', function() {
      var field = this.randomID();
      this.query.ascending(this.field).descending(field);
      expect(this.sort()).to.have.property(this.field, 1);
      expect(this.sort()).to.have.property(field, -1);
    });
  });

  // Kinvey.Query#descending.
  describe('the descending method', function() {
    // Test suite.
    it('should set the field.', function() {
      this.query.descending(this.field);
      expect(this.sort()).to.have.property(this.field, -1);
    });
    it('should append a field.', function() {
      var field = this.randomID();
      this.query.descending(this.field).descending(field);
      expect(this.sort()).to.have.property(this.field, -1);
      expect(this.sort()).to.have.property(field, -1);
    });
    it('should append a ascending field.', function() {
      var field = this.randomID();
      this.query.descending(this.field).ascending(field);
      expect(this.sort()).to.have.property(this.field, -1);
      expect(this.sort()).to.have.property(field, 1);
    });
  });

  // Kinvey.Query#sort.
  describe('the sort method', function() {
    it('should set the sort.', function() {
      var value = {};
      value[this.field] = 1;
      this.query.sort(value);

      expect(this.sort()).to.equal(value);
    });
    it('should reset the sort.', function() {
      this.query.sort({});
      expect(this.sort()).to.deep.equal({});
    });
  });

  describe('when chained', function() {
    // Test suite.
    it('should respect AND-NOR precedence.', function() {
      // A & B ^ C -> ((A & B) ^ C) -> nor(and(A, B), C).
      var a = 'A', b = 'B', c = 'C';
      this.query.exists(a).and().exists(b).nor().exists(c);

      expect(this.filter()).to.have.deep.property('$nor[0].$and');
      expect(this.filter().$nor[0].$and).to.have.length(2);
      expect(this.filter().$nor[0].$and[0]).to.have.property(a);
      expect(this.filter().$nor[0].$and[1]).to.have.property(b);

      expect(this.filter().$nor[1]).to.have.property(c);
    });
    it('should respect AND-NOR-AND precedence.', function() {
      // A & B ^ C & D -> ((A & B) ^ (C & D) -> nor(and(A, B), and(C, D)).
      var a = 'A', b = 'B', c = 'C', d = 'D';
      this.query.exists(a).and().exists(b).nor().exists(c).and().exists(d);

      expect(this.filter()).to.have.deep.property('$nor[0].$and');
      expect(this.filter().$nor[0].$and).to.have.length(2);
      expect(this.filter().$nor[0].$and[0]).to.have.property(a);
      expect(this.filter().$nor[0].$and[1]).to.have.property(b);

      expect(this.filter()).to.have.deep.property('$nor[1].$and');
      expect(this.filter().$nor[1].$and).to.have.length(2);
      expect(this.filter().$nor[1].$and[0]).to.have.property(c);
      expect(this.filter().$nor[1].$and[1]).to.have.property(d);
    });
    it('should respect AND-OR precedence.', function() {
      // A & B | C -> ((A & B) | C) -> or(and(A, B), C).
      var a = 'A', b = 'B', c = 'C';
      this.query.exists(a).and().exists(b).or().exists(c);

      expect(this.filter()).to.have.deep.property('$or[0].$and');
      expect(this.filter().$or[0].$and).to.have.length(2);
      expect(this.filter().$or[0].$and[0]).to.have.property(a);
      expect(this.filter().$or[0].$and[1]).to.have.property(b);

      expect(this.filter().$or[1]).to.have.property(c);
    });
    it('should respect AND-OR-AND precedence.', function() {
      // A & B | C & D -> ((A & B) | (C & D) -> or(and(A, B), and(C, D)).
      var a = 'A', b = 'B', c = 'C', d = 'D';
      this.query.exists(a).and().exists(b).or().exists(c).and().exists(d);

      expect(this.filter()).to.have.deep.property('$or[0].$and');
      expect(this.filter().$or[0].$and).to.have.length(2);
      expect(this.filter().$or[0].$and[0]).to.have.property(a);
      expect(this.filter().$or[0].$and[1]).to.have.property(b);

      expect(this.filter()).to.have.deep.property('$or[1].$and');
      expect(this.filter().$or[1].$and).to.have.length(2);
      expect(this.filter().$or[1].$and[0]).to.have.property(c);
      expect(this.filter().$or[1].$and[1]).to.have.property(d);
    });
    it('should respect NOR-OR precedence.', function() {
      // A ^ B | C -> ((A ^ B) | C) -> or(nor(A, B), C).
      var a = 'A', b = 'B', c = 'C';
      this.query.exists(a).nor().exists(b).or().exists(c);

      expect(this.filter()).to.have.deep.property('$or[0].$nor');
      expect(this.filter().$or[0].$nor).to.have.length(2);
      expect(this.filter().$or[0].$nor[0]).to.have.property(a);
      expect(this.filter().$or[0].$nor[1]).to.have.property(b);

      expect(this.filter().$or[1]).to.have.property(c);
    });
    it('should respect OR-NOR-AND precedence.', function() {
      // A | B ^ C & D -> (A | (B ^ (C & D))) -> or(nor(B, and(C, D)), A).
      var a = 'A', b = 'B', c = 'C', d = 'D';
      this.query.exists(a).or().exists(b).nor().exists(c).and().exists(d);

      expect(this.filter()).to.have.deep.property('$or[0]');
      expect(this.filter().$or[0]).to.have.property(a);

      expect(this.filter()).to.have.deep.property('$or[1].$nor[0]');
      expect(this.filter().$or[1].$nor[0]).to.have.property(b);

      expect(this.filter()).to.have.deep.property('$or[1].$nor[1].$and');
      expect(this.filter().$or[1].$nor[1].$and).to.have.length(2);
      expect(this.filter().$or[1].$nor[1].$and[0]).to.have.property(c);
      expect(this.filter().$or[1].$nor[1].$and[1]).to.have.property(d);
    });
    it('should respect (AND-OR)-NOR-AND precedence.', function() {
      // (A & B | C) ^ D & E -> (((A & B) | C) ^ (D & E)) ->
      // nor(or(and(A, B), C), and(D, E));
      var a = 'A', b = 'B', c = 'C', d = 'D', e = 'E';
      this.query.exists(a).and().exists(b).or().exists(c);
      this.query.nor().exists(d).and().exists(e);

      expect(this.filter()).to.have.deep.property('$nor[0].$or[0].$and');
      expect(this.filter().$nor[0].$or[0].$and).to.have.length(2);
      expect(this.filter().$nor[0].$or[0].$and[0]).to.have.property(a);
      expect(this.filter().$nor[0].$or[0].$and[1]).to.have.property(b);

      expect(this.filter()).to.have.deep.property('$nor[0].$or[1]');
      expect(this.filter().$nor[0].$or[1]).to.have.property(c);

      expect(this.filter()).to.have.deep.property('$nor[1].$and');
      expect(this.filter().$nor[1].$and).to.have.length(2);
      expect(this.filter().$nor[1].$and[0]).to.have.property(d);
      expect(this.filter().$nor[1].$and[1]).to.have.property(e);
    });
    it('should set the limit on the top-level query.', function() {
      var value = 10;
      this.query.and().limit(value);
      expect(this.limit()).to.equal(value);
    });
    it('should set the skip on the top-level query.', function() {
      var value = 10;
      this.query.and().skip(value);
      expect(this.skip()).to.equal(value);
    });
    it('should set the ascending sort on the top-level query.', function() {
      this.query.and().ascending(this.field);
      expect(this.sort()).to.have.property(this.field, 1);
    });
    it('should set the descending sort on the top-level query.', function() {
      this.query.and().descending(this.field);
      expect(this.sort()).to.have.property(this.field, -1);
    });
    it('should set the sort on the top-level query.', function() {
      var value = {};
      value[this.field] = 1;

      this.query.and().sort(value);
      expect(this.sort()).to.equal(value);
    });
  });

});