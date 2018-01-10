/* eslint-env mocha */

import { expect } from 'chai';
import { randomString } from './utils';
import { Query } from './query';

describe('Query', () => {
  describe('constructor', () => {
    it('should throw error when fields is not an array', () => {
      expect(() => {
        const query = new Query();
        query.fields = {};
        return query;
      }).to.throw(/fields must be an Array/);
    });

    it('should parse a limit from string', () => {
      const query = new Query();
      query.limit = '3';
      expect(query.limit).to.equal(3);
    });

    it('should parse a skip from string', () => {
      const query = new Query();
      query.skip = '10';
      expect(query.skip).to.equal(10);
    });
  });

  describe('fields', () => {
    it('should throw an error on invalid arguments', () => {
      expect(() => {
        const query = new Query();
        query.fields = {};
      }).to.throw();
    });

    it('should set the fields', () => {
      const fields = [randomString(), randomString()];
      const query = new Query();
      query.fields = fields;
      expect(query.toPlainObject().fields).to.equal(fields);
    });

    it('should reset the fields', () => {
      const query = new Query();
      query.fields = [];
      expect(query.toPlainObject().fields).to.deep.equal([]);
    });
  });

  describe('limit', () => {
    it('should throw an error on invalid arguments', () => {
      expect(() => {
        const query = new Query();
        query.limit = {};
      }).to.throw();
    });

    it('should set the limit', () => {
      const limit = 10;
      const query = new Query();
      query.limit = limit;
      expect(query.toPlainObject().limit).to.equal(limit);
    });

    it('should unset the limit', () => {
      const query = new Query();
      query.limit = null;
      expect(query.toPlainObject().limit).to.equal(null);
    });
  });

  describe('skip', () => {
    it('should throw an error on invalid arguments', () => {
      expect(() => {
        const query = new Query();
        query.skip = {};
      }).to.throw();
    });

    it('should set the skip', () => {
      const skip = 10;
      const query = new Query();
      query.skip = skip;
      expect(query.toPlainObject().skip).to.equal(skip);
    });

    it('should unset the skip', () => {
      const query = new Query();
      query.skip = 0;
      expect(query.toPlainObject().skip).to.equal(0);
    });
  });

  describe('sort', () => {
    it('should set the sort', () => {
      const sort = {};
      sort[randomString()] = 1;
      const query = new Query();
      query.sort = sort;
      expect(query.toPlainObject().sort).to.equal(sort);
    });

    it('should reset the sort.', () => {
      const query = new Query();
      query.sort = {};
      expect(query.toPlainObject().sort).to.deep.equal({});
    });
  });

  describe('isSupportedOffline()', () => {
    it('should be false when trying to filter geo queries', () => {
      const query = new Query();
      query.near('loc', [0, 0]);
      expect(query.isSupportedOffline()).to.equal(false);
    });

    it('should be true', () => {
      const query = new Query();
      query.equalTo('foo', 'bar');
      expect(query.isSupportedOffline()).to.equal(true);
    });

    it('should be true for an empty query', () => {
      const query = new Query();
      expect(query.isSupportedOffline()).to.equal(true);
    });
  });

  describe('equalTo()', () => {
    it('should add an equal to filter', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.equalTo(field, value);
      expect(query.toPlainObject().filter[field]).to.equal(value);
    });

    it('should discard any existing filters on the same field', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.equalTo(field, randomString()); // Should be discarded
      query.equalTo(field, value);
      expect(query.toPlainObject().filter[field]).to.equal(value);
    });

    it('should return the query', () => {
      const query = new Query().equalTo(randomString(), randomString());
      expect(query).to.be.an.instanceOf(Query);
    });
  });

  describe('contains()', () => {
    it('should accept a single value', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.contains(field, value);
      expect(query.toPlainObject().filter[field]).to.deep.equal({ $in: [value] });
    });

    it('should accept an array of values', () => {
      const field = randomString();
      const value = [randomString(), randomString()];
      const query = new Query();
      query.contains(field, value);
      expect(query.toPlainObject().filter[field]).to.deep.equal({ $in: value });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.greaterThan(field, randomString());
      query.contains(field, [randomString()]);
      expect(query.toPlainObject().filter[field]).to.have.property('$gt');
    });

    it('should return the query', () => {
      const query = new Query().contains(randomString(), [randomString()]);
      expect(query).to.be.an.instanceof(Query);
    });
  });

  describe('containsAll()', () => {
    it('should accept a single value and add a contains all filter', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.containsAll(field, value);
      expect(query.toPlainObject().filter[field]).to.deep.equal({ $all: [value] });
    });

    it('should accept an array of values and add a contains all filter', () => {
      const field = randomString();
      const value = [randomString(), randomString()];
      const query = new Query();
      query.containsAll(field, value);
      expect(query.toPlainObject().filter[field]).to.deep.equal({ $all: value });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.greaterThan(field, randomString());
      query.containsAll(field, [randomString()]);
      expect(query.toPlainObject().filter[field]).to.have.property('$gt');
    });

    it('should return the query', () => {
      const query = new Query().containsAll(randomString(), [randomString()]);
      expect(query).to.be.an.instanceof(Query);
    });
  });

  describe('greaterThan()', () => {
    it('should throw an error with invalid arguments', () => {
      expect(() => {
        const query = new Query();
        query.greaterThan(randomString(), null);
      }).to.throw();
    });

    it('should add a greater than filter', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.greaterThan(field, value);
      expect(query.toPlainObject().filter[field]).to.deep.equal({ $gt: value });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.greaterThan(field, randomString());
      query.containsAll(field, [randomString()]);
      expect(query.toPlainObject().filter[field]).to.have.property('$all');
    });

    it('should return the query', () => {
      const query = new Query().greaterThan(randomString(), randomString());
      expect(query).to.be.an.instanceof(Query);
    });
  });

  describe('greaterThanOrEqualTo()', () => {
    it('should throw an error with invalid arguments', () => {
      expect(() => {
        const query = new Query();
        query.greaterThanOrEqualTo(randomString(), null);
      }).to.throw();
    });

    it('should add a greater than or equal filter', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.greaterThanOrEqualTo(field, value);
      expect(query.toPlainObject().filter[field]).to.deep.equal({ $gte: value });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.greaterThanOrEqualTo(field, randomString());
      query.containsAll(field, [randomString()]);
      expect(query.toPlainObject().filter[field]).to.have.property('$all');
    });

    it('should return the query', () => {
      const query = new Query().greaterThanOrEqualTo(randomString(), randomString());
      expect(query).to.be.an.instanceof(Query);
    });
  });

  describe('lessThan()', () => {
    it('should throw an error with invalid arguments', () => {
      expect(() => {
        const query = new Query();
        query.lessThan(randomString(), null);
      }).to.throw();
    });

    it('should add a less than filter', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.lessThan(field, value);
      expect(query.toPlainObject().filter[field]).to.deep.equal({ $lt: value });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.lessThan(field, randomString());
      query.containsAll(field, [randomString()]);
      expect(query.toPlainObject().filter[field]).to.have.property('$all');
    });

    it('should return the query', () => {
      const query = new Query().lessThan(randomString(), randomString());
      expect(query).to.be.an.instanceof(Query);
    });
  });

  describe('lessThanOrEqualTo()', () => {
    it('should throw an error with invalid arguments', () => {
      expect(() => {
        const query = new Query();
        query.lessThanOrEqualTo(randomString(), null);
      }).to.throw();
    });

    it('should add a less than or equal filter', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.lessThanOrEqualTo(field, value);
      expect(query.toPlainObject().filter[field]).to.deep.equal({ $lte: value });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.lessThanOrEqualTo(field, randomString());
      query.containsAll(field, [randomString()]);
      expect(query.toPlainObject().filter[field]).to.have.property('$all');
    });

    it('should return the query', () => {
      const query = new Query().lessThanOrEqualTo(randomString(), randomString());
      expect(query).to.be.an.instanceof(Query);
    });
  });

  describe('notEqualTo()', () => {
    it('should add a not equal to filter', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.notEqualTo(field, value);
      expect(query.toPlainObject().filter[field]).to.deep.equal({ $ne: value });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.notEqualTo(field, randomString());
      query.containsAll(field, [randomString()]);
      expect(query.toPlainObject().filter[field]).to.have.property('$all');
    });

    it('should return the query', () => {
      const query = new Query().notEqualTo(randomString(), randomString());
      expect(query).to.be.an.instanceof(Query);
    });

    it('should filter out fields not equal to null', () => {
      const entity1 = { customProperty: null };
      const entity2 = { customProperty: randomString() };
      const query = new Query().notEqualTo('customProperty', null);
      const result = query.process([entity1, entity2]);
      expect(result.length).to.equal(1);
      expect(result[0]).to.deep.equal(entity2);
    });
  });

  describe('notContainedIn()', () => {
    it('should accept a single value and add a not contained in filter', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.notContainedIn(field, value);
      expect(query.toPlainObject().filter[field]).to.deep.equal({ $nin: [value] });
    });

    it('should accept an array of values and add a not contained in filter', () => {
      const field = randomString();
      const value = [randomString(), randomString()];
      const query = new Query();
      query.notContainedIn(field, value);
      expect(query.toPlainObject().filter[field]).to.deep.equal({ $nin: value });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.notContainedIn(field, randomString());
      query.containsAll(field, [randomString()]);
      expect(query.toPlainObject().filter[field]).to.have.property('$all');
    });

    it('should return the query', () => {
      const query = new Query().notContainedIn(randomString(), randomString());
      expect(query).to.be.an.instanceof(Query);
    });
  });

  describe('and()', () => {
    describe('when called with arguments', () => {
      it('should throw an error with invalid arguments', () => {
        expect(() => {
          const query = new Query();
          query.and(randomString(), null);
        }).to.throw();
      });

      it('should join a query', () => {
        const query = new Query();
        query.and(new Query());
        expect(query.toPlainObject().filter).to.have.property('$and');
        expect(query.toPlainObject().filter.$and.length).to.equal(2);
      });

      it('should join a query object', () => {
        const query = new Query();
        query.and({ filter: {} });
        expect(query.toPlainObject().filter).to.have.property('$and');
        expect(query.toPlainObject().filter.$and.length).to.equal(2);
      });

      it('should join multiple queries at once', () => {
        const query = new Query();
        query.and(new Query(), new Query());
        expect(query.toPlainObject().filter).to.have.property('$and');
        expect(query.toPlainObject().filter.$and.length).to.equal(3);
      });

      it('should return the query', () => {
        const query = new Query().and(new Query());
        expect(query).to.be.an.instanceof(Query);
      });
    });

    describe('when called without arguments', () => {
      it('should return a subquery', () => {
        const query1 = new Query();
        const query2 = query1.and();
        expect(query2).to.be.an.instanceof(Query);
        expect(query2._parent).to.deep.equal(query1);
      });

      it('should update the original query', () => {
        const field = randomString();
        const value = randomString();
        const query = new Query();
        query.and().greaterThan(field, value);
        expect(query.toPlainObject().filter).to.have.property('$and');
        expect(query.toPlainObject().filter.$and[1][field]).to.deep.equal({ $gt: value });
      });
    });
  });

  describe('nor()', () => {
    describe('when called with arguments', () => {
      it('should throw an error with invalid arguments', () => {
        expect(() => {
          const query = new Query();
          query.nor(randomString(), null);
        }).to.throw();
      });

      it('should join a query', () => {
        const query = new Query();
        query.nor(new Query());
        expect(query.toPlainObject().filter).to.have.property('$nor');
        expect(query.toPlainObject().filter.$nor.length).to.equal(2);
      });

      it('should join a query object', () => {
        const query = new Query();
        query.nor({ filter: {} });
        expect(query.toPlainObject().filter).to.have.property('$nor');
        expect(query.toPlainObject().filter.$nor.length).to.equal(2);
      });

      it('should join multiple queries at once', () => {
        const query = new Query();
        query.nor(new Query(), new Query());
        expect(query.toPlainObject().filter).to.have.property('$nor');
        expect(query.toPlainObject().filter.$nor.length).to.equal(3);
      });

      it('should return the query', () => {
        const query = new Query().nor(new Query());
        expect(query).to.be.an.instanceof(Query);
      });
    });

    describe('when called without arguments', () => {
      it('should return a subquery', () => {
        const query1 = new Query();
        const query2 = query1.nor();
        expect(query2).to.be.an.instanceof(Query);
        expect(query2._parent).to.deep.equal(query1);
      });

      it('should update the original query', () => {
        const field = randomString();
        const value = randomString();
        const query = new Query();
        query.nor().greaterThan(field, value);
        expect(query.toPlainObject().filter).to.have.property('$nor');
        expect(query.toPlainObject().filter.$nor[1][field]).to.deep.equal({ $gt: value });
      });
    });
  });

  describe('or()', () => {
    describe('when called with arguments', () => {
      it('should throw an error with invalid arguments', () => {
        expect(() => {
          const query = new Query();
          query.or(randomString(), null);
        }).to.throw();
      });

      it('should join a query', () => {
        const query = new Query();
        query.or(new Query());
        expect(query.toPlainObject().filter).to.have.property('$or');
        expect(query.toPlainObject().filter.$or.length).to.equal(2);
      });

      it('should join a query object', () => {
        const query = new Query();
        query.or({ filter: {} });
        expect(query.toPlainObject().filter).to.have.property('$or');
        expect(query.toPlainObject().filter.$or.length).to.equal(2);
      });

      it('should join multiple queries at once', () => {
        const query = new Query();
        query.or(new Query(), new Query());
        expect(query.toPlainObject().filter).to.have.property('$or');
        expect(query.toPlainObject().filter.$or.length).to.equal(3);
      });

      it('should return the query', () => {
        const query = new Query().or(new Query());
        expect(query).to.be.an.instanceof(Query);
      });
    });

    describe('when called without arguments', () => {
      it('should return a subquery', () => {
        const query1 = new Query();
        const query2 = query1.or();
        expect(query2).to.be.an.instanceof(Query);
        expect(query2._parent).to.deep.equal(query1);
      });

      it('should update the original query', () => {
        const field = randomString();
        const value = randomString();
        const query = new Query();
        query.or().greaterThan(field, value);
        expect(query.toPlainObject().filter).to.have.property('$or');
        expect(query.toPlainObject().filter.$or[1][field]).to.deep.equal({ $gt: value });
      });
    });
  });

  describe('the exists method', () => {
    it('should add an exists filter', () => {
      const field = randomString();
      const query = new Query();
      query.exists(field);
      expect(query.toPlainObject().filter[field]).to.deep.equal({ $exists: true });
    });

    it('should add an exists filter with flag set to false', () => {
      const field = randomString();
      const query = new Query();
      query.exists(field, false);
      expect(query.toPlainObject().filter[field]).to.deep.equal({ $exists: false });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.exists(field);
      query.containsAll(field, [randomString()]);
      expect(query.toPlainObject().filter[field]).to.have.property('$all');
    });

    it('should return the query', () => {
      const query = new Query().exists(randomString());
      expect(query).to.be.an.instanceof(Query);
    });
  });

  describe('mod()', () => {
    it('should throw an error for invalid arguments divisor', () => {
      expect(() => {
        const query = new Query();
        query.mod(randomString(), null);
      }).to.throw();
    });

    it('should throw an error for invalid arguments remainder', () => {
      expect(() => {
        const query = new Query();
        query.mod(randomString(), 5, null);
      }).to.throw();
    });

    it('should add a mod filter', () => {
      const field = randomString();
      const divisor = 5;
      const remainder = 0;
      const query = new Query();
      query.mod(field, divisor, remainder);
      expect(query.toPlainObject().filter[field]).to.deep.equal({ $mod: [divisor, remainder] });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.mod(field, 5);
      query.containsAll(field, [randomString()]);
      expect(query.toPlainObject().filter[field]).to.have.property('$all');
    });

    it('should return the query', () => {
      const query = new Query().mod(randomString(), 5);
      expect(query).to.be.an.instanceof(Query);
    });
  });

  describe('matches()', () => {
    it('throw an error for unsupported ignoreCase option', () => {
      expect(() => {
        const field = randomString();
        const query = new Query();
        return query.matches(field, /^abc/, { ignoreCase: true });
      }).to.throw(/ignoreCase/);
    });

    it('should throw an error for unanchored expression', () => {
      expect(() => {
        const field = randomString();
        const query = new Query();
        return query.matches(field, '/abc/');
      }).to.throw(/anchored/);
    });

    it('should add a match filter by string', () => {
      const field = randomString();
      const value = `^${randomString()}`;
      const query = new Query();
      query.matches(field, value);
      expect(query.toPlainObject().filter).to.have.property(field);
      expect(query.toPlainObject().filter[field]).to.deep.equal({ $regex: value });
    });

    it('should add a match filter by RegExp literal', () => {
      const field = randomString();
      const value = /^foo/;
      const query = new Query();
      query.matches(field, value);
      expect(query.toPlainObject().filter).to.have.property(field);
      expect(query.toPlainObject().filter[field]).to.deep.equal({ $regex: value.source });
    });

    it('should add a match filter by RegExp object.', () => {
      const field = randomString();
      const value = new RegExp('^foo');
      const query = new Query();
      query.matches(field, value);
      expect(query.toPlainObject().filter).to.have.property(field);
      expect(query.toPlainObject().filter[field]).to.deep.equal({ $regex: value.source });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.matches(field, `^${randomString()}`);
      query.greaterThan(field, randomString());
      expect(query.toPlainObject().filter).to.have.property(field);
      expect(query.toPlainObject().filter[field]).to.have.property(['$gt']);
    });

    it('should return the query', () => {
      const field = randomString();
      const query = new Query();
      const value = query.matches(field, /^foo/);
      expect(value).to.deep.equal(query);
    });

    describe('with options', () => {
      it('should throw if the ignoreCase flag is part of the RegExp.', () => {
        expect(() => {
          const field = randomString();
          const query = new Query();
          return query.matches(field, /^foo/i);
        }).to.throw(/ignoreCase/);
      });

      it('should unset the ignoreCase flag if `options.ignoreCase` is `false`', () => {
        const field = randomString();
        const value = /^foo/i;
        const query = new Query();
        query.matches(field, value, { ignoreCase: false });
        expect(query.toPlainObject().filter).to.have.property(field);
        expect(query.toPlainObject().filter[field]).to.not.have.property('$options');
      });

      it('should set the multiline flag if part of the RegExp', () => {
        const field = randomString();
        const value = /^foo/m;
        const query = new Query();
        query.matches(field, value);
        expect(query.toPlainObject().filter).to.have.property(field);
        expect(query.toPlainObject().filter[field]).to.include({ $options: 'm' });
      });

      it('should set the multiline flag if `options.multiline`', () => {
        const field = randomString();
        const value = /^foo/;
        const query = new Query();
        query.matches(field, value, { multiline: true });
        expect(query.toPlainObject().filter).to.have.property(field);
        expect(query.toPlainObject().filter[field]).to.include({ $options: 'm' });
      });

      it('should unset the multiline flag if `options.multiline` is `false`', () => {
        const field = randomString();
        const value = /^foo/m;
        const query = new Query();
        query.matches(field, value, { multiline: false });
        expect(query.toPlainObject().filter).to.have.property(field);
        expect(query.toPlainObject().filter[field]).to.not.have.property('$options');
      });

      it('should set the extended flag if `options.extended`', () => {
        const field = randomString();
        const value = `^${randomString()}`;
        const query = new Query();
        query.matches(field, value, { extended: true });
        expect(query.toPlainObject().filter).to.have.property(field);
        expect(query.toPlainObject().filter[field]).to.include({ $options: 'x' });
      });

      it('should not set the multiline flag if `options.extended` is `false`', () => {
        const field = randomString();
        const value = `^${randomString()}`;
        const query = new Query();
        query.matches(field, value, { extended: false });
        expect(query.toPlainObject().filter).to.have.property(field);
        expect(query.toPlainObject().filter[field]).to.not.have.property('$options');
      });

      it('should set the dotMatchesAll flag if `options.dotMatchesAll`', () => {
        const field = randomString();
        const value = `^${randomString()}`;
        const query = new Query();
        query.matches(field, value, { dotMatchesAll: true });
        expect(query.toPlainObject().filter).to.have.property(field);
        expect(query.toPlainObject().filter[field]).to.include({ $options: 's' });
      });

      it('should not set the dotMatchesAll flag if `options.dotMatchesAll` is `false`', () => {
        const field = randomString();
        const value = `^${randomString()}`;
        const query = new Query();
        query.matches(field, value, { dotMatchesAll: false });
        expect(query.toPlainObject().filter).to.have.property(field);
        expect(query.toPlainObject().filter[field]).to.not.have.property('$options');
      });

      it('should set multiple flags.', () => {
        const field = randomString();
        const value = /^foo/im;
        const query = new Query();
        query.matches(field, value, {
          ignoreCase: false,
          extended: true,
          dotMatchesAll: true
        });
        expect(query.toPlainObject().filter).to.have.property(field);
        expect(query.toPlainObject().filter[field]).to.include({ $options: 'mxs' });
      });
    });
  });

  describe('near()', () => {
    it('should throw an error on invalid arguments', () => {
      expect(() => {
        const query = new Query();
        query.near(randomString(), []);
      }).to.throw();
    });

    it('should add a near filter', () => {
      const field = randomString();
      const coord = [-1, 1];
      const query = new Query();
      query.near(field, coord);
      expect(query.toPlainObject().filter[field]).to.deep.equal({ $nearSphere: coord });
    });

    it('should add a near filter, with $maxDistance', () => {
      const field = randomString();
      const coord = [-1, 1];
      const maxDistance = 10;
      const query = new Query();
      query.near(field, coord, maxDistance);
      expect(query.toPlainObject().filter[field]).to.deep.equal({ $nearSphere: coord, $maxDistance: maxDistance });
    });

    it('should return the query', () => {
      const query = new Query().near(randomString(), [-1, 1]);
      expect(query).to.be.an.instanceof(Query);
    });
  });

  describe('withinBox()', () => {
    it('should throw an error on invalid arguments: bottomLeftCoord', () => {
      expect(() => {
        const query = new Query();
        query.withinBox(randomString(), [], [1, 1]);
      }).to.throw();
    });

    it('should throw an error on invalid arguments: upperRightCoord', () => {
      expect(() => {
        const query = new Query();
        query.withinBox(randomString(), [1, 1], []);
      }).to.throw();
    });

    it('should add a within box filter', () => {
      const field = randomString();
      const box = [[-1, -1], [1, 1]];
      const query = new Query();
      query.withinBox(field, box[0], box[1]);
      expect(query.toPlainObject().filter[field]).to.deep.equal({ $within: { $box: box } });
    });

    it('should return the query', () => {
      const query = new Query().withinBox(randomString(), [-1, -1], [1, 1]);
      expect(query).to.be.an.instanceof(Query);
    });
  });

  describe('withinPolygon()', () => {
    it('should throw an error on invalid arguments: coord', () => {
      expect(() => {
        const query = new Query();
        query.withinPolygon(randomString(), []);
      }).to.throw();
    });

    it('should add a within polygon filter', () => {
      const field = randomString();
      const polygon = [[-1, -1], [-1, 1], [1, 1]];
      const query = new Query();
      query.withinPolygon(field, polygon);
      expect(query.toPlainObject().filter[field]).to.deep.equal({ $within: { $polygon: polygon } });
    });

    it('should return the query', () => {
      const query = new Query().withinPolygon(randomString(), [[-1, -1], [-1, 1], [1, 1]]);
      expect(query).to.be.an.instanceof(Query);
    });
  });

  describe('size()', () => {
    it('should throw an error on invalid arguments', () => {
      expect(() => {
        const query = new Query();
        query.size(randomString(), null);
      }).to.throw();
    });

    it('should add a size filter', () => {
      const field = randomString();
      const value = 10;
      const query = new Query();
      query.size(field, value);
      expect(query.toPlainObject().filter[field]).to.deep.equal({ $size: value });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.size(field, 10);
      query.containsAll(field, [randomString()]);
      expect(query.toPlainObject().filter[field]).to.have.property('$all');
    });

    it('should return the query', () => {
      const query = new Query().size(randomString(), 10);
      expect(query).to.be.an.instanceof(Query);
    });
  });

  describe('ascending()', () => {
    it('should set the field', () => {
      const field = randomString();
      const query = new Query();
      query.ascending(field);
      expect(query.toPlainObject().sort[field]).to.equal(1);
    });

    it('should append a field', () => {
      const field1 = randomString();
      const field2 = randomString();
      const query = new Query();
      query.ascending(field1);
      query.ascending(field2);
      expect(query.toPlainObject().sort[field1]).to.equal(1);
      expect(query.toPlainObject().sort[field2]).to.equal(1);
    });

    it('should append a descending field', () => {
      const field1 = randomString();
      const field2 = randomString();
      const query = new Query();
      query.ascending(field1);
      query.descending(field2);
      expect(query.toPlainObject().sort[field1]).to.equal(1);
      expect(query.toPlainObject().sort[field2]).to.equal(-1);
    });

    it('should sort the data in ascending order', () => {
      const entity1 = { _id: 1, customProperty: randomString() };
      const entity2 = { _id: 2, customProperty: randomString() };
      const query = new Query().ascending('_id');
      query.fields = ['customProperty'];
      const result = query.process([entity2, entity1]);
      expect(result[0].customProperty).to.equal(entity1.customProperty);
      expect(result[1].customProperty).to.equal(entity2.customProperty);
    });
  });

  describe('descending()', () => {
    it('should set the field', () => {
      const field = randomString();
      const query = new Query();
      query.descending(field);
      expect(query.toPlainObject().sort[field]).to.equal(-1);
    });

    it('should append a field', () => {
      const field1 = randomString();
      const field2 = randomString();
      const query = new Query();
      query.descending(field1);
      query.descending(field2);
      expect(query.toPlainObject().sort[field1]).to.equal(-1);
      expect(query.toPlainObject().sort[field2]).to.equal(-1);
    });

    it('should append a ascending field', () => {
      const field1 = randomString();
      const field2 = randomString();
      const query = new Query();
      query.descending(field1);
      query.ascending(field2);
      expect(query.toPlainObject().sort[field1]).to.equal(-1);
      expect(query.toPlainObject().sort[field2]).to.equal(1);
    });

    it('should sort the data in descending order', () => {
      const entity1 = { _id: 1, customProperty: randomString() };
      const entity2 = { _id: 2, customProperty: randomString() };
      const query = new Query().descending('_id');
      query.fields = ['customProperty'];
      const result = query.process([entity1, entity2]);
      expect(result[0].customProperty).to.equal(entity2.customProperty);
      expect(result[1].customProperty).to.equal(entity1.customProperty);
    });
  });

  describe('when chained', () => {
    it('should respect AND-NOR precedence.', () => {
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
      expect(query.toPlainObject().filter.$nor[0].$and.length).to.equal(2);
      expect(query.toPlainObject().filter.$nor[0].$and[0]).to.have.property(a);
      expect(query.toPlainObject().filter.$nor[0].$and[1]).to.have.property(b);
      expect(query.toPlainObject().filter.$nor[1]).to.have.property(c);
    });

    it('should respect AND-NOR-AND precedence.', () => {
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
      expect(query.toPlainObject().filter.$nor[0].$and.length).to.equal(2);
      expect(query.toPlainObject().filter.$nor[0].$and[0]).to.have.property(a);
      expect(query.toPlainObject().filter.$nor[0].$and[1]).to.have.property(b);
      expect(query.toPlainObject().filter.$nor[1].$and.length).to.equal(2);
      expect(query.toPlainObject().filter.$nor[1].$and[0]).to.have.property(c);
      expect(query.toPlainObject().filter.$nor[1].$and[1]).to.have.property(d);
    });

    it('should respect AND-OR precedence.', () => {
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
      expect(query.toPlainObject().filter.$or[0].$and.length).to.equal(2);
      expect(query.toPlainObject().filter.$or[0].$and[0]).to.have.property(a);
      expect(query.toPlainObject().filter.$or[0].$and[1]).to.have.property(b);
      expect(query.toPlainObject().filter.$or[1]).to.have.property(c);
    });

    it('should respect AND-OR-AND precedence.', () => {
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
      expect(query.toPlainObject().filter.$or[0].$and.length).to.equal(2);
      expect(query.toPlainObject().filter.$or[0].$and[0]).to.have.property(a);
      expect(query.toPlainObject().filter.$or[0].$and[1]).to.have.property(b);
      expect(query.toPlainObject().filter.$or[1].$and.length).to.equal(2);
      expect(query.toPlainObject().filter.$or[1].$and[0]).to.have.property(c);
      expect(query.toPlainObject().filter.$or[1].$and[1]).to.have.property(d);
    });

    it('should respect NOR-OR precedence.', () => {
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
      expect(query.toPlainObject().filter.$or[0].$nor.length).to.equal(2);
      expect(query.toPlainObject().filter.$or[0].$nor[0]).to.have.property(a);
      expect(query.toPlainObject().filter.$or[0].$nor[1]).to.have.property(b);
      expect(query.toPlainObject().filter.$or[1]).to.have.property(c);
    });

    it('should respect OR-NOR-AND precedence.', () => {
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
      expect(query.toPlainObject().filter.$or[0]).to.have.property(a);
      expect(query.toPlainObject().filter.$or[1].$nor[0]).to.have.property(b);
      expect(query.toPlainObject().filter.$or[1].$nor[1].$and[0]).to.have.property(c);
      expect(query.toPlainObject().filter.$or[1].$nor[1].$and[1]).to.have.property(d);
    });

    it('should respect (AND-OR)-NOR-AND precedence.', () => {
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
      expect(query.toPlainObject().filter.$nor[0].$or[0].$and[0]).to.have.property(a);
      expect(query.toPlainObject().filter.$nor[0].$or[0].$and[1]).to.have.property(b);
      expect(query.toPlainObject().filter.$nor[0].$or[1]).to.have.property(c);
      expect(query.toPlainObject().filter.$nor[1].$and[0]).to.have.property(d);
      expect(query.toPlainObject().filter.$nor[1].$and[1]).to.have.property(e);
    });

    it('should set the limit on the top-level query.', () => {
      const value = 10;
      const query = new Query();
      query.and().limit = value;
      expect(query.toPlainObject().limit).to.equal(value);
    });

    it('should set the skip on the top-level query.', () => {
      const value = 10;
      const query = new Query();
      query.and().skip = value;
      expect(query.toPlainObject().skip).to.equal(value);
    });

    it('should set the ascending sort on the top-level query.', () => {
      const field = randomString();
      const query = new Query();
      query.and().ascending(field);
      expect(query.toPlainObject().sort[field]).to.equal(1);
    });

    it('should set the descending sort on the top-level query.', () => {
      const field = randomString();
      const query = new Query();
      query.and().descending(field);
      expect(query.toPlainObject().sort[field]).to.equal(-1);
    });

    it('should set the sort on the top-level query.', () => {
      const value = {};
      value[randomString()] = 1;
      const query = new Query();
      query.and().sort = value;
      expect(query.toPlainObject().sort).to.equal(value);
    });
  });

  describe('comparators', () => {
    it('should add a $gt filter', () => {
      const query = new Query();
      query.greaterThan('field', 1);
      const queryString = query.toQueryString();
      expect(queryString).to.include({ query: '{"field":{"$gt":1}}' });
    });

    it('throw an error when $gt comparator is not a string or number', () => {
      expect(() => {
        const query = new Query();
        query.greaterThan('field', {});
        return query.process([]);
      }).to.throw(/You must supply a number or string./);
    });

    it('should add a $gte filter', () => {
      const query = new Query();
      query.greaterThanOrEqualTo('field', 1);
      const queryString = query.toQueryString();
      expect(queryString).to.include({ query: '{"field":{"$gte":1}}' });
    });

    it('throw an error when $gte comparator is not a string or number', () => {
      expect(() => {
        const query = new Query();
        query.greaterThanOrEqualTo('field', {});
        return query.process([]);
      }).to.throw(/You must supply a number or string./);
    });

    it('should add a $lt filter', () => {
      const query = new Query();
      query.lessThan('field', 1);
      const queryString = query.toQueryString();
      expect(queryString).to.include({ query: '{"field":{"$lt":1}}' });
    });

    it('throw an error when $lt comparator is not a string or number', () => {
      expect(() => {
        const query = new Query();
        query.lessThan('field', {});
        return query.process([]);
      }).to.throw(/You must supply a number or string./);
    });

    it('should add a $lte filter', () => {
      const query = new Query();
      query.lessThanOrEqualTo('field', 1);
      const queryString = query.toQueryString();
      expect(queryString).to.include({ query: '{"field":{"$lte":1}}' });
    });

    it('throw an error when $lte comparator is not a string or number', () => {
      expect(() => {
        const query = new Query();
        query.lessThanOrEqualTo('field', {});
        return query.process([]);
      }).to.throw(/You must supply a number or string./);
    });

    it('should add a $ne filter', () => {
      const query = new Query();
      query.notEqualTo('field', 1);
      const queryString = query.toQueryString();
      expect(queryString).to.include({ query: '{"field":{"$ne":1}}' });
    });
  });

  describe('logical operators', () => {
    it('should add a $and filter', () => {
      const query1 = new Query();
      query1.equalTo('field1', 'value1');

      const query2 = new Query();
      query2.equalTo('field2', 'value2');

      const queryString = query1.and(query2).toQueryString();
      expect(queryString).to.include({ query: '{"$and":[{"field1":"value1"},{"field2":"value2"}]}' });
    });

    it('should add a $or filter', () => {
      const query1 = new Query();
      query1.equalTo('field1', 'value1');

      const query2 = new Query();
      query2.equalTo('field2', 'value2');

      const queryString = query1.or(query2).toQueryString();
      expect(queryString).to.include({ query: '{"$or":[{"field1":"value1"},{"field2":"value2"}]}' });
    });

    it('should add a $nor filter', () => {
      const query1 = new Query();
      query1.equalTo('field1', 'value1');

      const query2 = new Query();
      query2.equalTo('field2', 'value2');

      const queryString = query1.nor(query2).toQueryString();
      expect(queryString).to.include({ query: '{"$nor":[{"field1":"value1"},{"field2":"value2"}]}' });
    });
  });

  describe('process()', () => {
    it('throw an error when a query is not supported locally', () => {
      expect(() => {
        const query = new Query();
        query.near('loc', [0, 0]);
        return query.process([]);
      }).to.throw(/This query is not able to run locally./);
    });

    it('throw an error when a data is not an array', () => {
      expect(() => {
        const query = new Query();
        return query.process({});
      }).to.throw(/data argument must be of type: Array./);
    });

    it('should process a fields query', () => {
      const entities = [
        { name: 'Name1', desc: 'Desc1' },
        { name: 'Name2', desc: 'Desc2' }
      ];
      const query = new Query();
      query.fields = ['desc'];
      expect(query.process(entities)).to.deep.equal([{ desc: 'Desc1' }, { desc: 'Desc2' }]);
    });
  });

  describe('toQueryString()', () => {
    it('should have a query property', () => {
      const query = new Query();
      query.equalTo('name', 'tests');
      const queryString = query.toQueryString();
      expect(queryString).to.include({ query: '{"name":"tests"}' });
    });

    it('should not have a query property', () => {
      const query = new Query();
      const queryString = query.toQueryString();
      expect(queryString).to.not.have.property('query');
    });

    it('should have a fields property', () => {
      const query = new Query();
      query.fields = ['foo', 'bar'];
      const queryString = query.toQueryString();
      expect(queryString).to.include({ fields: 'foo,bar' });
    });

    it('should not have a fields property', () => {
      const query = new Query();
      const queryString = query.toQueryString();
      expect(queryString).to.not.have.property('fields');
    });

    it('should have a limit property', () => {
      const query = new Query();
      query.limit = 10;
      const queryString = query.toQueryString();
      expect(queryString).to.include({ limit: '10' });
    });

    it('should not have a limit property', () => {
      const query = new Query();
      const queryString = query.toQueryString();
      expect(queryString).to.not.have.property('limit');
    });

    it('should have a skip property', () => {
      const query = new Query();
      query.skip = 10;
      const queryString = query.toQueryString();
      expect(queryString).to.include({ skip: '10' });
    });

    it('should not have a skip property', () => {
      const query = new Query();
      query.skip = 0;
      const queryString = query.toQueryString();
      expect(queryString).to.not.have.property('skip');
    });

    it('should have a sort property', () => {
      const query = new Query();
      query.ascending('foo');
      const queryString = query.toQueryString();
      expect(queryString).to.include({ sort: '{"foo":1}' });
    });

    it('should not have a sort property', () => {
      const query = new Query();
      const queryString = query.toQueryString();
      expect(queryString).to.not.have.property('sort');
    });
  });
});
