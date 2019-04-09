import { expect } from 'chai';
import sinon from 'sinon';
import * as Kinvey from '__SDK__';
import * as utilities from '../utils';
import { collectionName } from '../config';
import * as constants from '../constants'

const dataStoreTypes = [Kinvey.DataStoreType.Network, Kinvey.DataStoreType.Sync];
var createdUserIds = []

before(() => {
  return Kinvey.init({
    appKey: process.env.APP_KEY,
    appSecret: process.env.APP_SECRET,
    masterSecret: process.env.MASTER_SECRET
  });
});


describe('Aggregation', () => {
  const entity1 = utilities.getEntity(utilities.randomString(), 'Europe', 1);
  const entity2 = utilities.getEntity(utilities.randomString(), 'Asia', 3);
  const entity3 = utilities.getEntity(utilities.randomString(), 'Asia', 2);
  const entity4 = utilities.getEntity(utilities.randomString(), 'America', 3);
  const entity5 = utilities.getEntity(utilities.randomString(), 'Europe', 1);
  const entity6 = utilities.getEntity(utilities.randomString(), 'Europe', 2);

  before((done) => {
    utilities.cleanUpAppData(collectionName, createdUserIds)
      .then(() => Kinvey.User.signup())
      .then((user) => {
        createdUserIds.push(user.data._id);
        done();
      })
      .catch(done);
  });

  after((done) => {
    utilities.cleanUpAppData(collectionName, createdUserIds)
      .then(() => done())
      .catch(done);
  });

  const pickAggregationResult = (initialArray, value, field = constants.TextFieldName) => {
    let result = initialArray.filter((initialValue) => initialValue[field] === value);
    return result;
  }

  describe('Aggregation with cachestore', () => {
    const cacheStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Cache);
    const networkStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Network);
    const syncStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Sync);
    const entity7 = utilities.getEntity(utilities.randomString(), 'Australia', 4);
    const entity8 = utilities.getEntity(utilities.randomString(), 'America', 0);
    let entitiesToDelete = [entity7._id, entity8._id];

    before((done) => {
      utilities.cleanUpCollectionData(collectionName)
        .then(() => cacheStore.save(entity1))
        .then(() => cacheStore.save(entity2))
        .then(() => cacheStore.save(entity3))
        .then(() => cacheStore.save(entity4))
        .then(() => cacheStore.save(entity5))
        .then(() => cacheStore.save(entity6))
        .then(() => networkStore.save(entity7))
        .then(() => networkStore.save(entity8))
        .then(() => done())
        .catch(done);
    });

    const clearEntities = (entities) => {
      if (entities && entities.length > 0) {
        const query = new Kinvey.Query();
        query.contains('_id', entities);
        return networkStore.remove(query);
      }
      return Promise.resolve();
    };

    after((done) => {
      syncStore.find().toPromise()
        .then(() => clearEntities(entitiesToDelete))
        .then(() => done())
        .catch(done);
    });

    describe('Count', () => {
      it('should return correct result for aggregation on single field', (done) => {
        const aggregation = Kinvey.Aggregation.count(constants.TextFieldName);
        const stream = cacheStore.group(aggregation);
        const spy = sinon.spy();
        stream.subscribe(spy, done, () => {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            expect(countResultCache.length).to.equal(3);
            expect(pickAggregationResult(countResultCache, 'Europe')[0].count).to.equal(3);
            expect(pickAggregationResult(countResultCache, 'Asia')[0].count).to.equal(2);
            expect(pickAggregationResult(countResultCache, 'America')[0].count).to.equal(1);
            expect(countResultBackend.length).to.equal(4);
            expect(pickAggregationResult(countResultBackend, 'Europe')[0].count).to.equal(3);
            expect(pickAggregationResult(countResultBackend, 'Asia')[0].count).to.equal(2);
            expect(pickAggregationResult(countResultBackend, 'America')[0].count).to.equal(2);
            expect(pickAggregationResult(countResultBackend, 'Australia')[0].count).to.equal(1);
            done();
          } catch (err) {
            done(err);
          }
        });
      });

      it('should return correct result for aggregation on multiple fields', (done) => {
        const aggregation = Kinvey.Aggregation.count(constants.TextFieldName);
        const stream = cacheStore.group(aggregation);
        aggregation.by(constants.NumberFieldName);
        const spy = sinon.spy();
        stream.subscribe(spy, done, () => {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            expect(countResultCache.length).to.equal(5);
            expect(pickAggregationResult(pickAggregationResult(countResultCache, 'Europe'), 1, constants.NumberFieldName)[0].count).to.equal(2);
            expect(pickAggregationResult(pickAggregationResult(countResultCache, 'Europe'), 2, constants.NumberFieldName)[0].count).to.equal(1);
            expect(pickAggregationResult(pickAggregationResult(countResultCache, 'Asia'), 3, constants.NumberFieldName)[0].count).to.equal(1);
            expect(pickAggregationResult(pickAggregationResult(countResultCache, 'Asia'), 2, constants.NumberFieldName)[0].count).to.equal(1);
            expect(pickAggregationResult(pickAggregationResult(countResultCache, 'America'), 3, constants.NumberFieldName)[0].count).to.equal(1);
            expect(countResultBackend.length).to.equal(7);
            expect(pickAggregationResult(pickAggregationResult(countResultBackend, 'Europe'), 1, constants.NumberFieldName)[0].count).to.equal(2);
            expect(pickAggregationResult(pickAggregationResult(countResultBackend, 'Europe'), 2, constants.NumberFieldName)[0].count).to.equal(1);
            expect(pickAggregationResult(pickAggregationResult(countResultBackend, 'Asia'), 3, constants.NumberFieldName)[0].count).to.equal(1);
            expect(pickAggregationResult(pickAggregationResult(countResultBackend, 'Asia'), 2, constants.NumberFieldName)[0].count).to.equal(1);
            expect(pickAggregationResult(pickAggregationResult(countResultBackend, 'America'), 3, constants.NumberFieldName)[0].count).to.equal(1);
            expect(pickAggregationResult(pickAggregationResult(countResultBackend, 'America'), 0, constants.NumberFieldName)[0].count).to.equal(1);
            expect(pickAggregationResult(pickAggregationResult(countResultBackend, 'Australia'), 4, constants.NumberFieldName)[0].count).to.equal(1);
            done();
          } catch (err) {
            done(err);
          }
        })
      });

      it('should return correct result for aggregation on multiple fields with query', (done) => {
        const aggregation = Kinvey.Aggregation.count(constants.TextFieldName);
        aggregation.query = new Kinvey.Query();
        aggregation.query.contains(constants.TextFieldName, ['Europe', 'Australia']);
        const stream = cacheStore.group(aggregation);
        aggregation.by(constants.NumberFieldName);
        const spy = sinon.spy();
        stream.subscribe(spy, done, () => {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            expect(countResultCache.length).to.equal(2);
            expect(pickAggregationResult(pickAggregationResult(countResultCache, 'Europe'), 1, constants.NumberFieldName)[0].count).to.equal(2);
            expect(pickAggregationResult(pickAggregationResult(countResultCache, 'Europe'), 2, constants.NumberFieldName)[0].count).to.equal(1);
            expect(countResultBackend.length).to.equal(3);
            expect(pickAggregationResult(pickAggregationResult(countResultBackend, 'Europe'), 1, constants.NumberFieldName)[0].count).to.equal(2);
            expect(pickAggregationResult(pickAggregationResult(countResultBackend, 'Europe'), 2, constants.NumberFieldName)[0].count).to.equal(1);
            expect(pickAggregationResult(pickAggregationResult(countResultBackend, 'Australia'), 4, constants.NumberFieldName)[0].count).to.equal(1);
            done();
          } catch (err) {
            done(err);
          }
        })
      });

      it.skip('should throw error for argument of type array', (done) => { // Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2898
        expect(Kinvey.Aggregation.count(['field'])).to.throw(/The field argument must be a string/);
        done();
      });

      it.skip('should throw error for no argument supplied', (done) => {//Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2899
        expect(Kinvey.Aggregation.count()).to.throw(/You must supply a field/);
        done();
      });
    });

    describe('Min', () => {
      it('should return correct result for aggregation on single field', (done) => {
        const aggregation = Kinvey.Aggregation.min(constants.NumberFieldName);
        const stream = cacheStore.group(aggregation);
        const spy = sinon.spy();
        stream.subscribe(spy, done, () => {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            expect(countResultCache).to.deep.equal({ min: 1 });
            expect(countResultBackend).to.deep.equal([{ min: 0 }]);
            done();
          } catch (err) {
            done(err);
          }
        })
      });

      it('should return correct result for aggregation on multiple fields', (done) => {
        const aggregation = Kinvey.Aggregation.min(constants.NumberFieldName);
        const stream = cacheStore.group(aggregation);
        aggregation.by(constants.TextFieldName);
        const spy = sinon.spy();
        stream.subscribe(spy, done, () => {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            expect(countResultCache.length).to.equal(3);
            expect(pickAggregationResult(countResultCache, 'Europe')[0].min).to.equal(1);
            expect(pickAggregationResult(countResultCache, 'Asia')[0].min).to.equal(2);
            expect(pickAggregationResult(countResultCache, 'America')[0].min).to.equal(3);
            expect(countResultBackend.length).to.equal(4);
            expect(pickAggregationResult(countResultBackend, 'Europe')[0].min).to.equal(1);
            expect(pickAggregationResult(countResultBackend, 'Asia')[0].min).to.equal(2);
            expect(pickAggregationResult(countResultBackend, 'America')[0].min).to.equal(0);
            expect(pickAggregationResult(countResultBackend, 'Australia')[0].min).to.equal(4);
            done();
          } catch (err) {
            done(err);
          }
        })
      });

      it('should return correct result for aggregation on multiple fields with query', (done) => {
        const aggregation = Kinvey.Aggregation.min(constants.NumberFieldName);
        const stream = cacheStore.group(aggregation);
        aggregation.query = new Kinvey.Query();
        aggregation.query.contains(constants.TextFieldName, ['Europe', 'Australia']);
        aggregation.by(constants.TextFieldName);
        const spy = sinon.spy();
        stream.subscribe(spy, done, () => {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            expect(countResultCache.length).to.equal(1);
            expect(pickAggregationResult(countResultCache, 'Europe')[0].min).to.equal(1);
            expect(countResultBackend.length).to.equal(2);
            expect(pickAggregationResult(countResultBackend, 'Europe')[0].min).to.equal(1);
            expect(pickAggregationResult(countResultBackend, 'Australia')[0].min).to.equal(4);
            done();
          } catch (err) {
            done(err);
          }
        })
      });

      it.skip('should throw error for argument of type array', (done) => { // Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2898
        expect(Kinvey.Aggregation.min(['field'])).to.throw(/The field argument must be a string/);
        done();
      });

      it.skip('should throw error for no argument supplied', (done) => {//Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2899
        expect(Kinvey.Aggregation.min()).to.throw(/You must supply a field/);
        done();
      });
    });

    describe('Max', () => {
      it('should return correct result for aggregation on single field', (done) => {
        const aggregation = Kinvey.Aggregation.max(constants.NumberFieldName);
        const stream = cacheStore.group(aggregation);
        const spy = sinon.spy();
        stream.subscribe(spy, done, () => {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            expect(countResultCache).to.deep.equal({ max: 3 });
            expect(countResultBackend).to.deep.equal([{ max: 4 }]);
            done();
          } catch (err) {
            done(err);
          }
        })
      });

      it('should return correct result for aggregation on multiple fields', (done) => {
        const aggregation = Kinvey.Aggregation.max(constants.NumberFieldName);
        const stream = cacheStore.group(aggregation);
        aggregation.by(constants.TextFieldName);
        const spy = sinon.spy();
        stream.subscribe(spy, done, () => {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            expect(countResultCache.length).to.equal(3);
            expect(pickAggregationResult(countResultCache, 'Europe')[0].max).to.equal(2);
            expect(pickAggregationResult(countResultCache, 'Asia')[0].max).to.equal(3);
            expect(pickAggregationResult(countResultCache, 'America')[0].max).to.equal(3);
            expect(countResultBackend.length).to.equal(4);
            expect(pickAggregationResult(countResultBackend, 'Europe')[0].max).to.equal(2);
            expect(pickAggregationResult(countResultBackend, 'Asia')[0].max).to.equal(3);
            expect(pickAggregationResult(countResultBackend, 'America')[0].max).to.equal(3);
            expect(pickAggregationResult(countResultBackend, 'Australia')[0].max).to.equal(4);
            done();
          } catch (err) {
            done(err);
          }
        })
      });

      it('should return correct result for aggregation on multiple fields with query', (done) => {
        const aggregation = Kinvey.Aggregation.max(constants.NumberFieldName);
        const stream = cacheStore.group(aggregation);
        aggregation.by(constants.TextFieldName);
        aggregation.query = new Kinvey.Query();
        aggregation.query.contains(constants.TextFieldName, ['Europe', 'Australia']);
        const spy = sinon.spy();
        stream.subscribe(spy, done, () => {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            expect(countResultCache.length).to.equal(1);
            expect(pickAggregationResult(countResultCache, 'Europe')[0].max).to.equal(2);
            expect(countResultBackend.length).to.equal(2);
            expect(pickAggregationResult(countResultBackend, 'Europe')[0].max).to.equal(2);
            expect(pickAggregationResult(countResultBackend, 'Australia')[0].max).to.equal(4);
            done();
          } catch (err) {
            done(err);
          }
        })
      });

      it.skip('should throw error for argument of type array', (done) => { // Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2898
        expect(Kinvey.Aggregation.max(['field'])).to.throw(/The field argument must be a string/);
        done();
      });

      it.skip('should throw error for no argument supplied', (done) => {//Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2899
        expect(Kinvey.Aggregation.max()).to.throw(/You must supply a field/);
        done();
      });
    });

    describe('Sum', () => {
      it('should return correct result for aggregation on single field', (done) => {
        const aggregation = Kinvey.Aggregation.sum(constants.NumberFieldName);
        const stream = cacheStore.group(aggregation);
        const spy = sinon.spy();
        stream.subscribe(spy, done, () => {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            expect(countResultCache).to.deep.equal({ sum: 12 });
            expect(countResultBackend).to.deep.equal([{ sum: 16 }]);
            done();
          } catch (err) {
            done(err);
          }
        })
      });

      it('should return correct result for aggregation on multiple fields', (done) => {
        const aggregation = Kinvey.Aggregation.sum(constants.NumberFieldName);
        const stream = cacheStore.group(aggregation);
        aggregation.by(constants.TextFieldName);
        const spy = sinon.spy();
        stream.subscribe(spy, done, () => {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            expect(countResultCache.length).to.equal(3);
            expect(pickAggregationResult(countResultCache, 'Europe')[0].sum).to.equal(4);
            expect(pickAggregationResult(countResultCache, 'Asia')[0].sum).to.equal(5);
            expect(pickAggregationResult(countResultCache, 'America')[0].sum).to.equal(3);
            expect(countResultBackend.length).to.equal(4);
            expect(pickAggregationResult(countResultBackend, 'Europe')[0].sum).to.equal(4);
            expect(pickAggregationResult(countResultBackend, 'Asia')[0].sum).to.equal(5);
            expect(pickAggregationResult(countResultBackend, 'America')[0].sum).to.equal(3);
            expect(pickAggregationResult(countResultBackend, 'Australia')[0].sum).to.equal(4);
            done();
          } catch (err) {
            done(err);
          }
        })
      });

      it('should return correct result for aggregation on multiple fields with query', (done) => {
        const aggregation = Kinvey.Aggregation.sum(constants.NumberFieldName);
        const stream = cacheStore.group(aggregation);
        aggregation.by(constants.TextFieldName);
        aggregation.query = new Kinvey.Query();
        aggregation.query.contains(constants.TextFieldName, ['Europe', 'Australia'])
        const spy = sinon.spy();
        stream.subscribe(spy, done, () => {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            expect(countResultCache.length).to.equal(1);
            expect(pickAggregationResult(countResultCache, 'Europe')[0].sum).to.equal(4);
            expect(countResultBackend.length).to.equal(2);
            expect(pickAggregationResult(countResultBackend, 'Europe')[0].sum).to.equal(4);
            expect(pickAggregationResult(countResultBackend, 'Australia')[0].sum).to.equal(4);
            done();
          } catch (err) {
            done(err);
          }
        })
      });

      it.skip('should throw error for argument of type array', (done) => { // Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2898
        expect(Kinvey.Aggregation.sum(['field'])).to.throw(/The field argument must be a string/);
        done();
      });

      it.skip('should throw error for no argument supplied', (done) => {//Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2899
        expect(Kinvey.Aggregation.sum()).to.throw(/You must supply a field/);
        done();
      });
    });

    describe('Average', () => {
      it('should return correct result for aggregation on single field', (done) => {
        const aggregation = Kinvey.Aggregation.average(constants.NumberFieldName);
        const stream = cacheStore.group(aggregation);
        const spy = sinon.spy();
        stream.subscribe(spy, done, () => {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            expect(countResultCache).to.deep.equal({ count: 6, average: 2 });
            expect(countResultBackend).to.deep.equal([{ count: 8, average: 2 }]);
            done();
          } catch (err) {
            done(err);
          }
        })
      });

      it('should return correct result for aggregation on multiple fields', (done) => {
        const aggregation = Kinvey.Aggregation.average(constants.NumberFieldName);
        const stream = cacheStore.group(aggregation);
        aggregation.by(constants.TextFieldName);
        const spy = sinon.spy();
        stream.subscribe(spy, done, () => {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            expect(countResultCache.length).to.equal(3);
            expect(pickAggregationResult(countResultCache, 'Europe')[0].average).to.equal(1.3333333333333333);
            expect(pickAggregationResult(countResultCache, 'Asia')[0].average).to.equal(2.5);
            expect(pickAggregationResult(countResultCache, 'America')[0].average).to.equal(3);
            expect(countResultBackend.length).to.equal(4);
            expect(pickAggregationResult(countResultBackend, 'Europe')[0].average).to.equal(1.3333333333333333);
            expect(pickAggregationResult(countResultBackend, 'Asia')[0].average).to.equal(2.5);
            expect(pickAggregationResult(countResultBackend, 'America')[0].average).to.equal(1.5);
            expect(pickAggregationResult(countResultBackend, 'Australia')[0].average).to.equal(4);
            done();
          } catch (err) {
            done(err);
          }
        })
      });

      it('should return correct result for aggregation on multiple fields with query', (done) => {
        const aggregation = Kinvey.Aggregation.average(constants.NumberFieldName);
        const stream = cacheStore.group(aggregation);
        aggregation.by(constants.TextFieldName);
        aggregation.query = new Kinvey.Query();
        aggregation.query.contains(constants.TextFieldName, ['Europe', 'Australia']);
        const spy = sinon.spy();
        stream.subscribe(spy, done, () => {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            expect(countResultCache.length).to.equal(1);
            expect(pickAggregationResult(countResultCache, 'Europe')[0].average).to.equal(1.3333333333333333);
            expect(countResultBackend.length).to.equal(2);
            expect(pickAggregationResult(countResultBackend, 'Europe')[0].average).to.equal(1.3333333333333333);
            expect(pickAggregationResult(countResultBackend, 'Australia')[0].average).to.equal(4);
            done();
          } catch (err) {
            done(err);
          }
        })
      });

      it.skip('should throw error for argument of type array', (done) => { // Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2898
        expect(Kinvey.Aggregation.average(['field'])).to.throw(/The field argument must be a string/);
        done();
      });

      it.skip('should throw error for no argument supplied', (done) => {//Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2899
        expect(Kinvey.Aggregation.average()).to.throw(/You must supply a field/);
        done();
      });
    });
  });

  dataStoreTypes.forEach((dataStoreType) => {
    describe(`Aggregation with ${dataStoreType}`, () => {
      const activeStore = Kinvey.DataStore.collection(collectionName, dataStoreType);
      before((done) => {
        utilities.cleanUpCollectionData(collectionName)
          .then(() => activeStore.save(entity1))
          .then(() => activeStore.save(entity2))
          .then(() => activeStore.save(entity3))
          .then(() => activeStore.save(entity4))
          .then(() => activeStore.save(entity5))
          .then(() => activeStore.save(entity6))
          .then(() => done())
          .catch(done);
      });

      describe('Min()', () => {
        it('should return correct result for aggregation on single field', (done) => {
          const aggregation = Kinvey.Aggregation.min(constants.NumberFieldName);
          const stream = activeStore.group(aggregation);
          stream.subscribe((minResult) => {
            try {
              var expectedResult = minResult;
              if (dataStoreType === Kinvey.DataStoreType.Network) {
                expectedResult = minResult[0];
                expect(minResult.length).to.equal(1);
              }
              expect(expectedResult).to.deep.equal({ min: 1 });
              done();
            } catch (err) {
              done(err);
            }
          });
        });

        it('should return correct result when grouped by multiple field', (done) => {
          const aggregation = Kinvey.Aggregation.min(constants.NumberFieldName);
          aggregation.by(constants.TextFieldName);
          const stream = activeStore.group(aggregation);
          stream.subscribe((minResult) => {
            try {
              expect(minResult.length).to.equal(3);
              expect(pickAggregationResult(minResult, 'Europe')[0].min).to.equal(1);
              expect(pickAggregationResult(minResult, 'Asia')[0].min).to.equal(2);
              expect(pickAggregationResult(minResult, 'America')[0].min).to.equal(3);
              done();
            } catch (err) {
              done(err);
            }
          });
        });

        it('should return correct result when grouped by multiple field with query', (done) => {
          const aggregation = Kinvey.Aggregation.min(constants.NumberFieldName);
          aggregation.by(constants.TextFieldName);
          aggregation.query = new Kinvey.Query();
          aggregation.query.contains(constants.TextFieldName, ['Europe', 'Asia'])
          const stream = activeStore.group(aggregation);
          stream.subscribe((minResult) => {
            try {
              expect(minResult.length).to.equal(2);
              expect(pickAggregationResult(minResult, 'Europe')[0].min).to.equal(1);
              expect(pickAggregationResult(minResult, 'Asia')[0].min).to.equal(2);
              done();
            } catch (err) {
              done(err);
            }
          });
        });

        it.skip('should throw error for argument of type array', (done) => { // Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2898
          expect(Kinvey.Aggregation.min(['field'])).to.throw(/The field argument must be a string/);
          done();
        });

        it.skip('should throw error for no argument supplied', (done) => {//Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2899
          expect(Kinvey.Aggregation.min()).to.throw(/You must supply a field/);
          done();
        });
      });

      describe('Max()', () => {
        it('should return correct result for aggregation on single field', (done) => {
          const aggregation = Kinvey.Aggregation.max(constants.NumberFieldName);
          const stream = activeStore.group(aggregation);
          stream.subscribe((maxResult) => {
            try {
              var expectedResult = maxResult;
              if (dataStoreType === Kinvey.DataStoreType.Network) {
                expectedResult = maxResult[0];
                expect(maxResult.length).to.equal(1);
              }
              expect(expectedResult).to.deep.equal({ max: 3 });
              done();
            } catch (err) {
              done(err);
            }
          });
        });

        it('should return correct result when grouped by multiple field', (done) => {
          const aggregation = Kinvey.Aggregation.max(constants.NumberFieldName);
          aggregation.by(constants.TextFieldName);
          const stream = activeStore.group(aggregation);
          stream.subscribe((maxResult) => {
            try {
              expect(maxResult.length).to.equal(3);
              expect(pickAggregationResult(maxResult, 'Europe')[0].max).to.equal(2);
              expect(pickAggregationResult(maxResult, 'Asia')[0].max).to.equal(3);
              expect(pickAggregationResult(maxResult, 'America')[0].max).to.equal(3);
              done();
            } catch (err) {
              done(err);
            }
          });
        });

        it('should return correct result when grouped by multiple field with query', (done) => {
          const aggregation = Kinvey.Aggregation.max(constants.NumberFieldName);
          aggregation.by(constants.TextFieldName);
          aggregation.query = new Kinvey.Query();
          aggregation.query.contains(constants.TextFieldName, ['Europe', 'Asia']);
          const stream = activeStore.group(aggregation);
          stream.subscribe((maxResult) => {
            try {
              expect(maxResult.length).to.equal(2);
              expect(pickAggregationResult(maxResult, 'Europe')[0].max).to.equal(2);
              expect(pickAggregationResult(maxResult, 'Asia')[0].max).to.equal(3);
              done();
            } catch (err) {
              done(err);
            }
          });
        });

        it.skip('should throw error for argument of type array', (done) => { // Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2898
          expect(Kinvey.Aggregation.max(['field'])).to.throw(/The field argument must be a string/);
          done();
        });

        it.skip('should throw error for no argument supplied', (done) => {//Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2899
          expect(Kinvey.Aggregation.max()).to.throw(/You must supply a field/);
          done();
        });
      });

      describe('Count()', () => {
        it('should return correct result for aggregation on single field', (done) => {
          const aggregation = Kinvey.Aggregation.count(constants.TextFieldName);
          const stream = activeStore.group(aggregation);
          stream.subscribe((countResult) => {
            try {
              expect(countResult.length).to.equal(3);
              expect(pickAggregationResult(countResult, 'Europe')[0].count).to.equal(3);
              expect(pickAggregationResult(countResult, 'Asia')[0].count).to.equal(2);
              expect(pickAggregationResult(countResult, 'America')[0].count).to.equal(1);
              done();
            } catch (err) {
              done(err);
            }
          });
        });

        it('should return correct result when grouped by multiple field', (done) => {
          const aggregation = Kinvey.Aggregation.count(constants.TextFieldName);
          aggregation.by(constants.NumberFieldName);
          const stream = activeStore.group(aggregation);
          stream.subscribe((countResult) => {
            try {
              expect(countResult.length).to.equal(5);
              expect(pickAggregationResult(pickAggregationResult(countResult, 'Europe'), 1, constants.NumberFieldName)[0].count).to.equal(2);
              expect(pickAggregationResult(pickAggregationResult(countResult, 'Europe'), 2, constants.NumberFieldName)[0].count).to.equal(1);
              expect(pickAggregationResult(pickAggregationResult(countResult, 'Asia'), 3, constants.NumberFieldName)[0].count).to.equal(1);
              expect(pickAggregationResult(pickAggregationResult(countResult, 'Asia'), 2, constants.NumberFieldName)[0].count).to.equal(1);
              expect(pickAggregationResult(pickAggregationResult(countResult, 'America'), 3, constants.NumberFieldName)[0].count).to.equal(1);
              done();
            } catch (err) {
              done(err);
            }
          });
        });

        it('should return correct result when grouped by multiple field with query', (done) => {
          const aggregation = Kinvey.Aggregation.count(constants.TextFieldName);
          aggregation.by(constants.NumberFieldName);
          aggregation.query = new Kinvey.Query();
          aggregation.query.contains(constants.TextFieldName, ['Europe', 'Asia'])
          const stream = activeStore.group(aggregation);
          stream.subscribe((countResult) => {
            try {
              expect(countResult.length).to.equal(4);
              expect(pickAggregationResult(pickAggregationResult(countResult, 'Europe'), 1, constants.NumberFieldName)[0].count).to.equal(2);
              expect(pickAggregationResult(pickAggregationResult(countResult, 'Europe'), 2, constants.NumberFieldName)[0].count).to.equal(1);
              expect(pickAggregationResult(pickAggregationResult(countResult, 'Asia'), 3, constants.NumberFieldName)[0].count).to.equal(1);
              expect(pickAggregationResult(pickAggregationResult(countResult, 'Asia'), 2, constants.NumberFieldName)[0].count).to.equal(1);
              done();
            } catch (err) {
              done(err);
            }
          });
        });

        it.skip('should throw error for argument of type array', (done) => { // Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2898
          expect(Kinvey.Aggregation.count(['field'])).to.throw(/The field argument must be a string/);
          done();
        });

        it.skip('should throw error for no argument supplied', (done) => {//Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2899
          expect(Kinvey.Aggregation.count()).to.throw(/You must supply a field/);
          done();
        });
      });

      describe('Sum()', () => {
        it('should return correct result for aggregation on single field', (done) => {
          const aggregation = Kinvey.Aggregation.sum(constants.NumberFieldName);
          const stream = activeStore.group(aggregation);
          stream.subscribe((sumResult) => {
            try {
              var expectedResult = sumResult;
              if (dataStoreType === Kinvey.DataStoreType.Network) {
                expectedResult = sumResult[0];
                expect(sumResult.length).to.equal(1);
              }
              expect(expectedResult.sum).to.equal(12);
              done();
            } catch (err) {
              done(err);
            }
          });
        });

        it('should return correct result when grouped by multiple field', (done) => {
          const aggregation = Kinvey.Aggregation.sum(constants.NumberFieldName);
          aggregation.by(constants.TextFieldName);
          const stream = activeStore.group(aggregation);
          stream.subscribe((sumResult) => {
            try {
              expect(sumResult.length).to.equal(3);
              expect(pickAggregationResult(sumResult, 'Europe')[0].sum).to.equal(4);
              expect(pickAggregationResult(sumResult, 'Asia')[0].sum).to.equal(5);
              expect(pickAggregationResult(sumResult, 'America')[0].sum).to.equal(3);
              done();
            } catch (err) {
              done(err);
            }
          });
        });

        it('should return correct result when grouped by multiple field with query', (done) => {
          const aggregation = Kinvey.Aggregation.sum(constants.NumberFieldName);
          aggregation.by(constants.TextFieldName);
          aggregation.query = new Kinvey.Query();
          aggregation.query.contains(constants.TextFieldName, ['Europe', 'Asia']);
          const stream = activeStore.group(aggregation);
          stream.subscribe((sumResult) => {
            try {
              expect(sumResult.length).to.equal(2);
              expect(pickAggregationResult(sumResult, 'Europe')[0].sum).to.equal(4);
              expect(pickAggregationResult(sumResult, 'Asia')[0].sum).to.equal(5);
              done();
            } catch (err) {
              done(err);
            }
          });
        });

        it.skip('should throw error for argument of type array', (done) => { // Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2898
          expect(Kinvey.Aggregation.sum(['field'])).to.throw(/The field argument must be a string/);
          done();
        });

        it.skip('should throw error for no argument supplied', (done) => {//Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2899
          expect(Kinvey.Aggregation.sum()).to.throw(/You must supply a field/);
          done();
        });
      });

      describe('Average()', () => {
        it('should return correct result for aggregation on single field', (done) => {
          const aggregation = Kinvey.Aggregation.average(constants.NumberFieldName);
          const stream = activeStore.group(aggregation);
          stream.subscribe((averageResult) => {
            try {
              var expectedResult = averageResult;
              if (dataStoreType === Kinvey.DataStoreType.Network) {
                expectedResult = averageResult[0];
                expect(averageResult.length).to.equal(1);
              }
              expect(expectedResult.count).to.equal(6);
              expect(expectedResult.average).to.equal(2);
              done();
            } catch (err) {
              done(err);
            }
          });
        });

        it('should return correct result when grouped by multiple field', (done) => {
          const aggregation = Kinvey.Aggregation.average(constants.NumberFieldName);
          aggregation.by(constants.TextFieldName);
          const stream = activeStore.group(aggregation);
          stream.subscribe((averageResult) => {
            try {
              expect(averageResult.length).to.equal(3);
              expect(pickAggregationResult(averageResult, 'Europe')[0].average).to.equal(1.3333333333333333);
              expect(pickAggregationResult(averageResult, 'Europe')[0].count).to.equal(3);
              expect(pickAggregationResult(averageResult, 'Asia')[0].average).to.equal(2.5);
              expect(pickAggregationResult(averageResult, 'Asia')[0].count).to.equal(2);
              expect(pickAggregationResult(averageResult, 'America')[0].average).to.equal(3);
              expect(pickAggregationResult(averageResult, 'America')[0].count).to.equal(1);
              done();
            } catch (err) {
              done(err);
            }
          });
        });

        it('should return correct result when grouped by multiple field with query', (done) => {
          const aggregation = Kinvey.Aggregation.average(constants.NumberFieldName);
          aggregation.by(constants.TextFieldName);
          aggregation.query = new Kinvey.Query();
          aggregation.query.contains(constants.TextFieldName, ['Europe', 'Asia'])
          const stream = activeStore.group(aggregation);
          stream.subscribe((averageResult) => {
            try {
              expect(averageResult.length).to.equal(2);
              expect(pickAggregationResult(averageResult, 'Europe')[0].average).to.equal(1.3333333333333333);
              expect(pickAggregationResult(averageResult, 'Europe')[0].count).to.equal(3);
              expect(pickAggregationResult(averageResult, 'Asia')[0].average).to.equal(2.5);
              expect(pickAggregationResult(averageResult, 'Asia')[0].count).to.equal(2);
              done();
            } catch (err) {
              done(err);
            }
          });
        });

        it.skip('should throw error for argument of type array', (done) => { // Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2898
          expect(Kinvey.Aggregation.average(['field'])).to.throw(/The field argument must be a string/);
          done();
        });

        it.skip('should throw error for no argument supplied', (done) => {//Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2899
          expect(Kinvey.Aggregation.average()).to.throw(/You must supply a field/);
          done();
        });
      });
    });

  });

});
