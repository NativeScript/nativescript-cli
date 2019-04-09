"use strict";

require("core-js/modules/es.array.filter");

require("core-js/modules/es.array.find");

require("core-js/modules/es.array.for-each");

require("core-js/modules/es.object.define-property");

require("core-js/modules/es.object.get-own-property-descriptor");

require("core-js/modules/es.object.to-string");

require("core-js/modules/es.promise");

require("core-js/modules/web.dom-collections.for-each");

var _chai = require("chai");

var _sinon = _interopRequireDefault(require("sinon"));

var Kinvey = _interopRequireWildcard(require("kinvey-html5-sdk"));

var utilities = _interopRequireWildcard(require("../utils"));

var _config = require("../config");

var constants = _interopRequireWildcard(require("../constants"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var dataStoreTypes = [Kinvey.DataStoreType.Network, Kinvey.DataStoreType.Sync];
var createdUserIds = [];
before(function () {
  return Kinvey.init({
    appKey: process.env.APP_KEY,
    appSecret: process.env.APP_SECRET,
    masterSecret: process.env.MASTER_SECRET
  });
});
describe('Aggregation', function () {
  var entity1 = utilities.getEntity(utilities.randomString(), 'Europe', 1);
  var entity2 = utilities.getEntity(utilities.randomString(), 'Asia', 3);
  var entity3 = utilities.getEntity(utilities.randomString(), 'Asia', 2);
  var entity4 = utilities.getEntity(utilities.randomString(), 'America', 3);
  var entity5 = utilities.getEntity(utilities.randomString(), 'Europe', 1);
  var entity6 = utilities.getEntity(utilities.randomString(), 'Europe', 2);
  before(function (done) {
    utilities.cleanUpAppData(_config.collectionName, createdUserIds).then(function () {
      return Kinvey.User.signup();
    }).then(function (user) {
      createdUserIds.push(user.data._id);
      done();
    })["catch"](done);
  });
  after(function (done) {
    utilities.cleanUpAppData(_config.collectionName, createdUserIds).then(function () {
      return done();
    })["catch"](done);
  });

  var pickAggregationResult = function pickAggregationResult(initialArray, value) {
    var field = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : constants.TextFieldName;
    var result = initialArray.filter(function (initialValue) {
      return initialValue[field] === value;
    });
    return result;
  };

  describe('Aggregation with cachestore', function () {
    var cacheStore = Kinvey.DataStore.collection(_config.collectionName, Kinvey.DataStoreType.Cache);
    var networkStore = Kinvey.DataStore.collection(_config.collectionName, Kinvey.DataStoreType.Network);
    var syncStore = Kinvey.DataStore.collection(_config.collectionName, Kinvey.DataStoreType.Sync);
    var entity7 = utilities.getEntity(utilities.randomString(), 'Australia', 4);
    var entity8 = utilities.getEntity(utilities.randomString(), 'America', 0);
    var entitiesToDelete = [entity7._id, entity8._id];
    before(function (done) {
      utilities.cleanUpCollectionData(_config.collectionName).then(function () {
        return cacheStore.save(entity1);
      }).then(function () {
        return cacheStore.save(entity2);
      }).then(function () {
        return cacheStore.save(entity3);
      }).then(function () {
        return cacheStore.save(entity4);
      }).then(function () {
        return cacheStore.save(entity5);
      }).then(function () {
        return cacheStore.save(entity6);
      }).then(function () {
        return networkStore.save(entity7);
      }).then(function () {
        return networkStore.save(entity8);
      }).then(function () {
        return done();
      })["catch"](done);
    });

    var clearEntities = function clearEntities(entities) {
      if (entities && entities.length > 0) {
        var query = new Kinvey.Query();
        query.contains('_id', entities);
        return networkStore.remove(query);
      }

      return Promise.resolve();
    };

    after(function (done) {
      syncStore.find().toPromise().then(function () {
        return clearEntities(entitiesToDelete);
      }).then(function () {
        return done();
      })["catch"](done);
    });
    describe('Count', function () {
      it('should return correct result for aggregation on single field', function (done) {
        var aggregation = Kinvey.Aggregation.count(constants.TextFieldName);
        var stream = cacheStore.group(aggregation);

        var spy = _sinon["default"].spy();

        stream.subscribe(spy, done, function () {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            (0, _chai.expect)(countResultCache.length).to.equal(3);
            (0, _chai.expect)(pickAggregationResult(countResultCache, 'Europe')[0].count).to.equal(3);
            (0, _chai.expect)(pickAggregationResult(countResultCache, 'Asia')[0].count).to.equal(2);
            (0, _chai.expect)(pickAggregationResult(countResultCache, 'America')[0].count).to.equal(1);
            (0, _chai.expect)(countResultBackend.length).to.equal(4);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'Europe')[0].count).to.equal(3);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'Asia')[0].count).to.equal(2);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'America')[0].count).to.equal(2);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'Australia')[0].count).to.equal(1);
            done();
          } catch (err) {
            done(err);
          }
        });
      });
      it('should return correct result for aggregation on multiple fields', function (done) {
        var aggregation = Kinvey.Aggregation.count(constants.TextFieldName);
        var stream = cacheStore.group(aggregation);
        aggregation.by(constants.NumberFieldName);

        var spy = _sinon["default"].spy();

        stream.subscribe(spy, done, function () {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            (0, _chai.expect)(countResultCache.length).to.equal(5);
            (0, _chai.expect)(pickAggregationResult(pickAggregationResult(countResultCache, 'Europe'), 1, constants.NumberFieldName)[0].count).to.equal(2);
            (0, _chai.expect)(pickAggregationResult(pickAggregationResult(countResultCache, 'Europe'), 2, constants.NumberFieldName)[0].count).to.equal(1);
            (0, _chai.expect)(pickAggregationResult(pickAggregationResult(countResultCache, 'Asia'), 3, constants.NumberFieldName)[0].count).to.equal(1);
            (0, _chai.expect)(pickAggregationResult(pickAggregationResult(countResultCache, 'Asia'), 2, constants.NumberFieldName)[0].count).to.equal(1);
            (0, _chai.expect)(pickAggregationResult(pickAggregationResult(countResultCache, 'America'), 3, constants.NumberFieldName)[0].count).to.equal(1);
            (0, _chai.expect)(countResultBackend.length).to.equal(7);
            (0, _chai.expect)(pickAggregationResult(pickAggregationResult(countResultBackend, 'Europe'), 1, constants.NumberFieldName)[0].count).to.equal(2);
            (0, _chai.expect)(pickAggregationResult(pickAggregationResult(countResultBackend, 'Europe'), 2, constants.NumberFieldName)[0].count).to.equal(1);
            (0, _chai.expect)(pickAggregationResult(pickAggregationResult(countResultBackend, 'Asia'), 3, constants.NumberFieldName)[0].count).to.equal(1);
            (0, _chai.expect)(pickAggregationResult(pickAggregationResult(countResultBackend, 'Asia'), 2, constants.NumberFieldName)[0].count).to.equal(1);
            (0, _chai.expect)(pickAggregationResult(pickAggregationResult(countResultBackend, 'America'), 3, constants.NumberFieldName)[0].count).to.equal(1);
            (0, _chai.expect)(pickAggregationResult(pickAggregationResult(countResultBackend, 'America'), 0, constants.NumberFieldName)[0].count).to.equal(1);
            (0, _chai.expect)(pickAggregationResult(pickAggregationResult(countResultBackend, 'Australia'), 4, constants.NumberFieldName)[0].count).to.equal(1);
            done();
          } catch (err) {
            done(err);
          }
        });
      });
      it('should return correct result for aggregation on multiple fields with query', function (done) {
        var aggregation = Kinvey.Aggregation.count(constants.TextFieldName);
        aggregation.query = new Kinvey.Query();
        aggregation.query.contains(constants.TextFieldName, ['Europe', 'Australia']);
        var stream = cacheStore.group(aggregation);
        aggregation.by(constants.NumberFieldName);

        var spy = _sinon["default"].spy();

        stream.subscribe(spy, done, function () {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            (0, _chai.expect)(countResultCache.length).to.equal(2);
            (0, _chai.expect)(pickAggregationResult(pickAggregationResult(countResultCache, 'Europe'), 1, constants.NumberFieldName)[0].count).to.equal(2);
            (0, _chai.expect)(pickAggregationResult(pickAggregationResult(countResultCache, 'Europe'), 2, constants.NumberFieldName)[0].count).to.equal(1);
            (0, _chai.expect)(countResultBackend.length).to.equal(3);
            (0, _chai.expect)(pickAggregationResult(pickAggregationResult(countResultBackend, 'Europe'), 1, constants.NumberFieldName)[0].count).to.equal(2);
            (0, _chai.expect)(pickAggregationResult(pickAggregationResult(countResultBackend, 'Europe'), 2, constants.NumberFieldName)[0].count).to.equal(1);
            (0, _chai.expect)(pickAggregationResult(pickAggregationResult(countResultBackend, 'Australia'), 4, constants.NumberFieldName)[0].count).to.equal(1);
            done();
          } catch (err) {
            done(err);
          }
        });
      });
      it.skip('should throw error for argument of type array', function (done) {
        // Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2898
        (0, _chai.expect)(Kinvey.Aggregation.count(['field'])).to["throw"](/The field argument must be a string/);
        done();
      });
      it.skip('should throw error for no argument supplied', function (done) {
        //Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2899
        (0, _chai.expect)(Kinvey.Aggregation.count()).to["throw"](/You must supply a field/);
        done();
      });
    });
    describe('Min', function () {
      it('should return correct result for aggregation on single field', function (done) {
        var aggregation = Kinvey.Aggregation.min(constants.NumberFieldName);
        var stream = cacheStore.group(aggregation);

        var spy = _sinon["default"].spy();

        stream.subscribe(spy, done, function () {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            (0, _chai.expect)(countResultCache).to.deep.equal({
              min: 1
            });
            (0, _chai.expect)(countResultBackend).to.deep.equal([{
              min: 0
            }]);
            done();
          } catch (err) {
            done(err);
          }
        });
      });
      it('should return correct result for aggregation on multiple fields', function (done) {
        var aggregation = Kinvey.Aggregation.min(constants.NumberFieldName);
        var stream = cacheStore.group(aggregation);
        aggregation.by(constants.TextFieldName);

        var spy = _sinon["default"].spy();

        stream.subscribe(spy, done, function () {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            (0, _chai.expect)(countResultCache.length).to.equal(3);
            (0, _chai.expect)(pickAggregationResult(countResultCache, 'Europe')[0].min).to.equal(1);
            (0, _chai.expect)(pickAggregationResult(countResultCache, 'Asia')[0].min).to.equal(2);
            (0, _chai.expect)(pickAggregationResult(countResultCache, 'America')[0].min).to.equal(3);
            (0, _chai.expect)(countResultBackend.length).to.equal(4);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'Europe')[0].min).to.equal(1);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'Asia')[0].min).to.equal(2);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'America')[0].min).to.equal(0);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'Australia')[0].min).to.equal(4);
            done();
          } catch (err) {
            done(err);
          }
        });
      });
      it('should return correct result for aggregation on multiple fields with query', function (done) {
        var aggregation = Kinvey.Aggregation.min(constants.NumberFieldName);
        var stream = cacheStore.group(aggregation);
        aggregation.query = new Kinvey.Query();
        aggregation.query.contains(constants.TextFieldName, ['Europe', 'Australia']);
        aggregation.by(constants.TextFieldName);

        var spy = _sinon["default"].spy();

        stream.subscribe(spy, done, function () {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            (0, _chai.expect)(countResultCache.length).to.equal(1);
            (0, _chai.expect)(pickAggregationResult(countResultCache, 'Europe')[0].min).to.equal(1);
            (0, _chai.expect)(countResultBackend.length).to.equal(2);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'Europe')[0].min).to.equal(1);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'Australia')[0].min).to.equal(4);
            done();
          } catch (err) {
            done(err);
          }
        });
      });
      it.skip('should throw error for argument of type array', function (done) {
        // Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2898
        (0, _chai.expect)(Kinvey.Aggregation.min(['field'])).to["throw"](/The field argument must be a string/);
        done();
      });
      it.skip('should throw error for no argument supplied', function (done) {
        //Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2899
        (0, _chai.expect)(Kinvey.Aggregation.min()).to["throw"](/You must supply a field/);
        done();
      });
    });
    describe('Max', function () {
      it('should return correct result for aggregation on single field', function (done) {
        var aggregation = Kinvey.Aggregation.max(constants.NumberFieldName);
        var stream = cacheStore.group(aggregation);

        var spy = _sinon["default"].spy();

        stream.subscribe(spy, done, function () {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            (0, _chai.expect)(countResultCache).to.deep.equal({
              max: 3
            });
            (0, _chai.expect)(countResultBackend).to.deep.equal([{
              max: 4
            }]);
            done();
          } catch (err) {
            done(err);
          }
        });
      });
      it('should return correct result for aggregation on multiple fields', function (done) {
        var aggregation = Kinvey.Aggregation.max(constants.NumberFieldName);
        var stream = cacheStore.group(aggregation);
        aggregation.by(constants.TextFieldName);

        var spy = _sinon["default"].spy();

        stream.subscribe(spy, done, function () {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            (0, _chai.expect)(countResultCache.length).to.equal(3);
            (0, _chai.expect)(pickAggregationResult(countResultCache, 'Europe')[0].max).to.equal(2);
            (0, _chai.expect)(pickAggregationResult(countResultCache, 'Asia')[0].max).to.equal(3);
            (0, _chai.expect)(pickAggregationResult(countResultCache, 'America')[0].max).to.equal(3);
            (0, _chai.expect)(countResultBackend.length).to.equal(4);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'Europe')[0].max).to.equal(2);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'Asia')[0].max).to.equal(3);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'America')[0].max).to.equal(3);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'Australia')[0].max).to.equal(4);
            done();
          } catch (err) {
            done(err);
          }
        });
      });
      it('should return correct result for aggregation on multiple fields with query', function (done) {
        var aggregation = Kinvey.Aggregation.max(constants.NumberFieldName);
        var stream = cacheStore.group(aggregation);
        aggregation.by(constants.TextFieldName);
        aggregation.query = new Kinvey.Query();
        aggregation.query.contains(constants.TextFieldName, ['Europe', 'Australia']);

        var spy = _sinon["default"].spy();

        stream.subscribe(spy, done, function () {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            (0, _chai.expect)(countResultCache.length).to.equal(1);
            (0, _chai.expect)(pickAggregationResult(countResultCache, 'Europe')[0].max).to.equal(2);
            (0, _chai.expect)(countResultBackend.length).to.equal(2);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'Europe')[0].max).to.equal(2);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'Australia')[0].max).to.equal(4);
            done();
          } catch (err) {
            done(err);
          }
        });
      });
      it.skip('should throw error for argument of type array', function (done) {
        // Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2898
        (0, _chai.expect)(Kinvey.Aggregation.max(['field'])).to["throw"](/The field argument must be a string/);
        done();
      });
      it.skip('should throw error for no argument supplied', function (done) {
        //Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2899
        (0, _chai.expect)(Kinvey.Aggregation.max()).to["throw"](/You must supply a field/);
        done();
      });
    });
    describe('Sum', function () {
      it('should return correct result for aggregation on single field', function (done) {
        var aggregation = Kinvey.Aggregation.sum(constants.NumberFieldName);
        var stream = cacheStore.group(aggregation);

        var spy = _sinon["default"].spy();

        stream.subscribe(spy, done, function () {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            (0, _chai.expect)(countResultCache).to.deep.equal({
              sum: 12
            });
            (0, _chai.expect)(countResultBackend).to.deep.equal([{
              sum: 16
            }]);
            done();
          } catch (err) {
            done(err);
          }
        });
      });
      it('should return correct result for aggregation on multiple fields', function (done) {
        var aggregation = Kinvey.Aggregation.sum(constants.NumberFieldName);
        var stream = cacheStore.group(aggregation);
        aggregation.by(constants.TextFieldName);

        var spy = _sinon["default"].spy();

        stream.subscribe(spy, done, function () {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            (0, _chai.expect)(countResultCache.length).to.equal(3);
            (0, _chai.expect)(pickAggregationResult(countResultCache, 'Europe')[0].sum).to.equal(4);
            (0, _chai.expect)(pickAggregationResult(countResultCache, 'Asia')[0].sum).to.equal(5);
            (0, _chai.expect)(pickAggregationResult(countResultCache, 'America')[0].sum).to.equal(3);
            (0, _chai.expect)(countResultBackend.length).to.equal(4);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'Europe')[0].sum).to.equal(4);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'Asia')[0].sum).to.equal(5);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'America')[0].sum).to.equal(3);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'Australia')[0].sum).to.equal(4);
            done();
          } catch (err) {
            done(err);
          }
        });
      });
      it('should return correct result for aggregation on multiple fields with query', function (done) {
        var aggregation = Kinvey.Aggregation.sum(constants.NumberFieldName);
        var stream = cacheStore.group(aggregation);
        aggregation.by(constants.TextFieldName);
        aggregation.query = new Kinvey.Query();
        aggregation.query.contains(constants.TextFieldName, ['Europe', 'Australia']);

        var spy = _sinon["default"].spy();

        stream.subscribe(spy, done, function () {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            (0, _chai.expect)(countResultCache.length).to.equal(1);
            (0, _chai.expect)(pickAggregationResult(countResultCache, 'Europe')[0].sum).to.equal(4);
            (0, _chai.expect)(countResultBackend.length).to.equal(2);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'Europe')[0].sum).to.equal(4);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'Australia')[0].sum).to.equal(4);
            done();
          } catch (err) {
            done(err);
          }
        });
      });
      it.skip('should throw error for argument of type array', function (done) {
        // Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2898
        (0, _chai.expect)(Kinvey.Aggregation.sum(['field'])).to["throw"](/The field argument must be a string/);
        done();
      });
      it.skip('should throw error for no argument supplied', function (done) {
        //Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2899
        (0, _chai.expect)(Kinvey.Aggregation.sum()).to["throw"](/You must supply a field/);
        done();
      });
    });
    describe('Average', function () {
      it('should return correct result for aggregation on single field', function (done) {
        var aggregation = Kinvey.Aggregation.average(constants.NumberFieldName);
        var stream = cacheStore.group(aggregation);

        var spy = _sinon["default"].spy();

        stream.subscribe(spy, done, function () {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            (0, _chai.expect)(countResultCache).to.deep.equal({
              count: 6,
              average: 2
            });
            (0, _chai.expect)(countResultBackend).to.deep.equal([{
              count: 8,
              average: 2
            }]);
            done();
          } catch (err) {
            done(err);
          }
        });
      });
      it('should return correct result for aggregation on multiple fields', function (done) {
        var aggregation = Kinvey.Aggregation.average(constants.NumberFieldName);
        var stream = cacheStore.group(aggregation);
        aggregation.by(constants.TextFieldName);

        var spy = _sinon["default"].spy();

        stream.subscribe(spy, done, function () {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            (0, _chai.expect)(countResultCache.length).to.equal(3);
            (0, _chai.expect)(pickAggregationResult(countResultCache, 'Europe')[0].average).to.equal(1.3333333333333333);
            (0, _chai.expect)(pickAggregationResult(countResultCache, 'Asia')[0].average).to.equal(2.5);
            (0, _chai.expect)(pickAggregationResult(countResultCache, 'America')[0].average).to.equal(3);
            (0, _chai.expect)(countResultBackend.length).to.equal(4);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'Europe')[0].average).to.equal(1.3333333333333333);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'Asia')[0].average).to.equal(2.5);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'America')[0].average).to.equal(1.5);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'Australia')[0].average).to.equal(4);
            done();
          } catch (err) {
            done(err);
          }
        });
      });
      it('should return correct result for aggregation on multiple fields with query', function (done) {
        var aggregation = Kinvey.Aggregation.average(constants.NumberFieldName);
        var stream = cacheStore.group(aggregation);
        aggregation.by(constants.TextFieldName);
        aggregation.query = new Kinvey.Query();
        aggregation.query.contains(constants.TextFieldName, ['Europe', 'Australia']);

        var spy = _sinon["default"].spy();

        stream.subscribe(spy, done, function () {
          try {
            var countResultCache = spy.firstCall.args[0];
            var countResultBackend = spy.secondCall.args[0];
            (0, _chai.expect)(countResultCache.length).to.equal(1);
            (0, _chai.expect)(pickAggregationResult(countResultCache, 'Europe')[0].average).to.equal(1.3333333333333333);
            (0, _chai.expect)(countResultBackend.length).to.equal(2);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'Europe')[0].average).to.equal(1.3333333333333333);
            (0, _chai.expect)(pickAggregationResult(countResultBackend, 'Australia')[0].average).to.equal(4);
            done();
          } catch (err) {
            done(err);
          }
        });
      });
      it.skip('should throw error for argument of type array', function (done) {
        // Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2898
        (0, _chai.expect)(Kinvey.Aggregation.average(['field'])).to["throw"](/The field argument must be a string/);
        done();
      });
      it.skip('should throw error for no argument supplied', function (done) {
        //Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2899
        (0, _chai.expect)(Kinvey.Aggregation.average()).to["throw"](/You must supply a field/);
        done();
      });
    });
  });
  dataStoreTypes.forEach(function (dataStoreType) {
    describe("Aggregation with ".concat(dataStoreType), function () {
      var activeStore = Kinvey.DataStore.collection(_config.collectionName, dataStoreType);
      before(function (done) {
        utilities.cleanUpCollectionData(_config.collectionName).then(function () {
          return activeStore.save(entity1);
        }).then(function () {
          return activeStore.save(entity2);
        }).then(function () {
          return activeStore.save(entity3);
        }).then(function () {
          return activeStore.save(entity4);
        }).then(function () {
          return activeStore.save(entity5);
        }).then(function () {
          return activeStore.save(entity6);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      describe('Min()', function () {
        it('should return correct result for aggregation on single field', function (done) {
          var aggregation = Kinvey.Aggregation.min(constants.NumberFieldName);
          var stream = activeStore.group(aggregation);
          stream.subscribe(function (minResult) {
            try {
              var expectedResult = minResult;

              if (dataStoreType === Kinvey.DataStoreType.Network) {
                expectedResult = minResult[0];
                (0, _chai.expect)(minResult.length).to.equal(1);
              }

              (0, _chai.expect)(expectedResult).to.deep.equal({
                min: 1
              });
              done();
            } catch (err) {
              done(err);
            }
          });
        });
        it('should return correct result when grouped by multiple field', function (done) {
          var aggregation = Kinvey.Aggregation.min(constants.NumberFieldName);
          aggregation.by(constants.TextFieldName);
          var stream = activeStore.group(aggregation);
          stream.subscribe(function (minResult) {
            try {
              (0, _chai.expect)(minResult.length).to.equal(3);
              (0, _chai.expect)(pickAggregationResult(minResult, 'Europe')[0].min).to.equal(1);
              (0, _chai.expect)(pickAggregationResult(minResult, 'Asia')[0].min).to.equal(2);
              (0, _chai.expect)(pickAggregationResult(minResult, 'America')[0].min).to.equal(3);
              done();
            } catch (err) {
              done(err);
            }
          });
        });
        it('should return correct result when grouped by multiple field with query', function (done) {
          var aggregation = Kinvey.Aggregation.min(constants.NumberFieldName);
          aggregation.by(constants.TextFieldName);
          aggregation.query = new Kinvey.Query();
          aggregation.query.contains(constants.TextFieldName, ['Europe', 'Asia']);
          var stream = activeStore.group(aggregation);
          stream.subscribe(function (minResult) {
            try {
              (0, _chai.expect)(minResult.length).to.equal(2);
              (0, _chai.expect)(pickAggregationResult(minResult, 'Europe')[0].min).to.equal(1);
              (0, _chai.expect)(pickAggregationResult(minResult, 'Asia')[0].min).to.equal(2);
              done();
            } catch (err) {
              done(err);
            }
          });
        });
        it.skip('should throw error for argument of type array', function (done) {
          // Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2898
          (0, _chai.expect)(Kinvey.Aggregation.min(['field'])).to["throw"](/The field argument must be a string/);
          done();
        });
        it.skip('should throw error for no argument supplied', function (done) {
          //Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2899
          (0, _chai.expect)(Kinvey.Aggregation.min()).to["throw"](/You must supply a field/);
          done();
        });
      });
      describe('Max()', function () {
        it('should return correct result for aggregation on single field', function (done) {
          var aggregation = Kinvey.Aggregation.max(constants.NumberFieldName);
          var stream = activeStore.group(aggregation);
          stream.subscribe(function (maxResult) {
            try {
              var expectedResult = maxResult;

              if (dataStoreType === Kinvey.DataStoreType.Network) {
                expectedResult = maxResult[0];
                (0, _chai.expect)(maxResult.length).to.equal(1);
              }

              (0, _chai.expect)(expectedResult).to.deep.equal({
                max: 3
              });
              done();
            } catch (err) {
              done(err);
            }
          });
        });
        it('should return correct result when grouped by multiple field', function (done) {
          var aggregation = Kinvey.Aggregation.max(constants.NumberFieldName);
          aggregation.by(constants.TextFieldName);
          var stream = activeStore.group(aggregation);
          stream.subscribe(function (maxResult) {
            try {
              (0, _chai.expect)(maxResult.length).to.equal(3);
              (0, _chai.expect)(pickAggregationResult(maxResult, 'Europe')[0].max).to.equal(2);
              (0, _chai.expect)(pickAggregationResult(maxResult, 'Asia')[0].max).to.equal(3);
              (0, _chai.expect)(pickAggregationResult(maxResult, 'America')[0].max).to.equal(3);
              done();
            } catch (err) {
              done(err);
            }
          });
        });
        it('should return correct result when grouped by multiple field with query', function (done) {
          var aggregation = Kinvey.Aggregation.max(constants.NumberFieldName);
          aggregation.by(constants.TextFieldName);
          aggregation.query = new Kinvey.Query();
          aggregation.query.contains(constants.TextFieldName, ['Europe', 'Asia']);
          var stream = activeStore.group(aggregation);
          stream.subscribe(function (maxResult) {
            try {
              (0, _chai.expect)(maxResult.length).to.equal(2);
              (0, _chai.expect)(pickAggregationResult(maxResult, 'Europe')[0].max).to.equal(2);
              (0, _chai.expect)(pickAggregationResult(maxResult, 'Asia')[0].max).to.equal(3);
              done();
            } catch (err) {
              done(err);
            }
          });
        });
        it.skip('should throw error for argument of type array', function (done) {
          // Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2898
          (0, _chai.expect)(Kinvey.Aggregation.max(['field'])).to["throw"](/The field argument must be a string/);
          done();
        });
        it.skip('should throw error for no argument supplied', function (done) {
          //Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2899
          (0, _chai.expect)(Kinvey.Aggregation.max()).to["throw"](/You must supply a field/);
          done();
        });
      });
      describe('Count()', function () {
        it('should return correct result for aggregation on single field', function (done) {
          var aggregation = Kinvey.Aggregation.count(constants.TextFieldName);
          var stream = activeStore.group(aggregation);
          stream.subscribe(function (countResult) {
            try {
              (0, _chai.expect)(countResult.length).to.equal(3);
              (0, _chai.expect)(pickAggregationResult(countResult, 'Europe')[0].count).to.equal(3);
              (0, _chai.expect)(pickAggregationResult(countResult, 'Asia')[0].count).to.equal(2);
              (0, _chai.expect)(pickAggregationResult(countResult, 'America')[0].count).to.equal(1);
              done();
            } catch (err) {
              done(err);
            }
          });
        });
        it('should return correct result when grouped by multiple field', function (done) {
          var aggregation = Kinvey.Aggregation.count(constants.TextFieldName);
          aggregation.by(constants.NumberFieldName);
          var stream = activeStore.group(aggregation);
          stream.subscribe(function (countResult) {
            try {
              (0, _chai.expect)(countResult.length).to.equal(5);
              (0, _chai.expect)(pickAggregationResult(pickAggregationResult(countResult, 'Europe'), 1, constants.NumberFieldName)[0].count).to.equal(2);
              (0, _chai.expect)(pickAggregationResult(pickAggregationResult(countResult, 'Europe'), 2, constants.NumberFieldName)[0].count).to.equal(1);
              (0, _chai.expect)(pickAggregationResult(pickAggregationResult(countResult, 'Asia'), 3, constants.NumberFieldName)[0].count).to.equal(1);
              (0, _chai.expect)(pickAggregationResult(pickAggregationResult(countResult, 'Asia'), 2, constants.NumberFieldName)[0].count).to.equal(1);
              (0, _chai.expect)(pickAggregationResult(pickAggregationResult(countResult, 'America'), 3, constants.NumberFieldName)[0].count).to.equal(1);
              done();
            } catch (err) {
              done(err);
            }
          });
        });
        it('should return correct result when grouped by multiple field with query', function (done) {
          var aggregation = Kinvey.Aggregation.count(constants.TextFieldName);
          aggregation.by(constants.NumberFieldName);
          aggregation.query = new Kinvey.Query();
          aggregation.query.contains(constants.TextFieldName, ['Europe', 'Asia']);
          var stream = activeStore.group(aggregation);
          stream.subscribe(function (countResult) {
            try {
              (0, _chai.expect)(countResult.length).to.equal(4);
              (0, _chai.expect)(pickAggregationResult(pickAggregationResult(countResult, 'Europe'), 1, constants.NumberFieldName)[0].count).to.equal(2);
              (0, _chai.expect)(pickAggregationResult(pickAggregationResult(countResult, 'Europe'), 2, constants.NumberFieldName)[0].count).to.equal(1);
              (0, _chai.expect)(pickAggregationResult(pickAggregationResult(countResult, 'Asia'), 3, constants.NumberFieldName)[0].count).to.equal(1);
              (0, _chai.expect)(pickAggregationResult(pickAggregationResult(countResult, 'Asia'), 2, constants.NumberFieldName)[0].count).to.equal(1);
              done();
            } catch (err) {
              done(err);
            }
          });
        });
        it.skip('should throw error for argument of type array', function (done) {
          // Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2898
          (0, _chai.expect)(Kinvey.Aggregation.count(['field'])).to["throw"](/The field argument must be a string/);
          done();
        });
        it.skip('should throw error for no argument supplied', function (done) {
          //Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2899
          (0, _chai.expect)(Kinvey.Aggregation.count()).to["throw"](/You must supply a field/);
          done();
        });
      });
      describe('Sum()', function () {
        it('should return correct result for aggregation on single field', function (done) {
          var aggregation = Kinvey.Aggregation.sum(constants.NumberFieldName);
          var stream = activeStore.group(aggregation);
          stream.subscribe(function (sumResult) {
            try {
              var expectedResult = sumResult;

              if (dataStoreType === Kinvey.DataStoreType.Network) {
                expectedResult = sumResult[0];
                (0, _chai.expect)(sumResult.length).to.equal(1);
              }

              (0, _chai.expect)(expectedResult.sum).to.equal(12);
              done();
            } catch (err) {
              done(err);
            }
          });
        });
        it('should return correct result when grouped by multiple field', function (done) {
          var aggregation = Kinvey.Aggregation.sum(constants.NumberFieldName);
          aggregation.by(constants.TextFieldName);
          var stream = activeStore.group(aggregation);
          stream.subscribe(function (sumResult) {
            try {
              (0, _chai.expect)(sumResult.length).to.equal(3);
              (0, _chai.expect)(pickAggregationResult(sumResult, 'Europe')[0].sum).to.equal(4);
              (0, _chai.expect)(pickAggregationResult(sumResult, 'Asia')[0].sum).to.equal(5);
              (0, _chai.expect)(pickAggregationResult(sumResult, 'America')[0].sum).to.equal(3);
              done();
            } catch (err) {
              done(err);
            }
          });
        });
        it('should return correct result when grouped by multiple field with query', function (done) {
          var aggregation = Kinvey.Aggregation.sum(constants.NumberFieldName);
          aggregation.by(constants.TextFieldName);
          aggregation.query = new Kinvey.Query();
          aggregation.query.contains(constants.TextFieldName, ['Europe', 'Asia']);
          var stream = activeStore.group(aggregation);
          stream.subscribe(function (sumResult) {
            try {
              (0, _chai.expect)(sumResult.length).to.equal(2);
              (0, _chai.expect)(pickAggregationResult(sumResult, 'Europe')[0].sum).to.equal(4);
              (0, _chai.expect)(pickAggregationResult(sumResult, 'Asia')[0].sum).to.equal(5);
              done();
            } catch (err) {
              done(err);
            }
          });
        });
        it.skip('should throw error for argument of type array', function (done) {
          // Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2898
          (0, _chai.expect)(Kinvey.Aggregation.sum(['field'])).to["throw"](/The field argument must be a string/);
          done();
        });
        it.skip('should throw error for no argument supplied', function (done) {
          //Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2899
          (0, _chai.expect)(Kinvey.Aggregation.sum()).to["throw"](/You must supply a field/);
          done();
        });
      });
      describe('Average()', function () {
        it('should return correct result for aggregation on single field', function (done) {
          var aggregation = Kinvey.Aggregation.average(constants.NumberFieldName);
          var stream = activeStore.group(aggregation);
          stream.subscribe(function (averageResult) {
            try {
              var expectedResult = averageResult;

              if (dataStoreType === Kinvey.DataStoreType.Network) {
                expectedResult = averageResult[0];
                (0, _chai.expect)(averageResult.length).to.equal(1);
              }

              (0, _chai.expect)(expectedResult.count).to.equal(6);
              (0, _chai.expect)(expectedResult.average).to.equal(2);
              done();
            } catch (err) {
              done(err);
            }
          });
        });
        it('should return correct result when grouped by multiple field', function (done) {
          var aggregation = Kinvey.Aggregation.average(constants.NumberFieldName);
          aggregation.by(constants.TextFieldName);
          var stream = activeStore.group(aggregation);
          stream.subscribe(function (averageResult) {
            try {
              (0, _chai.expect)(averageResult.length).to.equal(3);
              (0, _chai.expect)(pickAggregationResult(averageResult, 'Europe')[0].average).to.equal(1.3333333333333333);
              (0, _chai.expect)(pickAggregationResult(averageResult, 'Europe')[0].count).to.equal(3);
              (0, _chai.expect)(pickAggregationResult(averageResult, 'Asia')[0].average).to.equal(2.5);
              (0, _chai.expect)(pickAggregationResult(averageResult, 'Asia')[0].count).to.equal(2);
              (0, _chai.expect)(pickAggregationResult(averageResult, 'America')[0].average).to.equal(3);
              (0, _chai.expect)(pickAggregationResult(averageResult, 'America')[0].count).to.equal(1);
              done();
            } catch (err) {
              done(err);
            }
          });
        });
        it('should return correct result when grouped by multiple field with query', function (done) {
          var aggregation = Kinvey.Aggregation.average(constants.NumberFieldName);
          aggregation.by(constants.TextFieldName);
          aggregation.query = new Kinvey.Query();
          aggregation.query.contains(constants.TextFieldName, ['Europe', 'Asia']);
          var stream = activeStore.group(aggregation);
          stream.subscribe(function (averageResult) {
            try {
              (0, _chai.expect)(averageResult.length).to.equal(2);
              (0, _chai.expect)(pickAggregationResult(averageResult, 'Europe')[0].average).to.equal(1.3333333333333333);
              (0, _chai.expect)(pickAggregationResult(averageResult, 'Europe')[0].count).to.equal(3);
              (0, _chai.expect)(pickAggregationResult(averageResult, 'Asia')[0].average).to.equal(2.5);
              (0, _chai.expect)(pickAggregationResult(averageResult, 'Asia')[0].count).to.equal(2);
              done();
            } catch (err) {
              done(err);
            }
          });
        });
        it.skip('should throw error for argument of type array', function (done) {
          // Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2898
          (0, _chai.expect)(Kinvey.Aggregation.average(['field'])).to["throw"](/The field argument must be a string/);
          done();
        });
        it.skip('should throw error for no argument supplied', function (done) {
          //Skipped until fix https://kinvey.atlassian.net/browse/MLIBZ-2899
          (0, _chai.expect)(Kinvey.Aggregation.average()).to["throw"](/You must supply a field/);
          done();
        });
      });
    });
  });
});