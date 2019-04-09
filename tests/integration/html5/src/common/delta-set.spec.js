"use strict";

require("core-js/modules/es.array.find");

require("core-js/modules/es.array.for-each");

require("core-js/modules/es.date.to-iso-string");

require("core-js/modules/es.date.to-string");

require("core-js/modules/es.object.define-property");

require("core-js/modules/es.object.get-own-property-descriptor");

require("core-js/modules/web.dom-collections.for-each");

var _chai = require("chai");

var _sinon = _interopRequireDefault(require("sinon"));

var _lodash = _interopRequireDefault(require("lodash"));

var Kinvey = _interopRequireWildcard(require("kinvey-html5-sdk"));

var config = _interopRequireWildcard(require("../config"));

var utilities = _interopRequireWildcard(require("../utils"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var dataStoreTypes = [Kinvey.DataStoreType.Cache, Kinvey.DataStoreType.Sync];
before(function () {
  return Kinvey.init({
    appKey: process.env.APP_KEY,
    appSecret: process.env.APP_SECRET,
    masterSecret: process.env.MASTER_SECRET
  });
});
dataStoreTypes.forEach(function (currentDataStoreType) {
  describe("".concat(currentDataStoreType, " Deltaset tests"), function () {
    var conditionalDescribe = currentDataStoreType === Kinvey.DataStoreType.Sync ? describe.skip : describe;
    var deltaCollectionName = config.deltaCollectionName;
    var collectionWithoutDelta = config.collectionName;
    var tagStore = 'kinveyTest';
    var deltaNetworkStore;
    var syncStore;
    var cacheStore;
    var deltaSyncStore;
    var deltaCacheStore;

    var validatePullOperation = function validatePullOperation(result, expectedItems, expectedPulledItemsCount, tagStore, collectionName) {
      var collectioNameForStore = collectionName ? collectionName : deltaCollectionName;
      var taggedDataStore = tagStore ? Kinvey.DataStore.collection(deltaCollectionName, Kinvey.DataStoreType.Sync, {
        tag: tagStore
      }) : null;
      var syncStoreToFind = Kinvey.DataStore.collection(collectioNameForStore, Kinvey.DataStoreType.Sync);
      (0, _chai.expect)(result).to.equal(expectedPulledItemsCount || expectedItems.length);
      var storeToFind = tagStore ? taggedDataStore : syncStoreToFind;
      return storeToFind.find().toPromise().then(function (result) {
        expectedItems.forEach(function (entity) {
          var cachedEntity = _lodash["default"].find(result, function (e) {
            return e._id === entity._id;
          });

          (0, _chai.expect)(utilities.deleteEntityMetadata(cachedEntity)).to.deep.equal(entity);
        });
      });
    };

    var validateNewPullOperation = function validateNewPullOperation(result, expectedPulledItems, expectedDeletedItems, tagStore) {
      (0, _chai.expect)(result).to.equal(expectedPulledItems.length);
      var storeToFind = tagStore ? Kinvey.DataStore.collection(deltaCollectionName, Kinvey.DataStoreType.Sync, {
        tag: tagStore
      }) : syncStore;
      return storeToFind.find().toPromise().then(function (result) {
        expectedPulledItems.forEach(function (entity) {
          var cachedEntity = _lodash["default"].find(result, function (e) {
            return e._id === entity._id;
          });

          (0, _chai.expect)(utilities.deleteEntityMetadata(cachedEntity)).to.deep.equal(entity);
        });
        expectedDeletedItems.forEach(function (entity) {
          var deletedEntity = _lodash["default"].find(result, function (e) {
            return e._id === entity._id;
          });

          (0, _chai.expect)(deletedEntity).to.equal(undefined);
        });
      });
    };

    before(function () {
      deltaNetworkStore = Kinvey.DataStore.collection(deltaCollectionName, Kinvey.DataStoreType.Network);
      syncStore = Kinvey.DataStore.collection(deltaCollectionName, Kinvey.DataStoreType.Sync);
      cacheStore = Kinvey.DataStore.collection(deltaCollectionName, Kinvey.DataStoreType.Cache);
      deltaSyncStore = Kinvey.DataStore.collection(deltaCollectionName, Kinvey.DataStoreType.Sync, {
        useDeltaSet: true
      });
      deltaCacheStore = Kinvey.DataStore.collection(deltaCollectionName, Kinvey.DataStoreType.Cache, {
        useDeltaSet: true
      });
    });
    describe('pull', function () {
      var entity1 = utilities.getEntity(utilities.randomString());
      var entity2 = utilities.getEntity(utilities.randomString());
      var entity3 = utilities.getEntity(utilities.randomString());
      var createdUserIds = [];
      var deltaStoreToTest;
      var taggedDeltaStoreToTest;
      before(function () {
        deltaStoreToTest = Kinvey.DataStore.collection(deltaCollectionName, currentDataStoreType, {
          useDeltaSet: true
        });
        taggedDeltaStoreToTest = Kinvey.DataStore.collection(deltaCollectionName, currentDataStoreType, {
          useDeltaSet: true,
          tag: tagStore
        });
      });
      before(function (done) {
        utilities.cleanUpAppData(deltaCollectionName, createdUserIds).then(function () {
          return Kinvey.User.signup();
        }).then(function (user) {
          createdUserIds.push(user.data._id);
          done();
        })["catch"](done);
      });
      beforeEach(function (done) {
        utilities.cleanUpCollectionData(deltaCollectionName).then(function () {
          return deltaNetworkStore.save(entity1);
        }).then(function () {
          return deltaNetworkStore.save(entity2);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      after(function (done) {
        utilities.cleanUpAppData(deltaCollectionName, createdUserIds).then(function () {
          return done();
        })["catch"](done);
      });
      it('should return correct number of items without changes', function (done) {
        deltaStoreToTest.pull().then(function (result) {
          return validatePullOperation(result, [entity1, entity2]);
        }).then(function () {
          return deltaStoreToTest.pull();
        }).then(function (result) {
          return validateNewPullOperation(result, [], []);
        }).then(function () {
          return done();
        })["catch"](function (error) {
          return done(error);
        });
      });
      it('should return correct number of items with disabled deltaset', function (done) {
        var disabledDeltaSetStore = currentDataStoreType === Kinvey.DataStoreType.Cache ? cacheStore : syncStore;
        disabledDeltaSetStore.pull().then(function (result) {
          return validatePullOperation(result, [entity1, entity2]);
        }).then(function () {
          return disabledDeltaSetStore.pull();
        }).then(function (result) {
          return validatePullOperation(result, [entity1, entity2]);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      it('should return correct number of items with created item', function (done) {
        var entity4 = utilities.getEntity(utilities.randomString());
        var entity5 = utilities.getEntity(utilities.randomString());
        deltaStoreToTest.pull().then(function (result) {
          return validatePullOperation(result, [entity1, entity2]);
        }).then(function () {
          return deltaNetworkStore.save(entity3);
        }).then(function () {
          return deltaStoreToTest.pull();
        }).then(function (result) {
          return validateNewPullOperation(result, [entity3], []);
        }).then(function () {
          return deltaNetworkStore.save(entity4);
        }).then(function () {
          return deltaNetworkStore.save(entity5);
        }).then(function () {
          return deltaStoreToTest.pull();
        }).then(function (result) {
          return validateNewPullOperation(result, [entity4, entity5], []);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      it('should return correct number of items with created item with 3rd request', function (done) {
        var entity4 = utilities.getEntity(utilities.randomString());
        deltaStoreToTest.pull().then(function (result) {
          return validatePullOperation(result, [entity1, entity2]);
        }).then(function () {
          return deltaNetworkStore.save(entity3);
        }).then(function () {
          return deltaStoreToTest.pull();
        }).then(function (result) {
          return validateNewPullOperation(result, [entity3], []);
        }).then(function () {
          return deltaNetworkStore.save(entity4);
        }).then(function () {
          return deltaStoreToTest.pull();
        }).then(function (result) {
          return validateNewPullOperation(result, [entity4], []);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      it('should return correct number of items with auto-pagination', function (done) {
        deltaStoreToTest.pull(new Kinvey.Query(), {
          autoPagination: true
        }).then(function (result) {
          return validatePullOperation(result, [entity1, entity2]);
        }).then(function () {
          return deltaNetworkStore.save(entity3);
        }).then(function () {
          return deltaStoreToTest.pull(new Kinvey.Query(), {
            autoPagination: true
          });
        }).then(function (result) {
          return validateNewPullOperation(result, [entity3], []);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      it('should return correct number of items with auto-pagination and skip and limit', function (done) {
        var query = new Kinvey.Query();
        query.skip = 1;
        query.limit = 2;
        deltaStoreToTest.pull(query, {
          autoPagination: true
        }).then(function (result) {
          return validatePullOperation(result, [entity1, entity2]);
        }).then(function () {
          return deltaNetworkStore.save(entity3);
        }).then(function () {
          return deltaStoreToTest.pull(query, {
            autoPagination: true
          });
        }).then(function (result) {
          return validateNewPullOperation(result, [entity1, entity2, entity3], []);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      it('should return correct number of items with tagged dataStore', function (done) {
        var onNextSpy = _sinon["default"].spy();

        syncStore.save(entity1).then(function () {
          return taggedDeltaStoreToTest.pull();
        }).then(function (result) {
          return validatePullOperation(result, [entity1, entity2], 2, tagStore);
        }).then(function () {
          return deltaNetworkStore.save(entity3);
        }).then(function () {
          return taggedDeltaStoreToTest.pull();
        }).then(function (result) {
          return validateNewPullOperation(result, [entity3], [], tagStore);
        }).then(function () {
          return deltaNetworkStore.removeById(entity1._id);
        }).then(function () {
          return taggedDeltaStoreToTest.pull();
        }).then(function (result) {
          validateNewPullOperation(result, [], [entity1], tagStore);
        }).then(function () {
          syncStore.find().subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(Kinvey.DataStoreType.Sync, onNextSpy, [entity1]);
              done();
            } catch (error) {
              done(error);
            }
          });
        })["catch"](done);
      });
      it('should return correct number of items with deleted item', function (done) {
        deltaNetworkStore.save(entity3).then(function () {
          return deltaStoreToTest.pull();
        }).then(function (result) {
          return validatePullOperation(result, [entity1, entity2, entity3]);
        }).then(function () {
          return deltaNetworkStore.removeById(entity1._id);
        }).then(function () {
          return deltaStoreToTest.pull();
        }).then(function (result) {
          return validateNewPullOperation(result, [], [entity1]);
        }).then(function () {
          return deltaNetworkStore.removeById(entity2._id);
        }).then(function () {
          return deltaNetworkStore.removeById(entity3._id);
        }).then(function () {
          return deltaStoreToTest.pull();
        }).then(function (result) {
          return validateNewPullOperation(result, [], [entity2, entity3]);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      it('should return correct number of items with updated item', function (done) {
        var updatedEntity = _lodash["default"].clone(entity2);

        var updatedEntity1 = _lodash["default"].clone(entity1);

        var updatedEntity2 = _lodash["default"].clone(entity3);

        updatedEntity.textField = utilities.randomString();
        updatedEntity1.textField = utilities.randomString();
        updatedEntity2.textField = utilities.randomString();
        deltaNetworkStore.save(entity3).then(function () {
          return deltaStoreToTest.pull();
        }).then(function (result) {
          return validatePullOperation(result, [entity1, entity2, entity3]);
        }).then(function () {
          return deltaNetworkStore.save(updatedEntity);
        }).then(function () {
          return deltaStoreToTest.pull();
        }).then(function (result) {
          return validateNewPullOperation(result, [updatedEntity], []);
        }).then(function () {
          return deltaNetworkStore.save(updatedEntity1);
        }).then(function () {
          return deltaNetworkStore.save(updatedEntity2);
        }).then(function () {
          return deltaStoreToTest.pull();
        }).then(function (result) {
          return validateNewPullOperation(result, [updatedEntity1, updatedEntity2], []);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      it('should return correct number of items with updated and deleted item', function (done) {
        var entity4 = utilities.getEntity(utilities.randomString());

        var updatedEntity = _lodash["default"].clone(entity2);

        var updatedEntity1 = _lodash["default"].clone(entity1);

        var updatedEntity2 = _lodash["default"].clone(entity3);

        updatedEntity.textField = utilities.randomString();
        updatedEntity1.textField = utilities.randomString();
        updatedEntity2.textField = utilities.randomString();
        deltaNetworkStore.save(entity3).then(function () {
          return deltaNetworkStore.save(entity4);
        }).then(function () {
          return deltaStoreToTest.pull();
        }).then(function (result) {
          return validatePullOperation(result, [entity1, entity2, entity3, entity4]);
        }).then(function () {
          return deltaNetworkStore.save(updatedEntity);
        }).then(function () {
          return deltaNetworkStore.removeById(entity1._id);
        }).then(function () {
          return deltaStoreToTest.pull();
        }).then(function (result) {
          return validateNewPullOperation(result, [updatedEntity], [entity1]);
        }).then(function () {
          return deltaNetworkStore.save(updatedEntity2);
        }).then(function () {
          return deltaNetworkStore.removeById(updatedEntity._id);
        }).then(function () {
          return deltaNetworkStore.removeById(entity4._id);
        }).then(function () {
          return deltaStoreToTest.pull();
        }).then(function (result) {
          return validateNewPullOperation(result, [updatedEntity2], [updatedEntity, entity4]);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      it('should return correct number of items with query with updated item', function (done) {
        var entity4 = utilities.getEntity(utilities.randomString(), 'queryValue');
        var entity5 = utilities.getEntity(utilities.randomString(), 'queryValue');
        var entity6 = utilities.getEntity(utilities.randomString(), 'queryValue');

        var updatedEntity = _lodash["default"].clone(entity5);

        updatedEntity.numberField = 5;
        var query = new Kinvey.Query();
        query.equalTo('textField', 'queryValue');
        deltaNetworkStore.save(entity4).then(function () {
          return deltaNetworkStore.save(entity5);
        }).then(function () {
          return deltaNetworkStore.save(entity6);
        }).then(function () {
          return deltaStoreToTest.pull(query).then(function (result) {
            return validatePullOperation(result, [entity4, entity5, entity6]);
          }).then(function () {
            return deltaNetworkStore.save(updatedEntity);
          }).then(function () {
            return deltaStoreToTest.pull(query);
          }).then(function (result) {
            return validateNewPullOperation(result, [updatedEntity], []);
          }).then(function () {
            return done();
          });
        })["catch"](done);
      });
      it('should return correct number of items with query with deleted item', function (done) {
        var entity4 = utilities.getEntity(utilities.randomString(), 'queryValue');
        var entity5 = utilities.getEntity(utilities.randomString(), 'queryValue');
        var entity6 = utilities.getEntity(utilities.randomString(), 'queryValue');
        var query = new Kinvey.Query();
        query.equalTo('textField', 'queryValue');
        deltaNetworkStore.save(entity4).then(function () {
          return deltaNetworkStore.save(entity5);
        }).then(function () {
          return deltaNetworkStore.save(entity6);
        }).then(function () {
          return deltaStoreToTest.pull(query).then(function (result) {
            return validatePullOperation(result, [entity4, entity5, entity6]);
          }).then(function () {
            return deltaNetworkStore.removeById(entity5._id);
          }).then(function () {
            return deltaStoreToTest.pull(query);
          }).then(function (result) {
            return validateNewPullOperation(result, [], [entity5]);
          }).then(function () {
            return done();
          });
        })["catch"](done);
      });
      it('should not use deltaset with skip and limit query and should not record X-Kinvey-Request-Start', function (done) {
        var entity4 = utilities.getEntity(utilities.randomString(), 'queryValue', 1);
        var entity5 = utilities.getEntity(utilities.randomString(), 'queryValue', 2);
        var entity6 = utilities.getEntity(utilities.randomString(), 'queryValue', 3);
        var query = new Kinvey.Query();
        query.ascending('numberField');
        query.limit = 1;
        query.skip = 1;
        query.equalTo('textField', 'queryValue');
        var queryWithoutModifiers = new Kinvey.Query();
        queryWithoutModifiers.equalTo('textField', 'queryValue');
        deltaNetworkStore.save(entity4).then(function () {
          return deltaNetworkStore.save(entity5);
        }).then(function () {
          return deltaNetworkStore.save(entity6);
        }).then(function () {
          return deltaStoreToTest.pull(queryWithoutModifiers);
        }).then(function (result) {
          return validatePullOperation(result, [entity4, entity5, entity6]);
        }).then(function () {
          return deltaNetworkStore.removeById(entity4._id);
        }).then(function () {
          return deltaStoreToTest.pull(query);
        }).then(function (result) {
          return validatePullOperation(result, [entity6]);
        }).then(function () {
          return deltaStoreToTest.pull(query);
        }).then(function (result) {
          return validatePullOperation(result, [entity6]);
        }).then(function () {
          return deltaStoreToTest.pull(queryWithoutModifiers);
        }).then(function (result) {
          return validateNewPullOperation(result, [], [entity4]);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      it('limit and skip query should not delete data', function (done) {
        var onNextSpy = _sinon["default"].spy();

        var query = new Kinvey.Query();
        query.limit = 2;
        query.skip = 1;
        deltaNetworkStore.save(entity3).then(function () {
          return deltaStoreToTest.pull();
        }).then(function (result) {
          return validatePullOperation(result, [entity1, entity2, entity3]);
        }).then(function () {
          return deltaStoreToTest.pull(query);
        }).then(function (result) {
          return validatePullOperation(result, [entity2, entity3]);
        }).then(function () {
          return deltaStoreToTest.pull();
        }).then(function (result) {
          return validateNewPullOperation(result, [], []);
        }).then(function () {
          syncStore.find().subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(Kinvey.DataStoreType.Sync, onNextSpy, [entity1, entity2, entity3], [], true);
              done();
            } catch (error) {
              done(error);
            }
          });
        })["catch"](done);
      });
    });
    describe('sync', function () {
      var dataStoreType = currentDataStoreType;
      var entity1 = utilities.getEntity(utilities.randomString());
      var entity2 = utilities.getEntity(utilities.randomString());
      var entity3 = utilities.getEntity(utilities.randomString());
      var createdUserIds = [];
      var deltaStoreToTest;
      var taggedDeltaStoreToTest;
      before(function () {
        deltaStoreToTest = Kinvey.DataStore.collection(deltaCollectionName, currentDataStoreType, {
          useDeltaSet: true
        });
        taggedDeltaStoreToTest = Kinvey.DataStore.collection(deltaCollectionName, currentDataStoreType, {
          useDeltaSet: true,
          tag: tagStore
        });
      });
      before(function (done) {
        utilities.cleanUpAppData(deltaCollectionName, createdUserIds).then(function () {
          return Kinvey.User.signup();
        }).then(function (user) {
          createdUserIds.push(user.data._id);
          done();
        })["catch"](done);
      });
      beforeEach(function (done) {
        utilities.cleanUpCollectionData(deltaCollectionName).then(function () {
          return deltaNetworkStore.save(entity1);
        }).then(function () {
          return deltaNetworkStore.save(entity2);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      after(function (done) {
        utilities.cleanUpAppData(deltaCollectionName, createdUserIds).then(function () {
          return done();
        })["catch"](done);
      });
      it('should return correct number of items without changes', function (done) {
        deltaStoreToTest.sync().then(function (result) {
          return validatePullOperation(result.pull, [entity1, entity2]);
        }).then(function () {
          return deltaStoreToTest.pull();
        }).then(function (result) {
          return validateNewPullOperation(result, [], []);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      it('should return correct number of items with disabled deltaset', function (done) {
        var deisabledDeltaSetStore = currentDataStoreType === Kinvey.DataStoreType.Cache ? cacheStore : syncStore;
        deisabledDeltaSetStore.sync().then(function (result) {
          return validatePullOperation(result.pull, [entity1, entity2]);
        }).then(function () {
          return deisabledDeltaSetStore.sync();
        }).then(function (result) {
          return validatePullOperation(result.pull, [entity1, entity2]);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      it('should return correct number of items with tagged dataStore', function (done) {
        var onNextSpy = _sinon["default"].spy();

        syncStore.save(entity1).then(function () {
          return taggedDeltaStoreToTest.sync();
        }).then(function (result) {
          return validatePullOperation(result.pull, [entity1, entity2], 2, tagStore);
        }).then(function () {
          return deltaNetworkStore.save(entity3);
        }).then(function () {
          return taggedDeltaStoreToTest.sync();
        }).then(function (result) {
          return validateNewPullOperation(result.pull, [entity3], [], tagStore);
        }).then(function () {
          return deltaNetworkStore.removeById(entity1._id);
        }).then(function () {
          return taggedDeltaStoreToTest.sync();
        }).then(function (result) {
          validateNewPullOperation(result.pull, [], [entity1], tagStore);
        }).then(function () {
          syncStore.find().subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(Kinvey.DataStoreType.Sync, onNextSpy, [entity1]);
              done();
            } catch (error) {
              done(error);
            }
          });
        })["catch"](done);
      });
      it('should return correct number of items with created item', function (done) {
        var entity4 = utilities.getEntity(utilities.randomString());
        var entity5 = utilities.getEntity(utilities.randomString());
        deltaStoreToTest.sync().then(function (result) {
          return validatePullOperation(result.pull, [entity1, entity2]);
        }).then(function () {
          return deltaNetworkStore.save(entity3);
        }).then(function () {
          return deltaStoreToTest.sync();
        }).then(function (result) {
          return validateNewPullOperation(result.pull, [entity3], []);
        }).then(function () {
          return deltaNetworkStore.save(entity4);
        }).then(function () {
          return deltaNetworkStore.save(entity5);
        }).then(function () {
          return deltaStoreToTest.sync();
        }).then(function (result) {
          return validateNewPullOperation(result.pull, [entity4, entity5], []);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      it('should return correct number of items with created item with 3rd request', function (done) {
        var entity4 = utilities.getEntity(utilities.randomString());
        deltaStoreToTest.sync().then(function (result) {
          return validatePullOperation(result.pull, [entity1, entity2]);
        }).then(function () {
          return deltaNetworkStore.save(entity3);
        }).then(function () {
          return deltaStoreToTest.sync();
        }).then(function (result) {
          return validateNewPullOperation(result.pull, [entity3], []);
        }).then(function () {
          return deltaNetworkStore.save(entity4);
        }).then(function () {
          return deltaStoreToTest.sync();
        }).then(function (result) {
          return validateNewPullOperation(result.pull, [entity4], []);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      it('should return correct number of items with auto-pagination', function (done) {
        deltaStoreToTest.sync(new Kinvey.Query(), {
          autoPagination: true
        }).then(function (result) {
          return validatePullOperation(result.pull, [entity1, entity2]);
        }).then(function () {
          return deltaNetworkStore.save(entity3);
        }).then(function () {
          return deltaStoreToTest.sync(new Kinvey.Query(), {
            autoPagination: true
          });
        }).then(function (result) {
          return validateNewPullOperation(result.pull, [entity3], []);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      it('should return correct number of items with auto-pagination and skip and limit', function (done) {
        var query = new Kinvey.Query();
        query.skip = 1;
        query.limit = 2;
        deltaStoreToTest.sync(query, {
          autoPagination: true
        }).then(function (result) {
          return validatePullOperation(result.pull, [entity1, entity2]);
        }).then(function () {
          return deltaNetworkStore.save(entity3);
        }).then(function () {
          return deltaStoreToTest.sync(query, {
            autoPagination: true
          });
        }).then(function (result) {
          return validateNewPullOperation(result.pull, [entity1, entity2, entity3], []);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      it('should return correct number of items with tagged dataStore', function (done) {
        var onNextSpy = _sinon["default"].spy();

        syncStore.save(entity1).then(function () {
          return taggedDeltaStoreToTest.sync();
        }).then(function (result) {
          return validatePullOperation(result.pull, [entity1, entity2], 2, tagStore);
        }).then(function () {
          return deltaNetworkStore.save(entity3);
        }).then(function () {
          return taggedDeltaStoreToTest.sync();
        }).then(function (result) {
          return validateNewPullOperation(result.pull, [entity3], [], tagStore);
        }).then(function () {
          return deltaNetworkStore.removeById(entity1._id);
        }).then(function () {
          return taggedDeltaStoreToTest.sync();
        }).then(function (result) {
          validateNewPullOperation(result.pull, [], [entity1], tagStore);
        }).then(function () {
          syncStore.find().subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(Kinvey.DataStoreType.Sync, onNextSpy, [entity1]);
              done();
            } catch (error) {
              done(error);
            }
          });
        })["catch"](done);
      });
      it('should return correct number of items with deleted item', function (done) {
        deltaNetworkStore.save(entity3).then(function () {
          return deltaStoreToTest.sync();
        }).then(function (result) {
          return validatePullOperation(result.pull, [entity1, entity2, entity3]);
        }).then(function () {
          return deltaNetworkStore.removeById(entity1._id);
        }).then(function () {
          return deltaStoreToTest.sync();
        }).then(function (result) {
          return validateNewPullOperation(result.pull, [], [entity1]);
        }).then(function () {
          return deltaNetworkStore.removeById(entity2._id);
        }).then(function () {
          return deltaNetworkStore.removeById(entity3._id);
        }).then(function () {
          return deltaStoreToTest.sync();
        }).then(function (result) {
          return validateNewPullOperation(result.pull, [], [entity2, entity3]);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      it('should return correct number of items with updated item', function (done) {
        var updatedEntity = _lodash["default"].clone(entity2);

        var updatedEntity1 = _lodash["default"].clone(entity1);

        var updatedEntity2 = _lodash["default"].clone(entity3);

        updatedEntity.textField = utilities.randomString();
        updatedEntity1.textField = utilities.randomString();
        updatedEntity2.textField = utilities.randomString();
        deltaNetworkStore.save(entity3).then(function () {
          return deltaStoreToTest.sync();
        }).then(function (result) {
          return validatePullOperation(result.pull, [entity1, entity2, entity3]);
        }).then(function () {
          return deltaNetworkStore.save(updatedEntity);
        }).then(function () {
          return deltaStoreToTest.sync();
        }).then(function (result) {
          return validateNewPullOperation(result.pull, [updatedEntity], []);
        }).then(function () {
          return deltaNetworkStore.save(updatedEntity1);
        }).then(function () {
          return deltaNetworkStore.save(updatedEntity2);
        }).then(function () {
          return deltaStoreToTest.sync();
        }).then(function (result) {
          return validateNewPullOperation(result.pull, [updatedEntity1, updatedEntity2], []);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      it('should return correct number of items with updated and deleted item', function (done) {
        var entity4 = utilities.getEntity(utilities.randomString());

        var updatedEntity = _lodash["default"].clone(entity2);

        var updatedEntity1 = _lodash["default"].clone(entity1);

        var updatedEntity2 = _lodash["default"].clone(entity3);

        updatedEntity.textField = utilities.randomString();
        updatedEntity1.textField = utilities.randomString();
        updatedEntity2.textField = utilities.randomString();
        deltaNetworkStore.save(entity3).then(function () {
          return deltaNetworkStore.save(entity4);
        }).then(function () {
          return deltaStoreToTest.sync();
        }).then(function (result) {
          return validatePullOperation(result.pull, [entity1, entity2, entity3, entity4]);
        }).then(function () {
          return deltaNetworkStore.save(updatedEntity);
        }).then(function () {
          return deltaNetworkStore.removeById(entity1._id);
        }).then(function () {
          return deltaStoreToTest.sync();
        }).then(function (result) {
          return validateNewPullOperation(result.pull, [updatedEntity], [entity1]);
        }).then(function () {
          return deltaNetworkStore.save(updatedEntity2);
        }).then(function () {
          return deltaNetworkStore.removeById(updatedEntity._id);
        }).then(function () {
          return deltaNetworkStore.removeById(entity4._id);
        }).then(function () {
          return deltaStoreToTest.sync();
        }).then(function (result) {
          return validateNewPullOperation(result.pull, [updatedEntity2], [updatedEntity, entity4]);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      it('should return correct number of items with query with updated item', function (done) {
        var entity4 = utilities.getEntity(utilities.randomString(), 'queryValue');
        var entity5 = utilities.getEntity(utilities.randomString(), 'queryValue');
        var entity6 = utilities.getEntity(utilities.randomString(), 'queryValue');

        var updatedEntity = _lodash["default"].clone(entity5);

        updatedEntity.numberField = 5;
        var query = new Kinvey.Query();
        query.equalTo('textField', 'queryValue');
        deltaNetworkStore.save(entity4).then(function () {
          return deltaNetworkStore.save(entity5);
        }).then(function () {
          return deltaNetworkStore.save(entity6);
        }).then(function () {
          return deltaStoreToTest.sync(query).then(function (result) {
            return validatePullOperation(result.pull, [entity4, entity5, entity6]);
          }).then(function () {
            return deltaNetworkStore.save(updatedEntity);
          }).then(function () {
            return deltaStoreToTest.sync(query);
          }).then(function (result) {
            return validateNewPullOperation(result.pull, [updatedEntity], []);
          }).then(function () {
            return done();
          });
        })["catch"](done);
      });
      it('should return correct number of items with query with deleted item', function (done) {
        var entity4 = utilities.getEntity(utilities.randomString(), 'queryValue');
        var entity5 = utilities.getEntity(utilities.randomString(), 'queryValue');
        var entity6 = utilities.getEntity(utilities.randomString(), 'queryValue');
        var query = new Kinvey.Query();
        query.equalTo('textField', 'queryValue');
        deltaNetworkStore.save(entity4).then(function () {
          return deltaNetworkStore.save(entity5);
        }).then(function () {
          return deltaNetworkStore.save(entity6);
        }).then(function () {
          return deltaStoreToTest.sync(query).then(function (result) {
            return validatePullOperation(result.pull, [entity4, entity5, entity6]);
          }).then(function () {
            return deltaNetworkStore.removeById(entity5._id);
          }).then(function () {
            return deltaStoreToTest.sync(query);
          }).then(function (result) {
            return validateNewPullOperation(result.pull, [], [entity5]);
          }).then(function () {
            return done();
          });
        })["catch"](done);
      });
      it('should not use deltaset with skip and limit query and should not record X-Kinvey-Request-Start', function (done) {
        var entity4 = utilities.getEntity(utilities.randomString(), 'queryValue', 1);
        var entity5 = utilities.getEntity(utilities.randomString(), 'queryValue', 2);
        var entity6 = utilities.getEntity(utilities.randomString(), 'queryValue', 3);
        var query = new Kinvey.Query();
        query.ascending('numberField');
        query.limit = 1;
        query.skip = 1;
        query.equalTo('textField', 'queryValue');
        var queryWithoutModifiers = new Kinvey.Query();
        queryWithoutModifiers.equalTo('textField', 'queryValue');
        deltaNetworkStore.save(entity4).then(function () {
          return deltaNetworkStore.save(entity5);
        }).then(function () {
          return deltaNetworkStore.save(entity6);
        }).then(function () {
          return deltaStoreToTest.sync(queryWithoutModifiers);
        }).then(function (result) {
          return validatePullOperation(result.pull, [entity4, entity5, entity6]);
        }).then(function () {
          return deltaNetworkStore.removeById(entity4._id);
        }).then(function () {
          return deltaStoreToTest.sync(query);
        }).then(function (result) {
          return validatePullOperation(result.pull, [entity6]);
        }).then(function () {
          return deltaStoreToTest.sync(query);
        }).then(function (result) {
          return validatePullOperation(result.pull, [entity6]);
        }).then(function () {
          return deltaStoreToTest.sync(queryWithoutModifiers);
        }).then(function (result) {
          return validateNewPullOperation(result.pull, [], [entity4]);
        }).then(function () {
          return done();
        })["catch"](done);
      });
    });
    conditionalDescribe('find', function () {
      var dataStoreType = currentDataStoreType;
      var entity1 = utilities.getEntity(utilities.randomString());
      var entity2 = utilities.getEntity(utilities.randomString());
      var entity3 = utilities.getEntity(utilities.randomString());
      var createdUserIds = [];
      var deltaStoreToTest;
      before(function () {
        deltaStoreToTest = Kinvey.DataStore.collection(deltaCollectionName, currentDataStoreType, {
          useDeltaSet: true
        });
      });
      before(function (done) {
        utilities.cleanUpAppData(deltaCollectionName, createdUserIds).then(function () {
          return Kinvey.User.signup();
        }).then(function (user) {
          createdUserIds.push(user.data._id);
          done();
        })["catch"](done);
      });
      beforeEach(function (done) {
        utilities.cleanUpCollectionData(deltaCollectionName).then(function () {
          return deltaStoreToTest.save(entity1);
        }).then(function () {
          return deltaNetworkStore.save(entity2);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      after(function (done) {
        utilities.cleanUpAppData(deltaCollectionName, createdUserIds).then(function () {
          return done();
        })["catch"](done);
      });
      it('should return correct number of items without changes', function (done) {
        var onNextSpy = _sinon["default"].spy();

        deltaStoreToTest.find().subscribe(onNextSpy, done, function () {
          try {
            utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity1], [entity1, entity2], true);

            var anotherSpy = _sinon["default"].spy();

            deltaStoreToTest.find().subscribe(anotherSpy, done, function () {
              try {
                // utilities.validateReadResult(currentDataStoreType, anotherSpy, [entity1, entity2], [entity1, entity2], true);
                done();
              } catch (error) {
                done(error);
              }
            });
          } catch (error) {
            done(error);
          }
        });
      });
      it('should return correct number of items with disabled deltaset', function (done) {
        var deisabledDeltaSetStore = cacheStore;

        var onNextSpy = _sinon["default"].spy();

        deisabledDeltaSetStore.find().subscribe(onNextSpy, done, function () {
          try {
            utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity1], [entity1, entity2], true);

            var anotherSpy = _sinon["default"].spy();

            deisabledDeltaSetStore.find().subscribe(anotherSpy, done, function () {
              try {
                utilities.validateReadResult(currentDataStoreType, anotherSpy, [entity1, entity2], [entity1, entity2], true);
                done();
              } catch (error) {
                done(error);
              }
            });
          } catch (error) {
            done(error);
          }
        });
      });
      it('should return correct number of items with created item', function (done) {
        var onNextSpy = _sinon["default"].spy();

        deltaStoreToTest.find().subscribe(onNextSpy, done, function () {
          try {
            utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity1], [entity1, entity2], true);

            var anotherSpy = _sinon["default"].spy();

            deltaNetworkStore.save(entity3).then(function () {
              return deltaStoreToTest.find().subscribe(anotherSpy, done, function () {
                try {
                  utilities.validateReadResult(currentDataStoreType, anotherSpy, [entity1, entity2], [entity1, entity2, entity3], true);
                  done();
                } catch (error) {
                  done(error);
                }
              });
            });
          } catch (error) {
            done(error);
          }
        });
      });
      it('should return correct number of items with created item with third request', function (done) {
        var entity4 = utilities.getEntity(utilities.randomString(), 'queryValue');

        var onNextSpy = _sinon["default"].spy();

        deltaStoreToTest.find().subscribe(onNextSpy, done, function () {
          try {
            utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity1], [entity1, entity2], true);

            var anotherSpy = _sinon["default"].spy();

            deltaNetworkStore.save(entity3).then(function () {
              return deltaStoreToTest.find().subscribe(anotherSpy, done, function () {
                try {
                  utilities.validateReadResult(currentDataStoreType, anotherSpy, [entity1, entity2], [entity1, entity2, entity3], true);

                  var yetAnotherSpy = _sinon["default"].spy();

                  deltaNetworkStore.save(entity4).then(function () {
                    return deltaStoreToTest.find().subscribe(yetAnotherSpy, done, function () {
                      try {
                        utilities.validateReadResult(currentDataStoreType, yetAnotherSpy, [entity1, entity2, entity3], [entity1, entity2, entity3, entity4], true);
                        done();
                      } catch (error) {
                        done(error);
                      }
                    });
                  });
                } catch (error) {
                  done(error);
                }
              });
            });
          } catch (error) {
            done(error);
          }
        });
      });
      it('should return correct number of items with auto-pagination', function (done) {
        var onNextSpy = _sinon["default"].spy();

        deltaStoreToTest.find(new Kinvey.Query(), {
          autoPagination: true
        }).subscribe(onNextSpy, done, function () {
          try {
            utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity1], [entity1, entity2], true);

            var anotherSpy = _sinon["default"].spy();

            deltaNetworkStore.save(entity3).then(function () {
              return deltaStoreToTest.find(new Kinvey.Query(), {
                autoPagination: true
              }).subscribe(anotherSpy, done, function () {
                try {
                  utilities.validateReadResult(currentDataStoreType, anotherSpy, [entity1, entity2], [entity1, entity2, entity3], true);
                  done();
                } catch (error) {
                  done(error);
                }
              });
            });
          } catch (error) {
            done(error);
          }
        });
      });
      it('should return correct number of items with deleted item', function (done) {
        var entity4 = utilities.getEntity(utilities.randomString());

        var onNextSpy = _sinon["default"].spy();

        deltaNetworkStore.save(entity3).then(function () {
          return deltaNetworkStore.save(entity4);
        }).then(function () {
          return deltaStoreToTest.find().subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity1], [entity1, entity2, entity3, entity4], true);
              onNextSpy.resetHistory();
              deltaNetworkStore.removeById(entity1._id).then(function () {
                return deltaStoreToTest.find().subscribe(onNextSpy, done, function () {
                  try {
                    utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity1, entity2, entity3, entity4], [entity2, entity3, entity4], true);

                    var secondSpy = _sinon["default"].spy();

                    deltaNetworkStore.removeById(entity2._id).then(function () {
                      return deltaNetworkStore.removeById(entity3._id);
                    }).then(function () {
                      return deltaStoreToTest.find().subscribe(secondSpy, done, function () {
                        try {
                          utilities.validateReadResult(currentDataStoreType, secondSpy, [entity2, entity3, entity4], [entity4], true);
                          onNextSpy.resetHistory();
                          syncStore.find().subscribe(onNextSpy, done, function () {
                            try {
                              utilities.validateReadResult(Kinvey.DataStoreType.Sync, onNextSpy, [entity4]);
                              done();
                            } catch (error) {
                              done(error);
                            }
                          });
                        } catch (error) {
                          done(error);
                        }
                      });
                    })["catch"](done);
                  } catch (error) {
                    done(error);
                  }
                });
              });
            } catch (error) {
              done(error);
            }
          });
        })["catch"](done);
      });
      it('should return correct number of items with updated item', function (done) {
        var updatedEntity = _lodash["default"].clone(entity2);

        updatedEntity.textField = utilities.randomString();

        var onNextSpy = _sinon["default"].spy();

        deltaStoreToTest.find().subscribe(onNextSpy, done, function () {
          try {
            utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity1], [entity1, entity2], true);

            var anotherSpy = _sinon["default"].spy();

            deltaNetworkStore.save(updatedEntity).then(function () {
              return deltaStoreToTest.find().subscribe(anotherSpy, done, function () {
                try {
                  utilities.validateReadResult(currentDataStoreType, anotherSpy, [entity1, entity2], [entity1, updatedEntity], true);
                  done();
                } catch (error) {
                  done(error);
                }
              });
            });
          } catch (error) {
            done(error);
          }
        });
      });
      it('should return correct number of items with updated and deleted item', function (done) {
        var updatedEntity = _lodash["default"].clone(entity2);

        updatedEntity.textField = utilities.randomString();

        var onNextSpy = _sinon["default"].spy();

        deltaStoreToTest.find().subscribe(onNextSpy, done, function () {
          try {
            utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity1], [entity1, entity2], true);

            var anotherSpy = _sinon["default"].spy();

            deltaNetworkStore.save(updatedEntity).then(function () {
              return deltaNetworkStore.removeById(entity1._id);
            }).then(function () {
              return deltaStoreToTest.find().subscribe(anotherSpy, done, function () {
                try {
                  utilities.validateReadResult(currentDataStoreType, anotherSpy, [entity1, entity2], [updatedEntity], true);
                  done();
                } catch (error) {
                  done(error);
                }
              });
            });
          } catch (error) {
            done(error);
          }
        });
      });
      it('should return correct number of items with query with updated item', function (done) {
        var entity4 = utilities.getEntity(utilities.randomString(), 'queryValue');
        var entity5 = utilities.getEntity(utilities.randomString(), 'queryValue');
        var entity6 = utilities.getEntity(utilities.randomString(), 'queryValue');

        var updatedEntity = _lodash["default"].clone(entity5);

        updatedEntity.numberField = 5;
        var query = new Kinvey.Query();
        query.equalTo('textField', 'queryValue');

        var onNextSpy = _sinon["default"].spy();

        deltaNetworkStore.save(entity4).then(function () {
          return deltaStoreToTest.save(entity5);
        }).then(function () {
          return deltaNetworkStore.save(entity6);
        }).then(function () {
          return deltaStoreToTest.find(query).subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity5], [entity4, entity5, entity6], true);

              var anotherSpy = _sinon["default"].spy();

              deltaNetworkStore.save(updatedEntity).then(function () {
                return deltaStoreToTest.find(query).subscribe(anotherSpy, done, function () {
                  try {
                    utilities.validateReadResult(currentDataStoreType, anotherSpy, [entity4, entity5, entity6], [entity4, updatedEntity, entity6], true);
                    done();
                  } catch (error) {
                    done(error);
                  }
                });
              });
            } catch (error) {
              done(error);
            }
          });
        });
      });
      it('should return correct number of items with query with deleted item', function (done) {
        var entity4 = utilities.getEntity(utilities.randomString(), 'queryValue');
        var entity5 = utilities.getEntity(utilities.randomString(), 'queryValue');
        var entity6 = utilities.getEntity(utilities.randomString(), 'queryValue');

        var updatedEntity = _lodash["default"].clone(entity5);

        updatedEntity.numberField = 5;
        var query = new Kinvey.Query();
        query.equalTo('textField', 'queryValue');

        var onNextSpy = _sinon["default"].spy();

        deltaNetworkStore.save(entity4).then(function () {
          return deltaStoreToTest.save(entity5);
        }).then(function () {
          return deltaNetworkStore.save(entity6);
        }).then(function () {
          return deltaStoreToTest.find(query).subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity5], [entity4, entity5, entity6], true);

              var anotherSpy = _sinon["default"].spy();

              deltaNetworkStore.removeById(entity5._id).then(function () {
                return deltaStoreToTest.find(query).subscribe(anotherSpy, done, function () {
                  try {
                    utilities.validateReadResult(currentDataStoreType, anotherSpy, [entity4, entity5, entity6], [entity4, entity6], true);
                    done();
                  } catch (error) {
                    done(error);
                  }
                });
              });
            } catch (error) {
              done(error);
            }
          });
        });
      });
    });
    describe('when switching stores', function () {
      var dataStoreType = currentDataStoreType;
      var entity1 = utilities.getEntity(utilities.randomString());
      var entity2 = utilities.getEntity(utilities.randomString());
      var entity3 = utilities.getEntity(utilities.randomString());
      var entity4 = utilities.getEntity(utilities.randomString());
      var createdUserIds = [];
      var deltaStoreToTest;
      before(function () {
        deltaStoreToTest = Kinvey.DataStore.collection(deltaCollectionName, currentDataStoreType, {
          useDeltaSet: true
        });
      });
      before(function (done) {
        utilities.cleanUpAppData(deltaCollectionName, createdUserIds).then(function () {
          return Kinvey.User.signup();
        }).then(function (user) {
          createdUserIds.push(user.data._id);
          done();
        })["catch"](done);
      });
      beforeEach(function (done) {
        utilities.cleanUpCollectionData(deltaCollectionName).then(function () {
          return deltaNetworkStore.save(entity1);
        }).then(function () {
          return deltaNetworkStore.save(entity2);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      after(function (done) {
        utilities.cleanUpAppData(deltaCollectionName, createdUserIds).then(function () {
          return done();
        })["catch"](done);
      });

      if (currentDataStoreType === Kinvey.DataStoreType.Sync) {
        it('should use deltaset consistently when switching from sync to cache', function (done) {
          deltaStoreToTest.pull().then(function (result) {
            return validatePullOperation(result, [entity1, entity2]);
          }).then(function () {
            return deltaNetworkStore.save(entity3);
          }).then(function () {
            return deltaStoreToTest.pull();
          }).then(function (result) {
            return validateNewPullOperation(result, [entity3], []);
          }).then(function () {
            return deltaNetworkStore.save(entity4);
          }).then(function () {
            return deltaCacheStore.pull();
          }).then(function (result) {
            return validateNewPullOperation(result, [entity4], []);
          }).then(function () {
            return done();
          })["catch"](done);
        });
      }

      if (currentDataStoreType === Kinvey.DataStoreType.Cache) {
        it('should use deltaset consistently when switching from cache to sync', function (done) {
          deltaStoreToTest.pull().then(function (result) {
            return validatePullOperation(result, [entity1, entity2]);
          }).then(function () {
            return deltaNetworkStore.save(entity3);
          }).then(function () {
            return deltaStoreToTest.pull();
          }).then(function (result) {
            return validateNewPullOperation(result, [entity3], []);
          }).then(function () {
            return deltaNetworkStore.save(entity4);
          }).then(function () {
            return deltaSyncStore.pull();
          }).then(function (result) {
            return validateNewPullOperation(result, [entity4], []);
          }).then(function () {
            return done();
          })["catch"](done);
        });
      }

      if (currentDataStoreType === Kinvey.DataStoreType.Sync) {
        it('should use deltaset consistently when switching from network to sync', function (done) {
          var onNextSpy = _sinon["default"].spy();

          deltaNetworkStore.find().subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(Kinvey.DataStoreType.Network, onNextSpy, [entity1], [entity1, entity2], true);
              deltaNetworkStore.save(entity3).then(function () {
                return deltaStoreToTest.pull();
              }).then(function (result) {
                return validatePullOperation(result, [entity1, entity2, entity3]);
              }).then(function () {
                return deltaNetworkStore.save(entity4);
              }).then(function () {
                return deltaSyncStore.pull();
              }).then(function (result) {
                return validateNewPullOperation(result, [entity4], []);
              }).then(function () {
                return done();
              })["catch"](done);
            } catch (error) {
              done(error);
            }
          });
        });
      }

      if (currentDataStoreType === Kinvey.DataStoreType.Cache) {
        it('should use deltaset consistently when switching from network to cache', function (done) {
          var onNextSpy = _sinon["default"].spy();

          deltaNetworkStore.find().subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(Kinvey.DataStoreType.Network, onNextSpy, [entity1], [entity1, entity2], true);
              deltaNetworkStore.save(entity3).then(function () {
                return deltaStoreToTest.pull();
              }).then(function (result) {
                return validatePullOperation(result, [entity1, entity2, entity3]);
              }).then(function () {
                return deltaNetworkStore.save(entity4);
              }).then(function () {
                return deltaSyncStore.pull();
              }).then(function (result) {
                return validateNewPullOperation(result, [entity4], []);
              }).then(function () {
                return done();
              })["catch"](done);
            } catch (error) {
              done(error);
            }
          });
        });
      }
    });
    describe('when clearing cache', function () {
      var dataStoreType = currentDataStoreType;
      var entity1 = utilities.getEntity(utilities.randomString());
      var entity2 = utilities.getEntity(utilities.randomString());
      var entity3 = utilities.getEntity(utilities.randomString());
      var entity4 = utilities.getEntity(utilities.randomString());
      var createdUserIds = [];
      var deltaStoreToTest;
      before(function () {
        deltaStoreToTest = Kinvey.DataStore.collection(deltaCollectionName, currentDataStoreType, {
          useDeltaSet: true
        });
      });
      before(function (done) {
        utilities.cleanUpAppData(deltaCollectionName, createdUserIds).then(function () {
          return Kinvey.User.signup();
        }).then(function (user) {
          createdUserIds.push(user.data._id);
          done();
        })["catch"](done);
      });
      beforeEach(function (done) {
        utilities.cleanUpCollectionData(deltaCollectionName).then(function () {
          return deltaNetworkStore.save(entity1);
        }).then(function () {
          return deltaNetworkStore.save(entity2);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      after(function (done) {
        utilities.cleanUpAppData(deltaCollectionName, createdUserIds).then(function () {
          return done();
        })["catch"](done);
      });
      it('should send regular GET after clearCache()', function (done) {
        deltaStoreToTest.pull().then(function (result) {
          return validatePullOperation(result, [entity1, entity2]);
        }).then(function () {
          return deltaNetworkStore.save(entity3);
        }).then(function () {
          return deltaStoreToTest.pull();
        }).then(function (result) {
          return validateNewPullOperation(result, [entity3], []);
        }).then(function () {
          return Kinvey.DataStore.clearCache();
        }).then(function () {
          return deltaNetworkStore.save(entity4);
        }).then(function () {
          return deltaStoreToTest.pull();
        }).then(function (result) {
          return validatePullOperation(result, [entity1, entity2, entity3, entity4]);
        }).then(function () {
          return deltaNetworkStore.removeById(entity3._id);
        }).then(function () {
          return deltaStoreToTest.pull();
        }).then(function (result) {
          return validateNewPullOperation(result, [], [entity3]);
        }).then(function () {
          return done();
        })["catch"](function (error) {
          return done(error);
        });
      });
    });
    describe('error handling', function () {
      var dataStoreType = currentDataStoreType;
      var entity1 = utilities.getEntity(utilities.randomString());
      var entity2 = utilities.getEntity(utilities.randomString());
      var entity3 = utilities.getEntity(utilities.randomString());
      var entity4 = utilities.getEntity(utilities.randomString());
      var createdUserIds = [];
      var deltaStoreToTest;
      var nonDeltaStoreToTest;
      var nonDeltaNetworkStore;
      before(function () {
        deltaStoreToTest = Kinvey.DataStore.collection(deltaCollectionName, currentDataStoreType, {
          useDeltaSet: true
        });
        nonDeltaStoreToTest = Kinvey.DataStore.collection(collectionWithoutDelta, currentDataStoreType, {
          useDeltaSet: true
        });
        nonDeltaNetworkStore = Kinvey.DataStore.collection(collectionWithoutDelta, Kinvey.DataStoreType.Network);
      });
      before(function (done) {
        utilities.cleanUpAppData(deltaCollectionName, createdUserIds).then(function () {
          return utilities.cleanUpAppData(collectionWithoutDelta, createdUserIds);
        }).then(function () {
          return Kinvey.User.signup();
        }).then(function (user) {
          createdUserIds.push(user.data._id);
          done();
        })["catch"](done);
      });
      beforeEach(function (done) {
        utilities.cleanUpCollectionData(deltaCollectionName).then(function () {
          return utilities.cleanUpCollectionData(collectionWithoutDelta);
        }).then(function () {
          return utilities.cleanUpCollectionData(deltaCollectionName);
        }).then(function () {
          return nonDeltaNetworkStore.save(entity1);
        }).then(function () {
          return nonDeltaNetworkStore.save(entity2);
        }).then(function () {
          return deltaNetworkStore.save(entity1);
        }).then(function () {
          return deltaNetworkStore.save(entity2);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      after(function (done) {
        utilities.cleanUpAppData(deltaCollectionName, createdUserIds).then(function () {
          return done();
        })["catch"](done);
      });
      it('should send regular GET after failure for missing configuration', function (done) {
        nonDeltaStoreToTest.pull().then(function (result) {
          return validatePullOperation(result, [entity1, entity2], null, null, collectionWithoutDelta);
        }).then(function () {
          return nonDeltaNetworkStore.save(entity3);
        }).then(function () {
          return nonDeltaStoreToTest.pull();
        }).then(function (result) {
          return validatePullOperation(result, [entity1, entity2, entity3], null, null, collectionWithoutDelta);
        }).then(function () {
          return nonDeltaNetworkStore.save(entity4);
        }).then(function () {
          return nonDeltaStoreToTest.pull();
        }).then(function (result) {
          return validatePullOperation(result, [entity1, entity2, entity3, entity4], null, null, collectionWithoutDelta);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      it.skip('should send regular GET after fail for outdated since param', function (done) {
        var db = window.openDatabase(process.env.APP_KEY, 1, 'Kinvey Cache', 20000);
        deltaStoreToTest.pull().then(function (result) {
          return validatePullOperation(result, [entity1, entity2]);
        }).then(function () {
          db.transaction(function (tx) {
            try {
              tx.executeSql("SELECT * FROM _QueryCache WHERE value LIKE '%\"query\":\"\"%'", [], function (tx1, resultSet) {
                try {
                  var item = resultSet.rows[0];
                  var queryParsed = JSON.parse(item.value);
                  var lastRequest = queryParsed.lastRequest;
                  var lastRequestDateObject = new Date(lastRequest);
                  lastRequestDateObject.setDate(lastRequestDateObject.getDate() - 31);
                  var outdatedTimeToString = lastRequestDateObject.toISOString();
                  queryParsed.lastRequest = outdatedTimeToString;
                  tx.executeSql("UPDATE _QueryCache SET value = ? WHERE value LIKE '%\"query\":\"\"%'", [JSON.stringify(queryParsed)], function () {
                    deltaStoreToTest.pull().then(function (result) {
                      return validatePullOperation(result, [entity1, entity2]);
                    }).then(function () {
                      return done();
                    })["catch"](function (error) {
                      return done(error);
                    });
                  });
                } catch (error) {
                  done(error);
                }
              });
            } catch (error) {
              done(error);
            }
          });
        })["catch"](function (error) {
          return done(error);
        });
      });
      it.skip('with outdated since param subsequent pull should delete items in the cache', function (done) {
        var db = window.openDatabase(process.env.APP_KEY, 1, 'Kinvey Cache', 20000);
        deltaStoreToTest.pull().then(function (result) {
          return validatePullOperation(result, [entity1, entity2]);
        }).then(function () {
          return deltaNetworkStore.removeById(entity1._id);
        }).then(function () {
          db.transaction(function (tx) {
            try {
              tx.executeSql("SELECT * FROM _QueryCache WHERE value LIKE '%\"query\":\"\"%'", [], function (tx1, resultSet) {
                try {
                  var item = resultSet.rows[0];
                  var queryParsed = JSON.parse(item.value);
                  var lastRequest = queryParsed.lastRequest;
                  var lastRequestDateObject = new Date(lastRequest);
                  lastRequestDateObject.setDate(lastRequestDateObject.getDate() - 31);
                  var outdatedTimeToString = lastRequestDateObject.toISOString();
                  queryParsed.lastRequest = outdatedTimeToString;
                  tx.executeSql("UPDATE _QueryCache SET value = ? WHERE value LIKE '%\"query\":\"\"%'", [JSON.stringify(queryParsed)], function () {
                    deltaStoreToTest.pull().then(function (result) {
                      return validatePullOperation(result, [entity2]);
                    }).then(function () {
                      return done();
                    })["catch"](function (error) {
                      return done(error);
                    });
                  });
                } catch (error) {
                  done(error);
                }
              });
            } catch (error) {
              done(error);
            }
          });
        })["catch"](function (error) {
          return done(error);
        });
      });
    });
  });
});