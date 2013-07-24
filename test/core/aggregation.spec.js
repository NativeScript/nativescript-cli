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
 * Test suite for `Kinvey.Group`.
 */
describe('Kinvey.Group', function() {

  // Housekeeping: allow easy access to query properties.
  before(function() {
    var _this = this;
    ['condition', 'initial', 'key', 'reduce'].forEach(function(name) {
      _this[name] = function() {
        return _this.aggregation.toJSON()[name];
      };
    });
  });
  after(function() {// Cleanup.
    var _this = this;
    ['condition', 'initial', 'key', 'reduce'].forEach(function(name) {
      delete _this[name];
    });
  });

  // Housekeeping: create an empty group.
  beforeEach(function() {
    this.aggregation = new Kinvey.Group();
  });
  afterEach(function() {// Cleanup.
    delete this.aggregation;
  });

  // Kinvey.Group.
  describe('the constructor', function() {
    // Test suite.
  });

  // Kinvey.Group#by.
  describe('the by method', function() {
    // Test suite.
    it('should set the field to group by.', function() {
      var field = this.randomID();
      this.aggregation.by(field);
      expect(this.key()).to.have.keys([field]);
    });
    it('should set multiple fields to group by.', function() {
      var field1 = this.randomID();
      var field2 = this.randomID();
      this.aggregation.by(field1);
      this.aggregation.by(field2);
      expect(this.key()).to.have.keys([ field1, field2 ]);
    });
    it('should return the aggregation.', function() {
      var result = this.aggregation.by(this.randomID());
      expect(result).to.equal(this.aggregation);
    });
  });

  // Kinvey.Group#initial.
  describe('the initial method', function() {
    // Test suite.
    it('should throw on invalid arguments: object.', function() {
      var _this = this;
      expect(function() {
        _this.aggregation.initial(_this.randomID());
      }).to.Throw('Object');
    });
    it('should set the initial object.', function() {
      var obj = { field: this.randomID() };
      this.aggregation.initial(obj);
      expect(this.initial()).to.equal(obj);
    });
    it('should append an initial field.', function() {
      var field = this.randomID();
      var value = this.randomID();
      this.aggregation.initial(field, value);
      expect(this.initial()).to.have.property(field, value);
    });
    it('should return the aggregation.', function() {
      var result = this.aggregation.initial({});
      expect(result).to.equal(this.aggregation);
    });
  });

  // Kinvey.Group#postProcess.
  describe('the postProcess method', function() {
    // Housekeeping: generate data.
    beforeEach(function() {
      this.response = [
        { a: 1, b: 'b', c: 2.5 },
        { a: 1, b: 'b', c: 5 },
        { a: 2, b: 'a', c: 1 },
        { a: 0, b: 'c', c: 7.25 },
        { b: 'd', c: 0 }
      ];
      this.raw = JSON.parse(JSON.stringify(this.response));// Deep copy.
    });
    afterEach(function() {// Cleanup.
      delete this.raw;
      delete this.response;
    });

    describe('with query', function() {
      // Housekeeping: attach a query to the aggregation.
      beforeEach(function() {
        this.query = new Kinvey.Query();
        this.aggregation.query(this.query);
      });
      afterEach(function() {// Cleanup.
        delete this.query;
      });

      // Test suite.
      it('should throw on invalid arguments: response.', function() {
        var _this = this;
        expect(function() {
          _this.aggregation.postProcess({});
        }).to.Throw('Array');
      });

      it('should sort, field:ascending.', function() {
        var expected = [
          this.raw[3], this.raw[0], this.raw[1], this.raw[2], this.raw[4]
        ];

        this.query.ascending('a');
        var result = this.aggregation.postProcess(this.response);
        expect(result).to.deep.equal(expected);
      });
      it('should sort, field:descending.', function() {
        var expected = [
          this.raw[2], this.raw[0], this.raw[1], this.raw[3], this.raw[4]
        ];

        this.query.descending('a');
        var result = this.aggregation.postProcess(this.response);
        expect(result).to.deep.equal(expected);
      });
      it('should sort, field:ascending-field:descending.', function() {
        var expected = [
          this.raw[2], this.raw[1], this.raw[0], this.raw[3], this.raw[4]
        ];

        this.query.ascending('b').descending('c');
        var result = this.aggregation.postProcess(this.response);
        expect(result).to.deep.equal(expected);
      });
      it('should limit.', function() {
        var expected = [ this.raw[0], this.raw[1], this.raw[2] ];

        this.query.limit(3);
        var result = this.aggregation.postProcess(this.response);
        expect(result).to.deep.equal(expected);
      });
      it('should skip.', function() {
        var expected = [ this.raw[3], this.raw[4] ];

        this.query.skip(3);
        var result = this.aggregation.postProcess(this.response);
        expect(result).to.deep.equal(expected);
      });
      it('should limit and skip.', function() {
        var expected = [ this.raw[2], this.raw[3] ];

        this.query.limit(2).skip(2);
        var result = this.aggregation.postProcess(this.response);
        expect(result).to.deep.equal(expected);
      });
      it('should sort, limit, and skip.', function() {
        var expected = [ this.raw[0] ];

        this.query.descending('a').descending('c').limit(1).skip(2);
        var result = this.aggregation.postProcess(this.response);
        expect(result).to.deep.equal(expected);
      });
    });

    describe('without query', function() {
      // Test suite.
      it('should return the raw response.', function() {
        var result = this.aggregation.postProcess(this.response);
        expect(result).to.equal(this.response);
      });
    });
  });

  // Kinvey.Group#query.
  describe('the query method', function() {
    // Housekeeping: create a query.
    before(function() {
      this.query = new Kinvey.Query();
      this.query.equalTo(this.randomID(), this.randomID());
    });
    after(function() {// Cleanup.
      delete this.query;
    });

    // Test suite.
    it('should throw on invalid arguments: query.', function() {
      var _this = this;
      expect(function() {
        _this.aggregation.query({});
      }).to.Throw('Kinvey.Query');
    });
    it('should set the condition.', function() {
      this.aggregation.query(this.query);
      expect(this.condition()).to.equal(this.query.toJSON().filter);
    });
    it('should return the aggregation.', function() {
      var result = this.aggregation.query(this.query);
      expect(result).to.equal(this.aggregation);
    });
  });

  // Kinvey.Group#reduce.
  describe('the reduce method', function() {
    // Housekeeping: create a reduce function.
    before(function() {
      this.reduceFn = function(doc, out) {
        out.field = true;
      };
    });
    after(function() {// Cleanup.
      delete this.reduceFn;
    });

    // Test suite.
    it('should throw on invalid arguments: fn.', function() {
      var _this = this;
      expect(function() {
        _this.aggregation.reduce();
      }).to.Throw('function');
    });
    it('should set the reduce function, type:string.', function() {
      this.aggregation.reduce(this.reduceFn.toString());
      expect(this.reduce()).to.equal(this.reduceFn.toString());
    });
    it('should set the reduce function, type:function.', function() {
      this.aggregation.reduce(this.reduceFn);
      expect(this.reduce()).to.equal(this.reduceFn.toString());
    });
    it('should return the aggregation.', function() {
      var result = this.aggregation.reduce(this.reduceFn);
      expect(result).to.equal(this.aggregation);
    });
  });

  // Preseeded aggregations.
  describe('preseeds', function() {
    // Housekeeping: define field under test.
    before(function() {
      this.field = this.randomID();
    });
    after(function() {// Cleanup.
      delete this.field;
    });

    // Kinvey.Group.count.
    describe('the count method', function() {
      // Test suite.
      it('should preseed the aggregation.', function() {
        var aggregation = Kinvey.Group.count();
        expect(aggregation.toJSON().initial).to.have.property('result', 0);
        expect(aggregation.toJSON().reduce).to.contain('out.result += 1');
      });
      it('should return an aggregation.', function() {
        var result = Kinvey.Group.count();
        expect(result).to.be.an.instanceOf(Kinvey.Group);
      });
    });

    // Kinvey.Group.sum.
    describe('the sum method', function() {
      // Test suite.
      it('should preseed the aggregation.', function() {
        var aggregation = Kinvey.Group.sum(this.field);
        expect(aggregation.toJSON().initial).to.have.property('result', 0);
        expect(aggregation.toJSON().reduce).to.contain(this.field);
        expect(aggregation.toJSON().reduce).to.contain('out.result += doc');
      });
      it('should return an aggregation.', function() {
        var result = Kinvey.Group.count();
        expect(result).to.be.an.instanceOf(Kinvey.Group);
      });
    });

    // Kinvey.Group.min.
    describe('the min method', function() {
      // Test suite.
      it('should preseed the aggregation.', function() {
        var aggregation = Kinvey.Group.min(this.field);
        expect(aggregation.toJSON().initial).to.have.property('result', 'Infinity');
        expect(aggregation.toJSON().reduce).to.contain(this.field);
        expect(aggregation.toJSON().reduce).to.contain('Math.min');
      });
      it('should return an aggregation.', function() {
        var result = Kinvey.Group.min(this.field);
        expect(result).to.be.an.instanceOf(Kinvey.Group);
      });
    });

    // Kinvey.Group.max.
    describe('the max method', function() {
      // Test suite.
      it('should preseed the aggregation.', function() {
        var aggregation = Kinvey.Group.max(this.field);
        expect(aggregation.toJSON().initial).to.have.property('result', '-Infinity');
        expect(aggregation.toJSON().reduce).to.contain(this.field);
        expect(aggregation.toJSON().reduce).to.contain('Math.max');
      });
      it('should return an aggregation.', function() {
        var result = Kinvey.Group.max(this.field);
        expect(result).to.be.an.instanceOf(Kinvey.Group);
      });
    });

    // Kinvey.Group.average.
    describe('the average method', function() {
      // Test suite.
      it('should preseed the aggregation.', function() {
        var aggregation = Kinvey.Group.average(this.field);
        expect(aggregation.toJSON().initial).to.have.property('result', 0);
        expect(aggregation.toJSON().reduce).to.contain(this.field);
        expect(aggregation.toJSON().reduce).to.contain('/ (out.count + 1)');
      });
      it('should return an aggregation.', function() {
        var result = Kinvey.Group.count();
        expect(result).to.be.an.instanceOf(Kinvey.Group);
      });
    });

  });

});