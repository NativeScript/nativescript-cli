import expect from 'expect';
import { randomString } from 'src/utils';
import Query from 'src/query';

describe('Query', function() {
  describe('constructor', function() {
    it('should throw error when fields is not an array', function(){
      expect(() => {
        const query = new Query();
        query.fields = {};
        return query;
      }).toThrow(/fields must be an Array/);
    });

    it('should parse a limit from string', function() {
      const query = new Query();
      query.limit = '3';

      expect(query.limit).toEqual(3);
    });

    it('should parse a skip from string', function() {
      const query = new Query();
      query.skip = '10';

      expect(query.skip).toEqual(10);
    });
  });

  describe('fields', function() {
    it('should throw an error on invalid arguments', function() {
      expect(function() {
        const query = new Query();
        query.fields = {};
      }).toThrow();
    });

    it('should set the fields', function() {
      const fields = [randomString(), randomString()];
      const query = new Query();
      query.fields = fields;
      expect(query.toPlainObject().fields).toEqual(fields);
    });

    it('should reset the fields', function() {
      const query = new Query();
      query.fields = [];
      expect(query.toPlainObject().fields).toEqual([]);
    });
  });

  describe('limit', function() {
    it('should throw an error on invalid arguments', function() {
      expect(function() {
        const query = new Query();
        query.limit = {};
      }).toThrow();
    });

    it('should set the limit', function() {
      const limit = 10;
      const query = new Query();
      query.limit = limit;
      expect(query.toPlainObject().limit).toEqual(limit);
    });

    it('should unset the limit', function() {
      const query = new Query();
      query.limit = null;
      expect(query.toPlainObject().limit).toEqual(null);
    });
  });

  describe('skip', function() {
    it('should throw an error on invalid arguments', function() {
      expect(function() {
        const query = new Query();
        query.skip = {};
      }).toThrow();
    });

    it('should set the skip', function() {
      const skip = 10;
      const query = new Query();
      query.skip = skip;
      expect(query.toPlainObject().skip).toEqual(skip);
    });

    it('should unset the skip', function() {
      const query = new Query();
      query.skip = 0;
      expect(query.toPlainObject().skip).toEqual(0);
    });
  });

  describe('sort', function() {
    it('should set the sort', function() {
      const sort = {};
      sort[randomString()] = 1;
      const query = new Query();
      query.sort = sort;
      expect(query.toPlainObject().sort).toEqual(sort);
    });

    it('should reset the sort.', function() {
      const query = new Query();
      query.sort = {};
      expect(query.toPlainObject().sort).toEqual({});
    });
  });

  describe('isSupportedOffline()', function() {
    it('should be false when trying to filter geo queries', function() {
      const query = new Query();
      query.near('loc', [0, 0]);
      expect(query.isSupportedOffline()).toEqual(false);
    });

    it('should be true', function() {
      const query = new Query();
      query.equalTo('foo', 'bar');
      expect(query.isSupportedOffline()).toEqual(true);
    });
  });

  describe('equalTo()', function() {
    it('should add an equal to filter', function() {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.equalTo(field, value);
      expect(query.toPlainObject().filter[field]).toEqual(value);
    });

    it('should discard any existing filters on the same field', function() {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.equalTo(field, randomString()); // Should be discarded
      query.equalTo(field, value);
      expect(query.toPlainObject().filter[field]).toEqual(value);
    });

    it('should return the query', function() {
      const query = new Query().equalTo(randomString(), randomString());
      expect(query).toBeA(Query);
    });
  });

  describe('contains()', function() {
    it('should accept a single value', function() {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.contains(field, value);
      expect(query.toPlainObject().filter[field]).toEqual({ $in: [value] });
    });

    it('should accept an array of values', function() {
      const field = randomString();
      const value = [randomString(), randomString()];
      const query = new Query();
      query.contains(field, value);
      expect(query.toPlainObject().filter[field]).toEqual({ $in: value });
    });

    it('should respect any existing filters on the same field', function() {
      const field = randomString();
      const query = new Query();
      query.greaterThan(field, randomString());
      query.contains(field, [randomString()]);
      expect(query.toPlainObject().filter[field]).toIncludeKey('$gt');
    });

    it('should return the query', function() {
      const query = new Query().contains(randomString(), [randomString()]);
      expect(query).toBeA(Query);
    });
  });

  describe('containsAll()', function() {
    it('should accept a single value and add a contains all filter', function() {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.containsAll(field, value);
      expect(query.toPlainObject().filter[field]).toEqual({ $all: [value] });
    });

    it('should accept an array of values and add a contains all filter', function() {
      const field = randomString();
      const value = [randomString(), randomString()];
      const query = new Query();
      query.containsAll(field, value);
      expect(query.toPlainObject().filter[field]).toEqual({ $all: value });
    });

    it('should respect any existing filters on the same field', function() {
      const field = randomString();
      const query = new Query();
      query.greaterThan(field, randomString());
      query.containsAll(field, [randomString()]);
      expect(query.toPlainObject().filter[field]).toIncludeKey('$gt');
    });

    it('should return the query', function() {
      const query = new Query().containsAll(randomString(), [randomString()]);
      expect(query).toBeA(Query);
    });
  });

  describe('greaterThan()', function() {
    it('should throw an error with invalid arguments', function() {
      expect(function() {
        const query = new Query();
        query.greaterThan(randomString(), null);
      }).toThrow();
    });

    it('should add a greater than filter', function() {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.greaterThan(field, value);
      expect(query.toPlainObject().filter[field]).toEqual({ $gt: value });
    });

    it('should respect any existing filters on the same field', function() {
      const field = randomString();
      const query = new Query();
      query.greaterThan(field, randomString());
      query.containsAll(field, [randomString()]);
      expect(query.toPlainObject().filter[field]).toIncludeKey('$all');
    });

    it('should return the query', function() {
      const query = new Query().greaterThan(randomString(), randomString());
      expect(query).toBeA(Query);
    });
  });

  describe('greaterThanOrEqualTo()', function() {
    it('should throw an error with invalid arguments', function() {
      expect(function() {
        const query = new Query();
        query.greaterThanOrEqualTo(randomString(), null);
      }).toThrow();
    });

    it('should add a greater than or equal filter', function() {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.greaterThanOrEqualTo(field, value);
      expect(query.toPlainObject().filter[field]).toEqual({ $gte: value });
    });

    it('should respect any existing filters on the same field', function() {
      const field = randomString();
      const query = new Query();
      query.greaterThanOrEqualTo(field, randomString());
      query.containsAll(field, [randomString()]);
      expect(query.toPlainObject().filter[field]).toIncludeKey('$all');
    });

    it('should return the query', function() {
      const query = new Query().greaterThanOrEqualTo(randomString(), randomString());
      expect(query).toBeA(Query);
    });
  });

  describe('lessThan()', function() {
    it('should throw an error with invalid arguments', function() {
      expect(function() {
        const query = new Query();
        query.lessThan(randomString(), null);
      }).toThrow();
    });

    it('should add a less than filter', function() {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.lessThan(field, value);
      expect(query.toPlainObject().filter[field]).toEqual({ $lt: value });
    });

    it('should respect any existing filters on the same field', function() {
      const field = randomString();
      const query = new Query();
      query.lessThan(field, randomString());
      query.containsAll(field, [randomString()]);
      expect(query.toPlainObject().filter[field]).toIncludeKey('$all');
    });

    it('should return the query', function() {
      const query = new Query().lessThan(randomString(), randomString());
      expect(query).toBeA(Query);
    });
  });

  describe('lessThanOrEqualTo()', function() {
    it('should throw an error with invalid arguments', function() {
      expect(function() {
        const query = new Query();
        query.lessThanOrEqualTo(randomString(), null);
      }).toThrow();
    });

    it('should add a less than or equal filter', function() {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.lessThanOrEqualTo(field, value);
      expect(query.toPlainObject().filter[field]).toEqual({ $lte: value });
    });

    it('should respect any existing filters on the same field', function() {
      const field = randomString();
      const query = new Query();
      query.lessThanOrEqualTo(field, randomString());
      query.containsAll(field, [randomString()]);
      expect(query.toPlainObject().filter[field]).toIncludeKey('$all');
    });

    it('should return the query', function() {
      const query = new Query().lessThanOrEqualTo(randomString(), randomString());
      expect(query).toBeA(Query);
    });
  });

  describe('notEqualTo()', function() {
    it('should add a not equal to filter', function() {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.notEqualTo(field, value);
      expect(query.toPlainObject().filter[field]).toEqual({ $ne: value });
    });

    it('should respect any existing filters on the same field', function() {
      const field = randomString();
      const query = new Query();
      query.notEqualTo(field, randomString());
      query.containsAll(field, [randomString()]);
      expect(query.toPlainObject().filter[field]).toIncludeKey('$all');
    });

    it('should return the query', function() {
      const query = new Query().notEqualTo(randomString(), randomString());
      expect(query).toBeA(Query);
    });
  });

  describe('notContainedIn()', function() {
    it('should accept a single value and add a not contained in filter', function() {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.notContainedIn(field, value);
      expect(query.toPlainObject().filter[field]).toEqual({ $nin: [value] });
    });

    it('should accept an array of values and add a not contained in filter', function() {
      const field = randomString();
      const value = [randomString(), randomString()];
      const query = new Query();
      query.notContainedIn(field, value);
      expect(query.toPlainObject().filter[field]).toEqual({ $nin: value });
    });

    it('should respect any existing filters on the same field', function() {
      const field = randomString();
      const query = new Query();
      query.notContainedIn(field, randomString());
      query.containsAll(field, [randomString()]);
      expect(query.toPlainObject().filter[field]).toIncludeKey('$all');
    });

    it('should return the query', function() {
      const query = new Query().notContainedIn(randomString(), randomString());
      expect(query).toBeA(Query);
    });
  });

  describe('and()', function() {
    describe('when called with arguments', function() {
      it('should throw an error with invalid arguments', function() {
        expect(function() {
          const query = new Query();
          query.and(randomString(), null);
        }).toThrow();
      });

      it('should join a query', function() {
        const query = new Query();
        query.and(new Query());
        expect(query.toPlainObject().filter).toIncludeKey('$and');
        expect(query.toPlainObject().filter.$and.length).toEqual(2);
      });

      it('should join a query object', function() {
        const query = new Query();
        query.and({ filter: {} });
        expect(query.toPlainObject().filter).toIncludeKey('$and');
        expect(query.toPlainObject().filter.$and.length).toEqual(2);
      });

      it('should join multiple queries at once', function() {
        const query = new Query();
        query.and(new Query(), new Query());
        expect(query.toPlainObject().filter).toIncludeKey('$and');
        expect(query.toPlainObject().filter.$and.length).toEqual(3);
      });

      it('should return the query', function() {
        const query = new Query().and(new Query());
        expect(query).toBeA(Query);
      });
    });

    describe('when called without arguments', function() {
      it('should return a subquery', function() {
        const query1 = new Query();
        const query2 = query1.and();
        expect(query2).toBeA(Query);
        expect(query2._parent).toEqual(query1);
      });

      it('should update the original query', function() {
        const field = randomString();
        const value = randomString();
        const query = new Query();
        query.and().greaterThan(field, value);
        expect(query.toPlainObject().filter).toIncludeKey('$and');
        expect(query.toPlainObject().filter.$and[1][field]).toEqual({ $gt: value });
      });
    });
  });

  describe('nor()', function() {
    describe('when called with arguments', function() {
      it('should throw an error with invalid arguments', function() {
        expect(function() {
          const query = new Query();
          query.nor(randomString(), null);
        }).toThrow();
      });

      it('should join a query', function() {
        const query = new Query();
        query.nor(new Query());
        expect(query.toPlainObject().filter).toIncludeKey('$nor');
        expect(query.toPlainObject().filter.$nor.length).toEqual(2);
      });

      it('should join a query object', function() {
        const query = new Query();
        query.nor({ filter: {} });
        expect(query.toPlainObject().filter).toIncludeKey('$nor');
        expect(query.toPlainObject().filter.$nor.length).toEqual(2);
      });

      it('should join multiple queries at once', function() {
        const query = new Query();
        query.nor(new Query(), new Query());
        expect(query.toPlainObject().filter).toIncludeKey('$nor');
        expect(query.toPlainObject().filter.$nor.length).toEqual(3);
      });

      it('should return the query', function() {
        const query = new Query().nor(new Query());
        expect(query).toBeA(Query);
      });
    });

    describe('when called without arguments', function() {
      it('should return a subquery', function() {
        const query1 = new Query();
        const query2 = query1.nor();
        expect(query2).toBeA(Query);
        expect(query2._parent).toEqual(query1);
      });

      it('should update the original query', function() {
        const field = randomString();
        const value = randomString();
        const query = new Query();
        query.nor().greaterThan(field, value);
        expect(query.toPlainObject().filter).toIncludeKey('$nor');
        expect(query.toPlainObject().filter.$nor[1][field]).toEqual({ $gt: value });
      });
    });
  });

  describe('or()', function() {
    describe('when called with arguments', function() {
      it('should throw an error with invalid arguments', function() {
        expect(function() {
          const query = new Query();
          query.or(randomString(), null);
        }).toThrow();
      });

      it('should join a query', function() {
        const query = new Query();
        query.or(new Query());
        expect(query.toPlainObject().filter).toIncludeKey('$or');
        expect(query.toPlainObject().filter.$or.length).toEqual(2);
      });

      it('should join a query object', function() {
        const query = new Query();
        query.or({ filter: {} });
        expect(query.toPlainObject().filter).toIncludeKey('$or');
        expect(query.toPlainObject().filter.$or.length).toEqual(2);
      });

      it('should join multiple queries at once', function() {
        const query = new Query();
        query.or(new Query(), new Query());
        expect(query.toPlainObject().filter).toIncludeKey('$or');
        expect(query.toPlainObject().filter.$or.length).toEqual(3);
      });

      it('should return the query', function() {
        const query = new Query().or(new Query());
        expect(query).toBeA(Query);
      });
    });

    describe('when called without arguments', function() {
      it('should return a subquery', function() {
        const query1 = new Query();
        const query2 = query1.or();
        expect(query2).toBeA(Query);
        expect(query2._parent).toEqual(query1);
      });

      it('should update the original query', function() {
        const field = randomString();
        const value = randomString();
        const query = new Query();
        query.or().greaterThan(field, value);
        expect(query.toPlainObject().filter).toIncludeKey('$or');
        expect(query.toPlainObject().filter.$or[1][field]).toEqual({ $gt: value });
      });
    });
  });

  describe('the exists method', function() {
    it('should add an exists filter', function() {
      const field = randomString();
      const query = new Query();
      query.exists(field);
      expect(query.toPlainObject().filter[field]).toEqual({ $exists: true });
    });

    it('should add an exists filter with flag set to false', function() {
      const field = randomString();
      const query = new Query();
      query.exists(field, false);
      expect(query.toPlainObject().filter[field]).toEqual({ $exists: false });
    });

    it('should respect any existing filters on the same field', function() {
      const field = randomString();
      const query = new Query();
      query.exists(field);
      query.containsAll(field, [randomString()]);
      expect(query.toPlainObject().filter[field]).toIncludeKey('$all');
    });

    it('should return the query', function() {
      const query = new Query().exists(randomString());
      expect(query).toBeA(Query);
    });
  });

  describe('mod()', function() {
    it('should throw an error for invalid arguments divisor', function() {
      expect(function() {
        const query = new Query();
        query.mod(randomString(), null);
      }).toThrow();
    });

    it('should throw an error for invalid arguments remainder', function() {
      expect(function() {
        const query = new Query();
        query.mod(randomString(), 5, null);
      }).toThrow();
    });

    it('should add a mod filter', function() {
      const field = randomString();
      const divisor = 5;
      const remainder = 0;
      const query = new Query();
      query.mod(field, divisor, remainder);
      expect(query.toPlainObject().filter[field]).toEqual({ $mod: [divisor, remainder] });
    });

    it('should respect any existing filters on the same field', function() {
      const field = randomString();
      const query = new Query();
      query.mod(field, 5);
      query.containsAll(field, [randomString()]);
      expect(query.toPlainObject().filter[field]).toIncludeKey('$all');
    });

    it('should return the query', function() {
      const query = new Query().mod(randomString(), 5);
      expect(query).toBeA(Query);
    });
  });

  describe('matches()', function() {
    it('throw an error for unsupported ignoreCase option', function() {
      expect(() => {
        const field = randomString();
        const query = new Query();
        return query.matches(field, /^abc/, { ignoreCase: true });
      }).toThrow(/ignoreCase/);
    });

    it('should throw an error for unanchored expression', function() {
      expect(() => {
        const field = randomString();
        const query = new Query();
        return query.matches(field, '/abc/');
      }).toThrow(/anchored/);
    });

    it('should add a match filter by string', function() {
      const field = randomString();
      const value = `^${randomString()}`;
      const query = new Query();
      query.matches(field, value);
      expect(query.toPlainObject().filter).toIncludeKey(field);
      expect(query.toPlainObject().filter[field]).toEqual({ $regex: value });
    });

    it('should add a match filter by RegExp literal', function() {
      const field = randomString();
      const value = /^foo/;
      const query = new Query();
      query.matches(field, value);
      expect(query.toPlainObject().filter).toIncludeKey(field);
      expect(query.toPlainObject().filter[field]).toEqual({ $regex: value.source });
    });

    it('should add a match filter by RegExp object.', function() {
      const field = randomString();
      const value = new RegExp('^foo');
      const query = new Query();
      query.matches(field, value);
      expect(query.toPlainObject().filter).toIncludeKey(field);
      expect(query.toPlainObject().filter[field]).toEqual({ $regex: value.source });
    });

    it('should respect any existing filters on the same field', function() {
      const field = randomString();
      const query = new Query();
      query.matches(field, `^${randomString()}`);
      query.greaterThan(field, randomString());
      expect(query.toPlainObject().filter).toIncludeKey(field);
      expect(query.toPlainObject().filter[field]).toIncludeKey(['$gt']);
    });

    it('should return the query', function() {
      const field = randomString();
      const query = new Query();
      const value = query.matches(field, /^foo/);
      expect(value).toEqual(query);
    });

    describe('with options', function() {
      it('should throw if the ignoreCase flag is part of the RegExp.', function() {
        expect(() => {
          const field = randomString();
          const query = new Query();
          return query.matches(field, /^foo/i);
        }).toThrow(/ignoreCase/);
      });

      it('should unset the ignoreCase flag if `options.ignoreCase` is `false`', function() {
        const field = randomString();
        const value = /^foo/i;
        const query = new Query();
        query.matches(field, value, { ignoreCase: false });
        expect(query.toPlainObject().filter).toIncludeKey(field);
        expect(query.toPlainObject().filter[field]).toNotIncludeKey('$options');
      });

      it('should set the multiline flag if part of the RegExp', function() {
        const field = randomString();
        const value = /^foo/m;
        const query = new Query();
        query.matches(field, value);
        expect(query.toPlainObject().filter).toIncludeKey(field);
        expect(query.toPlainObject().filter[field]).toInclude({ $options: 'm' });
      });

      it('should set the multiline flag if `options.multiline`', function() {
        const field = randomString();
        const value = /^foo/;
        const query = new Query();
        query.matches(field, value, { multiline: true });
        expect(query.toPlainObject().filter).toIncludeKey(field);
        expect(query.toPlainObject().filter[field]).toInclude({ $options: 'm' });
      });

      it('should unset the multiline flag if `options.multiline` is `false`', function() {
        const field = randomString();
        const value = /^foo/m;
        const query = new Query();
        query.matches(field, value, { multiline: false });
        expect(query.toPlainObject().filter).toIncludeKey(field);
        expect(query.toPlainObject().filter[field]).toNotIncludeKey('$options');
      });

      it('should set the extended flag if `options.extended`', function() {
        const field = randomString();
        const value = `^${randomString()}`;
        const query = new Query();
        query.matches(field, value, { extended: true });
        expect(query.toPlainObject().filter).toIncludeKey(field);
        expect(query.toPlainObject().filter[field]).toInclude({ $options: 'x' });
      });

      it('should not set the multiline flag if `options.extended` is `false`', function() {
        const field = randomString();
        const value = `^${randomString()}`;
        const query = new Query();
        query.matches(field, value, { extended: false });
        expect(query.toPlainObject().filter).toIncludeKey(field);
        expect(query.toPlainObject().filter[field]).toNotIncludeKey('$options');
      });

      it('should set the dotMatchesAll flag if `options.dotMatchesAll`', function() {
        const field = randomString();
        const value = `^${randomString()}`;
        const query = new Query();
        query.matches(field, value, { dotMatchesAll: true });
        expect(query.toPlainObject().filter).toIncludeKey(field);
        expect(query.toPlainObject().filter[field]).toInclude({ $options: 's' });
      });

      it('should not set the dotMatchesAll flag if `options.dotMatchesAll` is `false`', function() {
        const field = randomString();
        const value = `^${randomString()}`;
        const query = new Query();
        query.matches(field, value, { dotMatchesAll: false });
        expect(query.toPlainObject().filter).toIncludeKey(field);
        expect(query.toPlainObject().filter[field]).toNotIncludeKey('$options');
      });

      it('should set multiple flags.', function() {
        const field = randomString();
        const value = /^foo/im;
        const query = new Query();
        query.matches(field, value, {
          ignoreCase: false,
          extended: true,
          dotMatchesAll: true
        });
        expect(query.toPlainObject().filter).toIncludeKey(field);
        expect(query.toPlainObject().filter[field]).toInclude({ $options: 'mxs' });
      });
    });
  });

  describe('near()', function() {
    it('should throw an error on invalid arguments', function() {
      expect(function() {
        const query = new Query();
        query.near(randomString(), []);
      }).toThrow();
    });

    it('should add a near filter', function() {
      const field = randomString();
      const coord = [-1, 1];
      const query = new Query();
      query.near(field, coord);
      expect(query.toPlainObject().filter[field]).toEqual({ $nearSphere: coord });
    });

    it('should add a near filter, with $maxDistance', function() {
      const field = randomString();
      const coord = [-1, 1];
      const maxDistance = 10;
      const query = new Query();
      query.near(field, coord, maxDistance);
      expect(query.toPlainObject().filter[field]).toEqual({ $nearSphere: coord, $maxDistance: maxDistance });
    });

    it('should return the query', function() {
      const query = new Query().near(randomString(), [-1, 1]);
      expect(query).toBeA(Query);
    });
  });

  describe('withinBox()', function() {
    it('should throw an error on invalid arguments: bottomLeftCoord', function() {
      expect(function() {
        const query = new Query();
        query.withinBox(randomString(), [], [1, 1]);
      }).toThrow();
    });

    it('should throw an error on invalid arguments: upperRightCoord', function() {
      expect(function() {
        const query = new Query();
        query.withinBox(randomString(), [1, 1], []);
      }).toThrow();
    });

    it('should add a within box filter', function() {
      const field = randomString();
      const box = [[-1, -1], [1, 1]];
      const query = new Query();
      query.withinBox(field, box[0], box[1]);
      expect(query.toPlainObject().filter[field]).toEqual({ $within: { $box: box } });
    });

    it('should return the query', function() {
      const query = new Query().withinBox(randomString(), [-1, -1], [1, 1]);
      expect(query).toBeA(Query);
    });
  });

  describe('withinPolygon()', function() {
    it('should throw an error on invalid arguments: coord', function() {
      expect(function() {
        const query = new Query();
        query.withinPolygon(randomString(), []);
      }).toThrow();
    });

    it('should add a within polygon filter', function() {
      const field = randomString();
      const polygon = [[-1, -1], [-1, 1], [1, 1]];
      const query = new Query();
      query.withinPolygon(field, polygon);
      expect(query.toPlainObject().filter[field]).toEqual({ $within: { $polygon: polygon } });
    });

    it('should return the query', function() {
      const query = new Query().withinPolygon(randomString(), [[-1, -1], [-1, 1], [1, 1]]);
      expect(query).toBeA(Query);
    });
  });

  describe('size()', function() {
    it('should throw an error on invalid arguments', function() {
      expect(function() {
        const query = new Query();
        query.size(randomString(), null);
      }).toThrow();
    });

    it('should add a size filter', function() {
      const field = randomString();
      const value = 10;
      const query = new Query();
      query.size(field, value);
      expect(query.toPlainObject().filter[field]).toEqual({ $size: value });
    });

    it('should respect any existing filters on the same field', function() {
      const field = randomString();
      const query = new Query();
      query.size(field, 10);
      query.containsAll(field, [randomString()]);
      expect(query.toPlainObject().filter[field]).toIncludeKey('$all');
    });

    it('should return the query', function() {
      const query = new Query().size(randomString(), 10);
      expect(query).toBeA(Query);
    });
  });

  describe('ascending()', function() {
    it('should set the field', function() {
      const field = randomString();
      const query = new Query();
      query.ascending(field);
      expect(query.toPlainObject().sort[field]).toEqual(1);
    });

    it('should append a field', function() {
      const field1 = randomString();
      const field2 = randomString();
      const query = new Query();
      query.ascending(field1);
      query.ascending(field2);
      expect(query.toPlainObject().sort[field1]).toEqual(1);
      expect(query.toPlainObject().sort[field2]).toEqual(1);
    });

    it('should append a descending field', function() {
      const field1 = randomString();
      const field2 = randomString();
      const query = new Query();
      query.ascending(field1);
      query.descending(field2);
      expect(query.toPlainObject().sort[field1]).toEqual(1);
      expect(query.toPlainObject().sort[field2]).toEqual(-1);
    });
  });

  describe('descending()', function() {
    it('should set the field', function() {
      const field = randomString();
      const query = new Query();
      query.descending(field);
      expect(query.toPlainObject().sort[field]).toEqual(-1);
    });

    it('should append a field', function() {
      const field1 = randomString();
      const field2 = randomString();
      const query = new Query();
      query.descending(field1);
      query.descending(field2);
      expect(query.toPlainObject().sort[field1]).toEqual(-1);
      expect(query.toPlainObject().sort[field2]).toEqual(-1);
    });

    it('should append a ascending field', function() {
      const field1 = randomString();
      const field2 = randomString();
      const query = new Query();
      query.descending(field1);
      query.ascending(field2);
      expect(query.toPlainObject().sort[field1]).toEqual(-1);
      expect(query.toPlainObject().sort[field2]).toEqual(1);
    });
  });

  describe('when chained', function() {
    it('should respect AND-NOR precedence.', function() {
      // A & B ^ C -> ((A & B) ^ C) -> nor(and(A, B), C).
      const a = 'A';
      const b = 'B';
      const c = 'C';
      const query = new Query();
      query.exists(a)
        .and()
        .exists(b)
        .nor()
        .exists(c);
      expect(query.toPlainObject().filter.$nor[0].$and.length).toEqual(2);
      expect(query.toPlainObject().filter.$nor[0].$and[0]).toIncludeKey(a);
      expect(query.toPlainObject().filter.$nor[0].$and[1]).toIncludeKey(b);
      expect(query.toPlainObject().filter.$nor[1]).toIncludeKey(c);
    });

    it('should respect AND-NOR-AND precedence.', function() {
      // A & B ^ C & D -> ((A & B) ^ (C & D) -> nor(and(A, B), and(C, D)).
      const a = 'A';
      const b = 'B';
      const c = 'C';
      const d = 'D';
      const query = new Query();
      query.exists(a)
        .and()
        .exists(b)
        .nor()
        .exists(c)
        .and()
        .exists(d);
      expect(query.toPlainObject().filter.$nor[0].$and.length).toEqual(2);
      expect(query.toPlainObject().filter.$nor[0].$and[0]).toIncludeKey(a);
      expect(query.toPlainObject().filter.$nor[0].$and[1]).toIncludeKey(b);
      expect(query.toPlainObject().filter.$nor[1].$and.length).toEqual(2);
      expect(query.toPlainObject().filter.$nor[1].$and[0]).toIncludeKey(c);
      expect(query.toPlainObject().filter.$nor[1].$and[1]).toIncludeKey(d);
    });

    it('should respect AND-OR precedence.', function() {
      // A & B | C -> ((A & B) | C) -> or(and(A, B), C).
      const a = 'A';
      const b = 'B';
      const c = 'C';
      const query = new Query();
      query.exists(a)
        .and()
        .exists(b)
        .or()
        .exists(c);
      expect(query.toPlainObject().filter.$or[0].$and.length).toEqual(2);
      expect(query.toPlainObject().filter.$or[0].$and[0]).toIncludeKey(a);
      expect(query.toPlainObject().filter.$or[0].$and[1]).toIncludeKey(b);
      expect(query.toPlainObject().filter.$or[1]).toIncludeKey(c);
    });

    it('should respect AND-OR-AND precedence.', function() {
      // A & B | C & D -> ((A & B) | (C & D) -> or(and(A, B), and(C, D)).
      const a = 'A';
      const b = 'B';
      const c = 'C';
      const d = 'D';
      const query = new Query();
      query.exists(a)
        .and()
        .exists(b)
        .or()
        .exists(c)
        .and()
        .exists(d);
      expect(query.toPlainObject().filter.$or[0].$and.length).toEqual(2);
      expect(query.toPlainObject().filter.$or[0].$and[0]).toIncludeKey(a);
      expect(query.toPlainObject().filter.$or[0].$and[1]).toIncludeKey(b);
      expect(query.toPlainObject().filter.$or[1].$and.length).toEqual(2);
      expect(query.toPlainObject().filter.$or[1].$and[0]).toIncludeKey(c);
      expect(query.toPlainObject().filter.$or[1].$and[1]).toIncludeKey(d);
    });

    it('should respect NOR-OR precedence.', function() {
      // A ^ B | C -> ((A ^ B) | C) -> or(nor(A, B), C).
      const a = 'A';
      const b = 'B';
      const c = 'C';
      const query = new Query();
      query.exists(a)
        .nor()
        .exists(b)
        .or()
        .exists(c);
      expect(query.toPlainObject().filter.$or[0].$nor.length).toEqual(2);
      expect(query.toPlainObject().filter.$or[0].$nor[0]).toIncludeKey(a);
      expect(query.toPlainObject().filter.$or[0].$nor[1]).toIncludeKey(b);
      expect(query.toPlainObject().filter.$or[1]).toIncludeKey(c);
    });

    it('should respect OR-NOR-AND precedence.', function() {
      // A | B ^ C & D -> (A | (B ^ (C & D))) -> or(nor(B, and(C, D)), A).
      const a = 'A';
      const b = 'B';
      const c = 'C';
      const d = 'D';
      const query = new Query();
      query.exists(a)
        .or()
        .exists(b)
        .nor()
        .exists(c)
        .and()
        .exists(d);
      expect(query.toPlainObject().filter.$or[0]).toIncludeKey(a);
      expect(query.toPlainObject().filter.$or[1].$nor[0]).toIncludeKey(b);
      expect(query.toPlainObject().filter.$or[1].$nor[1].$and[0]).toIncludeKey(c);
      expect(query.toPlainObject().filter.$or[1].$nor[1].$and[1]).toIncludeKey(d);
    });

    it('should respect (AND-OR)-NOR-AND precedence.', function() {
      // (A & B | C) ^ D & E -> (((A & B) | C) ^ (D & E)) ->
      // nor(or(and(A, B), C), and(D, E));
      const a = 'A';
      const b = 'B';
      const c = 'C';
      const d = 'D';
      const e = 'E';
      const query = new Query();
      query.exists(a)
        .and()
        .exists(b)
        .or()
        .exists(c);
      query.nor()
        .exists(d)
        .and()
        .exists(e);
      expect(query.toPlainObject().filter.$nor[0].$or[0].$and[0]).toIncludeKey(a);
      expect(query.toPlainObject().filter.$nor[0].$or[0].$and[1]).toIncludeKey(b);
      expect(query.toPlainObject().filter.$nor[0].$or[1]).toIncludeKey(c);
      expect(query.toPlainObject().filter.$nor[1].$and[0]).toIncludeKey(d);
      expect(query.toPlainObject().filter.$nor[1].$and[1]).toIncludeKey(e);
    });

    it('should set the limit on the top-level query.', function() {
      const value = 10;
      const query = new Query();
      query.and().limit = value;
      expect(query.toPlainObject().limit).toEqual(value);
    });

    it('should set the skip on the top-level query.', function() {
      const value = 10;
      const query = new Query();
      query.and().skip = value;
      expect(query.toPlainObject().skip).toEqual(value);
    });

    it('should set the ascending sort on the top-level query.', function() {
      const field = randomString();
      const query = new Query();
      query.and().ascending(field);
      expect(query.toPlainObject().sort[field]).toEqual(1);
    });

    it('should set the descending sort on the top-level query.', function() {
      const field = randomString();
      const query = new Query();
      query.and().descending(field);
      expect(query.toPlainObject().sort[field]).toEqual(-1);
    });

    it('should set the sort on the top-level query.', function() {
      const value = {};
      value[randomString()] = 1;
      const query = new Query();
      query.and().sort = value;
      expect(query.toPlainObject().sort).toEqual(value);
    });
  });

  describe('comparators', function() {
    it('should add a $gt filter', function() {
      const query = new Query();
      query.greaterThan('field', 1);
      const queryString = query.toQueryString();
      expect(queryString).toInclude({ query: '{"field":{"$gt":1}}' });
    });

    it('throw an error when $gt comparator is not a string or number', function() {
      expect(() => {
        const query = new Query();
        query.greaterThan('field', {});
        return query.process([]);
      }).toThrow(/You must supply a number or string./);
    });

    it('should add a $gte filter', function() {
      const query = new Query();
      query.greaterThanOrEqualTo('field', 1);
      const queryString = query.toQueryString();
      expect(queryString).toInclude({ query: '{"field":{"$gte":1}}' });
    });

    it('throw an error when $gte comparator is not a string or number', function() {
      expect(() => {
        const query = new Query();
        query.greaterThanOrEqualTo('field', {});
        return query.process([]);
      }).toThrow(/You must supply a number or string./);
    });

    it('should add a $lt filter', function() {
      const query = new Query();
      query.lessThan('field', 1);
      const queryString = query.toQueryString();
      expect(queryString).toInclude({ query: '{"field":{"$lt":1}}' });
    });

    it('throw an error when $lt comparator is not a string or number', function() {
      expect(() => {
        const query = new Query();
        query.lessThan('field', {});
        return query.process([]);
      }).toThrow(/You must supply a number or string./);
    });

    it('should add a $lte filter', function() {
      const query = new Query();
      query.lessThanOrEqualTo('field', 1);
      const queryString = query.toQueryString();
      expect(queryString).toInclude({ query: '{"field":{"$lte":1}}' });
    });

    it('throw an error when $lte comparator is not a string or number', function() {
      expect(() => {
        const query = new Query();
        query.lessThanOrEqualTo('field', {});
        return query.process([]);
      }).toThrow(/You must supply a number or string./);
    });

    it('should add a $ne filter', function() {
      const query = new Query();
      query.notEqualTo('field', 1);
      const queryString = query.toQueryString();
      expect(queryString).toInclude({ query: '{"field":{"$ne":1}}' });
    });
  });

  describe('logical operators', function() {
    it('should add a $and filter', function() {
      const query1 = new Query();
      query1.equalTo('field1', 'value1');

      const query2 = new Query();
      query2.equalTo('field2', 'value2');

      const queryString = query1.and(query2).toQueryString();
      expect(queryString).toInclude({ query: '{"$and":[{"field1":"value1"},{"field2":"value2"}]}' });
    });

    it('should add a $or filter', function() {
      const query1 = new Query();
      query1.equalTo('field1', 'value1');

      const query2 = new Query();
      query2.equalTo('field2', 'value2');

      const queryString = query1.or(query2).toQueryString();
      expect(queryString).toInclude({ query: '{"$or":[{"field1":"value1"},{"field2":"value2"}]}' });
    });

    it('should add a $nor filter', function() {
      const query1 = new Query();
      query1.equalTo('field1', 'value1');

      const query2 = new Query();
      query2.equalTo('field2', 'value2');

      const queryString = query1.nor(query2).toQueryString();
      expect(queryString).toInclude({ query: '{"$nor":[{"field1":"value1"},{"field2":"value2"}]}' });
    });
  });

  describe('process()', function() {
    it('throw an error when a query is not supported locally', function() {
      expect(() => {
        const query = new Query();
        query.near('loc', [0, 0]);
        return query.process([]);
      }).toThrow(/This query is not able to run locally./);
    });

    it('throw an error when a data is not an array', function() {
      expect(() => {
        const query = new Query();
        return query.process({});
      }).toThrow(/data argument must be of type: Array./);
    });

    it('should process a fields query', function() {
      const entities = [
        { name: 'Name1', desc: 'Desc1' },
        { name: 'Name2', desc: 'Desc2' }
      ];
      const query = new Query();
      query.fields = ['desc'];
      expect(query.process(entities)).toEqual([{ desc: 'Desc1' }, { desc: 'Desc2' }]);
    });
  });

  describe('toQueryString()', function() {
    it('should have a query property', function() {
      const query = new Query();
      query.equalTo('name', 'tests');
      const queryString = query.toQueryString();
      expect(queryString).toInclude({ query: '{"name":"tests"}' });
    });

    it('should not have a query property', function () {
      const query = new Query();
      const queryString = query.toQueryString();
      expect(queryString).toExcludeKey('query');
    });

    it('should have a fields property', function () {
      const query = new Query();
      query.fields = ['foo', 'bar'];
      const queryString = query.toQueryString();
      expect(queryString).toInclude({ fields: 'foo,bar' });
    });

    it('should not have a fields property', function () {
      const query = new Query();
      const queryString = query.toQueryString();
      expect(queryString).toExcludeKey('fields');
    });

    it('should have a limit property', function () {
      const query = new Query();
      query.limit = 10;
      const queryString = query.toQueryString();
      expect(queryString).toInclude({ limit: 10 });
    });

    it('should not have a limit property', function () {
      const query = new Query();
      const queryString = query.toQueryString();
      expect(queryString).toExcludeKey('limit');
    });

    it('should have a skip property', function () {
      const query = new Query();
      query.skip = 10;
      const queryString = query.toQueryString();
      expect(queryString).toInclude({ skip: 10 });
    });

    it('should not have a skip property', function () {
      const query = new Query();
      query.skip = 0;
      const queryString = query.toQueryString();
      expect(queryString).toExcludeKey('skip');
    });

    it('should have a sort property', function () {
      const query = new Query();
      query.ascending('foo');
      const queryString = query.toQueryString();
      expect(queryString).toInclude({ sort: '{"foo":1}' });
    });

    it('should not have a sort property', function () {
      const query = new Query();
      const queryString = query.toQueryString();
      expect(queryString).toExcludeKey('sort');
    });
  });
});
