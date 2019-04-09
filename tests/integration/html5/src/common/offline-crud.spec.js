"use strict";

require("core-js/modules/es.array.find");

require("core-js/modules/es.array.for-each");

require("core-js/modules/es.array.map");

require("core-js/modules/es.array.sort");

require("core-js/modules/es.date.to-string");

require("core-js/modules/es.function.name");

require("core-js/modules/es.object.define-property");

require("core-js/modules/es.object.get-own-property-descriptor");

require("core-js/modules/web.dom-collections.for-each");

var _chai = require("chai");

var Kinvey = _interopRequireWildcard(require("kinvey-html5-sdk"));

var utilities = _interopRequireWildcard(require("../utils"));

var externalConfig = _interopRequireWildcard(require("../config"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; return newObj; } }

var dataStoreTypes = [Kinvey.DataStoreType.Cache, Kinvey.DataStoreType.Sync];
var notFoundErrorName = 'NotFoundError';
var shouldNotBeCalledErrorMessage = 'Should not be called';
var collectionName = externalConfig.collectionName;
dataStoreTypes.forEach(function (currentDataStoreType) {
  describe("".concat(currentDataStoreType, " Store CRUD Specific Tests"), function () {
    var networkStore;
    var syncStore;
    var cacheStore;
    var storeToTest;
    var dataStoreType = currentDataStoreType;
    var entity1 = utilities.getEntity(utilities.randomString());
    var createdUserIds = [];
    before(function () {
      return Kinvey.init({
        appKey: process.env.APP_KEY,
        appSecret: process.env.APP_SECRET,
        masterSecret: process.env.MASTER_SECRET
      });
    });
    before(function (done) {
      utilities.cleanUpAppData(collectionName, createdUserIds).then(function () {
        return Kinvey.User.signup();
      }).then(function (user) {
        createdUserIds.push(user.data._id); // store for setups

        networkStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Network);
        syncStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Sync);
        cacheStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Cache); // store to test

        storeToTest = Kinvey.DataStore.collection(collectionName, dataStoreType);
        done();
      })["catch"](done);
    });
    beforeEach(function (done) {
      utilities.cleanUpCollectionData(collectionName).then(function () {
        return cacheStore.save(entity1);
      }).then(function () {
        return done();
      })["catch"](done);
    });
    after(function (done) {
      utilities.cleanUpAppData(collectionName, createdUserIds).then(function () {
        return done();
      })["catch"](done);
    });

    if (dataStoreType === Kinvey.DataStoreType.Cache) {
      describe('Cache Store specific tests', function () {
        it('find() should remove entities that no longer exist in the backend from the cache', function (done) {
          var entity = utilities.getEntity(utilities.randomString());
          storeToTest.save(entity).then(function (entity) {
            return networkStore.removeById(entity._id);
          }).then(function () {
            return storeToTest.find().toPromise();
          }).then(function () {
            return syncStore.findById(entity._id).toPromise();
          }).then(function () {
            return done(new Error(shouldNotBeCalledErrorMessage));
          })["catch"](function (error) {
            (0, _chai.expect)(error.name).to.equal(notFoundErrorName);
            syncStore.count().toPromise().then(function (count) {
              (0, _chai.expect)(count).to.equal(1);
              done();
            });
          })["catch"](done);
        });
        it('findById() should create in the cache, an entity found on the backend, but missing in the cache', function (done) {
          var entity = utilities.getEntity(utilities.randomString());
          networkStore.create(entity).then(function () {
            return storeToTest.findById(entity._id).toPromise();
          }).then(function (foundEntity) {
            (0, _chai.expect)(foundEntity).to.exist;
            return syncStore.findById(entity._id).toPromise();
          }).then(function () {
            return utilities.validateEntity(dataStoreType, collectionName, entity);
          }).then(function () {
            return cacheStore.removeById(entity._id);
          }) // remove the new entity, as it is not used elsewhere
          .then(function (result) {
            (0, _chai.expect)(result).to.deep.equal({
              count: 1
            });
            done();
          })["catch"](done);
        });
        it('findById() should remove entities that no longer exist on the backend from the cache', function (done) {
          var entity = utilities.getEntity(utilities.randomString());
          storeToTest.save(entity).then(function (entity) {
            return networkStore.removeById(entity._id);
          }).then(function () {
            return storeToTest.findById(entity._id).toPromise();
          })["catch"](function (error) {
            (0, _chai.expect)(error.name).to.equal(notFoundErrorName);
            return syncStore.findById(entity._id).toPromise();
          }).then(function () {
            done(new Error(shouldNotBeCalledErrorMessage));
          })["catch"](function (error) {
            (0, _chai.expect)(error.name).to.equal(notFoundErrorName);
            return syncStore.count().toPromise().then(function (count) {
              (0, _chai.expect)(count).to.equal(1);
              done();
            });
          })["catch"](done);
        });
        it('removeById should remove the entity from cache even if the entity is not found on the backend', function (done) {
          var entity = utilities.getEntity(utilities.randomString());
          storeToTest.save(entity).then(function (entity) {
            return networkStore.removeById(entity._id);
          }).then(function () {
            return storeToTest.removeById(entity._id);
          }).then(function (result) {
            (0, _chai.expect)(result.count).to.equal(1);
            return syncStore.findById(entity._id).toPromise();
          }).then(function () {
            return done(new Error(shouldNotBeCalledErrorMessage));
          })["catch"](function (error) {
            (0, _chai.expect)(error.name).to.equal(notFoundErrorName);
            done();
          })["catch"](done);
        });
        it('remove should remove the entity from the backend even if the entity is not found in the cache', function (done) {
          var entity = utilities.getEntity(utilities.randomString());
          var query = new Kinvey.Query();
          query.equalTo('_id', entity._id);
          storeToTest.save(entity).then(function (entity) {
            return syncStore.removeById(entity._id);
          }).then(function () {
            return storeToTest.remove(query);
          }).then(function () {
            return networkStore.findById(entity._id).toPromise();
          }).then(function () {
            return done(new Error(shouldNotBeCalledErrorMessage));
          })["catch"](function (error) {
            (0, _chai.expect)(error.name).to.equal(notFoundErrorName);
            done();
          })["catch"](done);
        });
        it('create/update should update the item in the cache with the metadata from the backend', function (done) {
          var createdEntityId;
          var initialLmtDate;
          storeToTest.save(utilities.getEntity()).then(function (result) {
            createdEntityId = result._id;
            return syncStore.findById(createdEntityId).toPromise();
          }).then(function (cachedEntity) {
            (0, _chai.expect)(cachedEntity._id).to.equal(createdEntityId);
            utilities.assertEntityMetadata(cachedEntity);
            initialLmtDate = new Date(cachedEntity._kmd.lmt);
            return storeToTest.save(cachedEntity);
          }).then(function (result) {
            (0, _chai.expect)(new Date(result._kmd.lmt)).to.be.greaterThan(initialLmtDate);
            return syncStore.findById(createdEntityId).toPromise();
          }).then(function (updatedCachedEntity) {
            (0, _chai.expect)(new Date(updatedCachedEntity._kmd.lmt)).to.be.greaterThan(initialLmtDate);
            done();
          })["catch"](done);
        });
      });
    }

    describe('clear()', function () {
      it('should remove the entities from the cache, which match the query', function (done) {
        var randomId = utilities.randomString();
        cacheStore.save({
          _id: randomId
        }).then(function () {
          var query = new Kinvey.Query();
          query.equalTo('_id', randomId);
          return storeToTest.clear(query);
        }).then(function (result) {
          (0, _chai.expect)(result.count).to.equal(1);
          return syncStore.count().toPromise();
        }).then(function (count) {
          (0, _chai.expect)(count).to.equal(1);
          return networkStore.count().toPromise();
        }).then(function (count) {
          (0, _chai.expect)(count).to.equal(2);
          done();
        })["catch"](done);
      });
      it('should remove sync entities only for entities, which match the query', function (done) {
        var randomId = utilities.randomString();
        var updatedEntity1 = {
          _id: entity1._id,
          someNewProperty: 'any value'
        };
        syncStore.update({
          _id: randomId
        }).then(function (result) {
          (0, _chai.expect)(result).to.deep.equal({
            _id: randomId
          });
          return syncStore.update(updatedEntity1);
        }).then(function (result) {
          (0, _chai.expect)(result).to.deep.equal(updatedEntity1);
          return storeToTest.pendingSyncEntities();
        }).then(function (syncEntities) {
          (0, _chai.expect)(syncEntities.map(function (e) {
            return e.entityId;
          }).sort()).to.deep.equal([entity1._id, randomId].sort());
          var query = new Kinvey.Query().equalTo('_id', randomId);
          return storeToTest.clear(query);
        }).then(function (result) {
          (0, _chai.expect)(result).to.deep.equal({
            count: 1
          });
          return storeToTest.pendingSyncEntities();
        }).then(function (result) {
          (0, _chai.expect)(result.length).to.equal(1);
          (0, _chai.expect)(result[0].entityId).to.equal(entity1._id);
          done();
        })["catch"](done);
      });
      it('should remove all entities only from the cache', function (done) {
        cacheStore.save({}).then(function () {
          return storeToTest.clear();
        }).then(function (result) {
          (0, _chai.expect)(result.count).to.equal(2);
          return syncStore.count().toPromise();
        }).then(function (count) {
          (0, _chai.expect)(count).to.equal(0);
          return networkStore.count().toPromise();
        }).then(function (count) {
          (0, _chai.expect)(count).to.equal(2);
          done();
        })["catch"](done);
      });
    });
  });
});