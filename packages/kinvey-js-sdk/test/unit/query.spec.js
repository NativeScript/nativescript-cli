import { expect } from 'chai';
import Query from '../../src/query';

describe('Query', () => {
  describe('equalTo()', () => {
    it('should add an equal to filter', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.equalTo(field, value);
      expect(query.filter[field]).to.equal(value);
    });

    it('should discard any existing filters on the same field', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.equalTo(field, randomString()); // Should be discarded
      query.equalTo(field, value);
      expect(query.filter[field]).to.equal(value);
    });

    it('should return the query', () => {
      const query = new Query().equalTo(randomString(), randomString());
      expect(query).to.be.an.instanceOf(Query);
    });
  });

  describe('notEqualTo()', () => {
    it('should add a not equal to filter', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.notEqualTo(field, value);
      expect(query.filter[field]).to.deep.equal({ $ne: value });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.notEqualTo(field, randomString());
      query.containsAll(field, [randomString()]);
      expect(query.filter[field]).to.have.property('$all');
    });

    it('should return the query', () => {
      const query = new Query().notEqualTo(randomString(), randomString());
      expect(query).to.be.an.instanceof(Query);
    });
  });

  describe('contains()', () => {
    it('should throw an error if values is not an array', () => {
      expect(() => {
        const query = new Query();
        const field = randomString();
        const value = randomString();
        query.contains(field, value);
      }).to.throw(/Please provide a valid values. Values must be an array./);
    });

    it('should accept an array of values', () => {
      const field = randomString();
      const value = [randomString(), randomString()];
      const query = new Query();
      query.contains(field, value);
      expect(query.filter[field]).to.deep.equal({ $in: value });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.greaterThan(field, randomString());
      query.contains(field, [randomString()]);
      expect(query.filter[field]).to.have.property('$gt');
    });

    it('should return the query', () => {
      const query = new Query().contains(randomString(), [randomString()]);
      expect(query).to.be.an.instanceof(Query);
    });
  });

  describe('containsAll()', () => {
    it('should throw an error if values is not an array', () => {
      expect(() => {
        const query = new Query();
        const field = randomString();
        const value = randomString();
        query.containsAll(field, value);
      }).to.throw(/Please provide a valid values. Values must be an array./);
    });

    it('should accept an array of values and add a contains all filter', () => {
      const field = randomString();
      const value = [randomString(), randomString()];
      const query = new Query();
      query.containsAll(field, value);
      expect(query.filter[field]).to.deep.equal({ $all: value });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.greaterThan(field, randomString());
      query.containsAll(field, [randomString()]);
      expect(query.filter[field]).to.have.property('$gt');
    });

    it('should return the query', () => {
      const query = new Query().containsAll(randomString(), [randomString()]);
      expect(query).to.be.an.instanceof(Query);
    });
  });

  describe('notContainedIn()', () => {
    it('should throw an error if values is not an array', () => {
      expect(() => {
        const query = new Query();
        const field = randomString();
        const value = randomString();
        query.notContainedIn(field, value);
      }).to.throw(/Please provide a valid values. Values must be an array./);
    });

    it('should accept an array of values and add a not contained in filter', () => {
      const field = randomString();
      const value = [randomString(), randomString()];
      const query = new Query();
      query.notContainedIn(field, value);
      expect(query.filter[field]).to.deep.equal({ $nin: value });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.notContainedIn(field, [randomString()]);
      query.containsAll(field, [randomString()]);
      expect(query.filter[field]).to.have.property('$all');
    });

    it('should return the query', () => {
      const query = new Query().notContainedIn(randomString(), [randomString()]);
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
      expect(query.filter[field]).to.deep.equal({ $gt: value });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.greaterThan(field, randomString());
      query.containsAll(field, [randomString()]);
      expect(query.filter[field]).to.have.property('$all');
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
      expect(query.filter[field]).to.deep.equal({ $gte: value });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.greaterThanOrEqualTo(field, randomString());
      query.containsAll(field, [randomString()]);
      expect(query.filter[field]).to.have.property('$all');
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
      expect(query.filter[field]).to.deep.equal({ $lt: value });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.lessThan(field, randomString());
      query.containsAll(field, [randomString()]);
      expect(query.filter[field]).to.have.property('$all');
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
      expect(query.filter[field]).to.deep.equal({ $lte: value });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.lessThanOrEqualTo(field, randomString());
      query.containsAll(field, [randomString()]);
      expect(query.filter[field]).to.have.property('$all');
    });

    it('should return the query', () => {
      const query = new Query().lessThanOrEqualTo(randomString(), randomString());
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
        expect(query.filter).to.have.property('$and');
        expect(query.filter.$and.length).to.equal(2);
      });

      it('should join a query object', () => {
        const query = new Query();
        query.and({ filter: {} });
        expect(query.filter).to.have.property('$and');
        expect(query.filter.$and.length).to.equal(2);
      });

      it('should join multiple queries at once', () => {
        const query = new Query();
        query.and(new Query(), new Query());
        expect(query.filter).to.have.property('$and');
        expect(query.filter.$and.length).to.equal(3);
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
        expect(query2['parent']).to.deep.equal(query1);
      });

      it('should update the original query', () => {
        const field = randomString();
        const value = randomString();
        const query = new Query();
        query.and().greaterThan(field, value);
        expect(query.filter).to.have.property('$and');
        expect(query.filter.$and[1][field]).to.deep.equal({ $gt: value });
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
        expect(query.filter).to.have.property('$nor');
        expect(query.filter.$nor.length).to.equal(2);
      });

      it('should join a query object', () => {
        const query = new Query();
        query.nor({ filter: {} });
        expect(query.filter).to.have.property('$nor');
        expect(query.filter.$nor.length).to.equal(2);
      });

      it('should join multiple queries at once', () => {
        const query = new Query();
        query.nor(new Query(), new Query());
        expect(query.filter).to.have.property('$nor');
        expect(query.filter.$nor.length).to.equal(3);
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
        expect(query2['parent']).to.deep.equal(query1);
      });

      it('should update the original query', () => {
        const field = randomString();
        const value = randomString();
        const query = new Query();
        query.nor().greaterThan(field, value);
        expect(query.filter).to.have.property('$nor');
        expect(query.filter.$nor[1][field]).to.deep.equal({ $gt: value });
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
        expect(query.filter).to.have.property('$or');
        expect(query.filter.$or.length).to.equal(2);
      });

      it('should join a query object', () => {
        const query = new Query();
        query.or({ filter: {} });
        expect(query.filter).to.have.property('$or');
        expect(query.filter.$or.length).to.equal(2);
      });

      it('should join multiple queries at once', () => {
        const query = new Query();
        query.or(new Query(), new Query());
        expect(query.filter).to.have.property('$or');
        expect(query.filter.$or.length).to.equal(3);
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
        expect(query2['parent']).to.deep.equal(query1);
      });

      it('should update the original query', () => {
        const field = randomString();
        const value = randomString();
        const query = new Query();
        query.or().greaterThan(field, value);
        expect(query.filter).to.have.property('$or');
        expect(query.filter.$or[1][field]).to.deep.equal({ $gt: value });
      });
    });
  });

  describe('exists()', () => {
    it('should return the query', () => {
      const query = new Query();
      const result = query.exists(randomString());
      expect(result).to.equal(query);
    });

    it('should add an exists filter', () => {
      const field = randomString();
      const query = new Query();
      query.exists(field);
      expect(query.filter).to.have.property(field);
      expect(query.filter[field]).to.deep.equal({ $exists: true });
    });

    it('should add an exists filter with flag set to false', () => {
      const field = randomString();
      const query = new Query();
      query.exists(field, false);
      expect(query.filter).to.have.property(field);
      expect(query.filter[field]).to.deep.equal({ $exists: false });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.exists(field);
      query.containsAll(field, [randomString()]);
      expect(query.filter).to.have.property(field);
      expect(query.filter[field]).to.have.property('$all');
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

    it('should return the query', () => {
      const query = new Query();
      const result = query.mod(randomString(), 5);
      expect(result).to.equal(query);
    });

    it('should add a mod filter', () => {
      const field = randomString();
      const divisor = 5;
      const remainder = 0;
      const query = new Query();
      query.mod(field, divisor, remainder);
      expect(query.filter).to.have.property(field);
      expect(query.filter[field]).to.deep.equal({ $mod: [divisor, remainder] });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.mod(field, 5);
      query.containsAll(field, [randomString()]);
      expect(query.filter).to.have.property(field);
      expect(query.filter[field]).to.have.property('$all');
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
      expect(query.filter).to.have.property(field);
      expect(query.filter[field]).to.deep.equal({ $regex: value });
    });

    it('should add a match filter by RegExp literal', () => {
      const field = randomString();
      const value = /^foo/;
      const query = new Query();
      query.matches(field, value);
      expect(query.filter).to.have.property(field);
      expect(query.filter[field]).to.deep.equal({ $regex: value.source });
    });

    it('should add a match filter by RegExp object.', () => {
      const field = randomString();
      const value = new RegExp('^foo');
      const query = new Query();
      query.matches(field, value);
      expect(query.filter).to.have.property(field);
      expect(query.filter[field]).to.deep.equal({ $regex: value.source });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.matches(field, `^${randomString()}`);
      query.greaterThan(field, randomString());
      expect(query.filter).to.have.property(field);
      expect(query.filter[field]).to.have.property('$gt');
    });

    it('should return the query', () => {
      const field = randomString();
      const query = new Query();
      const value = query.matches(field, /^foo/);
      expect(value).to.equal(query);
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
        expect(query.filter).to.have.property(field);
        expect(query.filter[field]).to.not.have.property('$options');
      });

      it('should set the multiline flag if part of the RegExp', () => {
        const field = randomString();
        const value = /^foo/m;
        const query = new Query();
        query.matches(field, value);
        expect(query.filter).to.have.property(field);
        expect(query.filter[field]).to.include({ $options: 'm' });
      });

      it('should set the multiline flag if `options.multiline`', () => {
        const field = randomString();
        const value = /^foo/;
        const query = new Query();
        query.matches(field, value, { multiline: true });
        expect(query.filter).to.have.property(field);
        expect(query.filter[field]).to.include({ $options: 'm' });
      });

      it('should unset the multiline flag if `options.multiline` is `false`', () => {
        const field = randomString();
        const value = /^foo/m;
        const query = new Query();
        query.matches(field, value, { multiline: false });
        expect(query.filter).to.have.property(field);
        expect(query.filter[field]).to.not.have.property('$options');
      });

      it('should set the extended flag if `options.extended`', () => {
        const field = randomString();
        const value = `^${randomString()}`;
        const query = new Query();
        query.matches(field, value, { extended: true });
        expect(query.filter).to.have.property(field);
        expect(query.filter[field]).to.include({ $options: 'x' });
      });

      it('should not set the multiline flag if `options.extended` is `false`', () => {
        const field = randomString();
        const value = `^${randomString()}`;
        const query = new Query();
        query.matches(field, value, { extended: false });
        expect(query.filter).to.have.property(field);
        expect(query.filter[field]).to.not.have.property('$options');
      });

      it('should set the dotMatchesAll flag if `options.dotMatchesAll`', () => {
        const field = randomString();
        const value = `^${randomString()}`;
        const query = new Query();
        query.matches(field, value, { dotMatchesAll: true });
        expect(query.filter).to.have.property(field);
        expect(query.filter[field]).to.include({ $options: 's' });
      });

      it('should not set the dotMatchesAll flag if `options.dotMatchesAll` is `false`', () => {
        const field = randomString();
        const value = `^${randomString()}`;
        const query = new Query();
        query.matches(field, value, { dotMatchesAll: false });
        expect(query.filter).to.have.property(field);
        expect(query.filter[field]).to.not.have.property('$options');
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
        expect(query.filter).to.have.property(field);
        expect(query.filter[field]).to.include({ $options: 'mxs' });
      });
    });
  });

  describe('near()', () => {
    it('should throw an error for an invalid coord', () => {
      expect(() => {
        const query = new Query();
        query.near(randomString(), []);
      }).to.throw();
    });

    it('should return the query', () => {
      const query = new Query();
      const result = query.near(randomString(), [-1, -1]);
      expect(result).to.equal(query);
    });

    it('should add a $nearSphere filter', () => {
      const field = randomString();
      const coord = [-1, 1];
      const query = new Query();
      query.near(field, coord);
      expect(query.filter).to.have.property(field);
      expect(query.filter[field]).to.deep.equal({ $nearSphere: coord });
    });

    it('should add a $nearSpere and $maxDistance filter', () => {
      const field = randomString();
      const coord = [-1, 1];
      const maxDistance = 10;
      const query = new Query();
      query.near(field, coord, maxDistance);
      expect(query.filter).to.have.property(field);
      expect(query.filter[field]).to.deep.equal({ $nearSphere: coord, $maxDistance: maxDistance });
    });
  });

  describe('withinBox()', () => {
    it('should throw an error for invalid bottomLeftCoord', () => {
      expect(() => {
        const query = new Query();
        query.withinBox(randomString(), [], [1, 1]);
      }).to.throw();
    });

    it('should throw an error for invalid upperRightCoord', () => {
      expect(() => {
        const query = new Query();
        query.withinBox(randomString(), [1, 1], []);
      }).to.throw();
    });

    it('should return the query', () => {
      const query = new Query();
      const result = query.withinBox(randomString(), [-1, -1], [1, 1]);
      expect(result).to.equal(query);
    });

    it('should add a within box filter', () => {
      const field = randomString();
      const box = [[-1, -1], [1, 1]];
      const query = new Query();
      query.withinBox(field, box[0], box[1]);
      expect(query.filter).to.have.property(field);
      expect(query.filter[field]).to.deep.equal({ $within: { $box: box } });
    });
  });

  describe('withinPolygon()', () => {
    it('should throw an error for invalid coord', () => {
      expect(() => {
        const query = new Query();
        query.withinPolygon(randomString(), []);
      }).to.throw();
    });

    it('should return the query', () => {
      const query = new Query();
      const result = query.withinPolygon(randomString(), [[-1, -1], [-1, 1], [1, 1]]);
      expect(result).to.equal(query);
    });

    it('should add a within polygon filter', () => {
      const field = randomString();
      const polygon = [[-1, -1], [-1, 1], [1, 1]];
      const query = new Query();
      query.withinPolygon(field, polygon);
      expect(query.filter).to.have.property(field);
      expect(query.filter[field]).to.deep.equal({ $within: { $polygon: polygon } });
    });
  });

  describe('size()', () => {
    it('should throw an error on invalid arguments', () => {
      expect(() => {
        const query = new Query();
        query.size(randomString(), null);
      }).to.throw(/The size must be a number./);
    });

    it('should return the query', () => {
      const query = new Query();
      const result = query.size(randomString(), randomNumber());
      expect(result).to.equal(query);
    });

    it('should add a size filter', () => {
      const field = randomString();
      const value = randomNumber();
      const query = new Query();
      query.size(field, value);
      expect(query.filter).to.have.property(field);
      expect(query.filter[field]).to.deep.equal({ $size: value });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const value = randomNumber();
      const query = new Query();
      query.size(field, value);
      query.containsAll(field, [value]);
      expect(query.filter).to.have.property(field);
      expect(query.filter[field]).to.deep.equal({ $all: [value], $size: value });
    });
  });

  describe('ascending()', () => {
    it('should return the query', () => {
      const query = new Query();
      const result = query.ascending(randomString());
      expect(result).to.equal(query);
    });

    it('should set the field', () => {
      const field = randomString();
      const query = new Query();
      query.ascending(field);
      expect(query.sort[field]).to.equal(1);
    });

    it('should append a field', () => {
      const field1 = randomString();
      const field2 = randomString();
      const query = new Query();
      query.ascending(field1);
      query.ascending(field2);
      expect(query.sort[field1]).to.equal(1);
      expect(query.sort[field2]).to.equal(1);
    });

    it('should append a descending field', () => {
      const field1 = randomString();
      const field2 = randomString();
      const query = new Query();
      query.ascending(field1);
      query.descending(field2);
      expect(query.sort[field1]).to.equal(1);
      expect(query.sort[field2]).to.equal(-1);
    });
  });

  describe('descending()', () => {
    it('should return the query', () => {
      const query = new Query();
      const result = query.descending(randomString());
      expect(result).to.equal(query);
    });

    it('should set the field', () => {
      const field = randomString();
      const query = new Query();
      query.descending(field);
      expect(query.sort[field]).to.equal(-1);
    });

    it('should append a field', () => {
      const field1 = randomString();
      const field2 = randomString();
      const query = new Query();
      query.descending(field1);
      query.descending(field2);
      expect(query.sort[field1]).to.equal(-1);
      expect(query.sort[field2]).to.equal(-1);
    });

    it('should append a ascending field', () => {
      const field1 = randomString();
      const field2 = randomString();
      const query = new Query();
      query.descending(field1);
      query.ascending(field2);
      expect(query.sort[field1]).to.equal(-1);
      expect(query.sort[field2]).to.equal(1);
    });
  });

  describe('when chained', () => {
    it('should respect AND-NOR precedence', () => {
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

      expect(query.filter.$nor[0].$and.length).to.equal(2);
      expect(query.filter.$nor[0].$and[0]).to.have.property(a);
      expect(query.filter.$nor[0].$and[1]).to.have.property(b);
      expect(query.filter.$nor[1]).to.have.property(c);
    });

    it('should respect AND-NOR-AND precedence', () => {
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
      expect(query.filter.$nor[0].$and.length).to.equal(2);
      expect(query.filter.$nor[0].$and[0]).to.have.property(a);
      expect(query.filter.$nor[0].$and[1]).to.have.property(b);
      expect(query.filter.$nor[1].$and.length).to.equal(2);
      expect(query.filter.$nor[1].$and[0]).to.have.property(c);
      expect(query.filter.$nor[1].$and[1]).to.have.property(d);
    });

    it('should respect AND-OR precedence', () => {
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
      expect(query.filter.$or[0].$and.length).to.equal(2);
      expect(query.filter.$or[0].$and[0]).to.have.property(a);
      expect(query.filter.$or[0].$and[1]).to.have.property(b);
      expect(query.filter.$or[1]).to.have.property(c);
    });

    it('should respect AND-OR-AND precedence', () => {
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
      expect(query.filter.$or[0].$and.length).to.equal(2);
      expect(query.filter.$or[0].$and[0]).to.have.property(a);
      expect(query.filter.$or[0].$and[1]).to.have.property(b);
      expect(query.filter.$or[1].$and.length).to.equal(2);
      expect(query.filter.$or[1].$and[0]).to.have.property(c);
      expect(query.filter.$or[1].$and[1]).to.have.property(d);
    });

    it('should respect NOR-OR precedence', () => {
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
      expect(query.filter.$or[0].$nor.length).to.equal(2);
      expect(query.filter.$or[0].$nor[0]).to.have.property(a);
      expect(query.filter.$or[0].$nor[1]).to.have.property(b);
      expect(query.filter.$or[1]).to.have.property(c);
    });

    it('should respect OR-NOR-AND precedence', () => {
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
      expect(query.filter.$or[0]).to.have.property(a);
      expect(query.filter.$or[1].$nor[0]).to.have.property(b);
      expect(query.filter.$or[1].$nor[1].$and[0]).to.have.property(c);
      expect(query.filter.$or[1].$nor[1].$and[1]).to.have.property(d);
    });

    it('should respect (AND-OR)-NOR-AND precedence', () => {
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
      expect(query.filter.$nor[0].$or[0].$and[0]).to.have.property(a);
      expect(query.filter.$nor[0].$or[0].$and[1]).to.have.property(b);
      expect(query.filter.$nor[0].$or[1]).to.have.property(c);
      expect(query.filter.$nor[1].$and[0]).to.have.property(d);
      expect(query.filter.$nor[1].$and[1]).to.have.property(e);
    });

    it('should set the limit on the top-level query', () => {
      const value = 10;
      const query = new Query();
      query.and().limit = value;
      expect(query.limit).to.equal(value);
    });

    it('should set the skip on the top-level query', () => {
      const value = 10;
      const query = new Query();
      query.and().skip = value;
      expect(query.skip).to.equal(value);
    });

    it('should set the ascending sort on the top-level query', () => {
      const field = randomString();
      const query = new Query();
      query.and().ascending(field);
      expect(query.sort[field]).to.equal(1);
    });

    it('should set the descending sort on the top-level query', () => {
      const field = randomString();
      const query = new Query();
      query.and().descending(field);
      expect(query.sort[field]).to.equal(-1);
    });

    it('should set the sort on the top-level query', () => {
      const value = {};
      value[randomString()] = 1;
      const query = new Query();
      query.and().sort = value;
      expect(query.sort).to.equal(value);
    });
  });

  describe('comparators', () => {
    it('throw an error when $gt comparator is not a string or number', () => {
      expect(() => {
        const field = randomString();
        const query = new Query();
        query.greaterThan(field, {});
      }).to.throw(/The value must be a number or string./);
    });

    it('should add a $gt filter', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.greaterThan(field, value);
      const queryString = query.toQueryString();
      expect(query.filter).to.have.property(field);
      expect(query.filter[field]).to.deep.equal({ $gt: value });
    });

    it('throw an error when $gte comparator is not a string or number', () => {
      expect(() => {
        const field = randomString();
        const query = new Query();
        query.greaterThanOrEqualTo(field, {});
      }).to.throw(/The value must be a number or string./);
    });

    it('should add a $gte filter', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.greaterThanOrEqualTo(field, value);
      const queryString = query.toQueryString();
      expect(query.filter).to.have.property(field);
      expect(query.filter[field]).to.deep.equal({ $gte: value });
    });

    it('throw an error when $lt comparator is not a string or number', () => {
      expect(() => {
        const field = randomString();
        const query = new Query();
        query.lessThan(field, {});
      }).to.throw(/The value must be a number or string./);
    });

    it('should add a $lt filter', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.lessThan(field, value);
      const queryString = query.toQueryString();
      expect(query.filter).to.have.property(field);
      expect(query.filter[field]).to.deep.equal({ $lt: value });
    });

    it('throw an error when $lte comparator is not a string or number', () => {
      expect(() => {
        const field = randomString();
        const query = new Query();
        query.lessThanOrEqualTo(field, {});
      }).to.throw(/The value must be a number or string./);
    });

    it('should add a $lte filter', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.lessThanOrEqualTo(field, value);
      const queryString = query.toQueryString();
      expect(query.filter).to.have.property(field);
      expect(query.filter[field]).to.deep.equal({ $lte: value });
    });

    it('should add a $ne filter', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.notEqualTo(field, value);
      expect(query.filter).to.have.property(field);
      expect(query.filter[field]).to.deep.equal({ $ne: value });
    });
  });

  describe('logical operators', () => {
    it('should add an $and filter', () => {
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
