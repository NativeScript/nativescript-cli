"use strict";

require("core-js/modules/es.array.find");

require("core-js/modules/es.array.for-each");

require("core-js/modules/es.function.name");

require("core-js/modules/es.object.assign");

require("core-js/modules/es.object.define-property");

require("core-js/modules/es.object.get-own-property-descriptor");

require("core-js/modules/es.object.to-string");

require("core-js/modules/es.promise");

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
var notFoundErrorName = 'NotFoundError';
var collectionName = config.collectionName;
var networkStore;
var syncStore;
var cacheStore;
var storeToTest; // validates Push operation result for 1 created, 1 modified and 1 deleted locally items

var validatePushOperation = function validatePushOperation(result, createdItem, modifiedItem, deletedItem, expectedServerItemsCount) {
  (0, _chai.expect)(result.length).to.equal(3);
  result.forEach(function (record) {
    var expectedOperation;

    if (record._id === createdItem._id) {
      expectedOperation = 'POST';
    } else if (record._id === modifiedItem._id) {
      expectedOperation = 'PUT';
    } else if (record._id === deletedItem._id) {
      expectedOperation = 'DELETE';
    } else {
      throw new Error('Unexpected record id');
    }

    (0, _chai.expect)(record.operation).to.equal(expectedOperation);
    (0, _chai.expect)([createdItem._id, modifiedItem._id, deletedItem._id]).to.include(record._id);

    if (record.operation !== 'DELETE') {
      utilities.assertEntityMetadata(record.entity);
      utilities.deleteEntityMetadata(record.entity);
      (0, _chai.expect)(record.entity).to.deep.equal(record._id === createdItem._id ? createdItem : modifiedItem);
    } else {
      (0, _chai.expect)(record.entity).to.not.exist;
    }
  });
  return networkStore.find().toPromise().then(function (result) {
    (0, _chai.expect)(result.length).to.equal(expectedServerItemsCount);
    (0, _chai.expect)(_lodash["default"].find(result, function (e) {
      return e._id === deletedItem._id;
    })).to.not.exist;
    (0, _chai.expect)(_lodash["default"].find(result, function (e) {
      return e.newProperty === modifiedItem.newProperty;
    })).to.exist;

    var createdOnServer = _lodash["default"].find(result, function (e) {
      return e._id === createdItem._id;
    });

    (0, _chai.expect)(utilities.deleteEntityMetadata(createdOnServer)).to.deep.equal(createdItem);
    return storeToTest.pendingSyncCount();
  }).then(function (count) {
    (0, _chai.expect)(count).to.equal(0);
  });
}; // validates Pull operation result


var validatePullOperation = function validatePullOperation(result, expectedItems, expectedPulledItemsCount) {
  (0, _chai.expect)(result).to.equal(expectedPulledItemsCount || expectedItems.length);
  return syncStore.find().toPromise().then(function (result) {
    expectedItems.forEach(function (entity) {
      var cachedEntity = _lodash["default"].find(result, function (e) {
        return e._id === entity._id;
      });

      (0, _chai.expect)(utilities.deleteEntityMetadata(cachedEntity)).to.deep.equal(entity);
    });
  });
};

var validateSyncEntity = function validateSyncEntity(syncEntity, operationType, expectedEntityIds) {
  (0, _chai.expect)(syncEntity._id).to.exist;
  (0, _chai.expect)(utilities.ensureArray(expectedEntityIds)).to.include(syncEntity.entityId);
  (0, _chai.expect)(syncEntity.collection).to.equal(collectionName);
  (0, _chai.expect)(syncEntity.state).to.deep.equal({
    operation: operationType
  }); // for now, this is all that is kept in the state
};

before(function () {
  return Kinvey.init({
    appKey: process.env.APP_KEY,
    appSecret: process.env.APP_SECRET,
    masterSecret: process.env.MASTER_SECRET
  });
});
dataStoreTypes.forEach(function (currentDataStoreType) {
  describe("".concat(currentDataStoreType, " Sync Tests"), function () {
    var dataStoreType = currentDataStoreType;
    var entity1 = utilities.getEntity(utilities.randomString());
    var entity2 = utilities.getEntity(utilities.randomString());
    var entity3 = utilities.getEntity(utilities.randomString());
    var createdUserIds = [];
    before(function (done) {
      utilities.cleanUpAppData(collectionName, createdUserIds).then(function () {
        return Kinvey.User.signup();
      }).then(function (user) {
        createdUserIds.push(user.data._id); // store for setup

        networkStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Network);
        syncStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Sync);
        cacheStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Cache); // store to test

        storeToTest = Kinvey.DataStore.collection(collectionName, dataStoreType);
        done();
      })["catch"](done);
    });
    after(function (done) {
      utilities.cleanUpAppData(collectionName, createdUserIds).then(function () {
        return done();
      })["catch"](done);
    });
    describe('Pending sync queue operations', function () {
      beforeEach(function (done) {
        utilities.cleanUpCollectionData(collectionName).then(function () {
          // set up a pending update
          return cacheStore.create(entity1).then(function () {
            return syncStore.update(entity1);
          });
        }).then(function () {
          return syncStore.create(entity2);
        }) // set up a pending create
        .then(function () {
          return cacheStore.create(entity3).then(function () {
            return syncStore.removeById(entity3._id);
          }); // set up a pending delete
        }).then(function () {
          return done();
        })["catch"](done);
      });
      describe('pendingSyncCount()', function () {
        it('should return the count of the entities waiting to be synced', function (done) {
          storeToTest.pendingSyncCount().then(function (count) {
            (0, _chai.expect)(count).to.equal(3);
            done();
          })["catch"](done);
        });
        it('should return the count of the entities, matching the query, for a create operation', function (done) {
          var query = new Kinvey.Query();
          query.equalTo('_id', entity2._id);
          storeToTest.pendingSyncCount(query).then(function (count) {
            (0, _chai.expect)(count).to.equal(1);
            done();
          })["catch"](done);
        });
        it('should return the count of the entities, matching the query, for an update operation', function (done) {
          var query = new Kinvey.Query();
          query.equalTo('_id', entity1._id);
          storeToTest.pendingSyncCount(query).then(function (count) {
            (0, _chai.expect)(count).to.equal(1);
            done();
          })["catch"](done);
        });
        it('should return the count of the entities, matching the query, for a delete operation', function (done) {
          var query = new Kinvey.Query();
          query.equalTo('_id', entity3._id);
          storeToTest.pendingSyncCount(query).then(function (count) {
            (0, _chai.expect)(count).to.equal(1);
            done();
          })["catch"](done);
        });
      });
      describe('clearSync()', function () {
        it('should clear the pending sync queue', function (done) {
          syncStore.clearSync().then(function () {
            return storeToTest.pendingSyncCount();
          }).then(function (count) {
            (0, _chai.expect)(count).to.equal(0);
            done();
          })["catch"](done);
        });
        it('should clear only the items, matching the query from the pending sync queue, for a create operation', function (done) {
          var query = new Kinvey.Query();
          query.equalTo('_id', entity2._id);
          syncStore.clearSync(query).then(function (result) {
            (0, _chai.expect)(result).to.deep.equal(1);
            return storeToTest.pendingSyncEntities();
          }).then(function (result) {
            (0, _chai.expect)(result.length).to.equal(2);
            var deletedEntity = result.find(function (e) {
              return e.state.operation === 'DELETE';
            });
            var updatedEntity = result.find(function (e) {
              return e.state.operation === 'PUT';
            });
            validateSyncEntity(deletedEntity, 'DELETE', entity3._id);
            validateSyncEntity(updatedEntity, 'PUT', entity1._id);
            done();
          })["catch"](done);
        });
        it('should clear only the items, matching the query from the pending sync queue, for an update operation', function (done) {
          var query = new Kinvey.Query();
          query.equalTo('_id', entity1._id);
          syncStore.clearSync(query).then(function (result) {
            (0, _chai.expect)(result).to.deep.equal(1);
            return storeToTest.pendingSyncEntities();
          }).then(function (result) {
            (0, _chai.expect)(result.length).to.equal(2);
            var deletedEntity = result.find(function (e) {
              return e.state.operation === 'DELETE';
            });
            var createdEntity = result.find(function (e) {
              return e.state.operation === 'POST';
            });
            validateSyncEntity(deletedEntity, 'DELETE', entity3._id);
            validateSyncEntity(createdEntity, 'POST', entity2._id);
            done();
          })["catch"](done);
        });
        it('should clear only the items, matching the query from the pending sync queue, for a delete operation', function (done) {
          var query = new Kinvey.Query();
          query.equalTo('_id', entity3._id);
          syncStore.clearSync(query).then(function (result) {
            (0, _chai.expect)(result).to.deep.equal(1);
            return storeToTest.pendingSyncEntities();
          }).then(function (result) {
            (0, _chai.expect)(result.length).to.equal(2);
            var updatedEntity = result.find(function (e) {
              return e.state.operation === 'PUT';
            });
            var createdEntity = result.find(function (e) {
              return e.state.operation === 'POST';
            });
            validateSyncEntity(updatedEntity, 'PUT', entity1._id);
            validateSyncEntity(createdEntity, 'POST', entity2._id);
            done();
          })["catch"](done);
        });
      });
      describe('pendingSyncEntities()', function () {
        it('should return only the entities waiting to be synced', function (done) {
          storeToTest.pendingSyncEntities().then(function (entities) {
            (0, _chai.expect)(entities.length).to.equal(3);
            var updatedEntity = entities.find(function (e) {
              return e.state.operation === 'PUT';
            });
            var createdEntity = entities.find(function (e) {
              return e.state.operation === 'POST';
            });
            validateSyncEntity(updatedEntity, 'PUT', entity1._id);
            validateSyncEntity(createdEntity, 'POST', entity2._id);
            done();
          })["catch"](done);
        });
        it('should return only the entities, matching the query for a create operation', function (done) {
          var query = new Kinvey.Query();
          query.equalTo('_id', entity2._id);
          storeToTest.pendingSyncEntities(query).then(function (entities) {
            (0, _chai.expect)(entities.length).to.equal(1);
            validateSyncEntity(entities[0], 'POST', entity2._id);
            done();
          })["catch"](done);
        });
        it('should return only the entities, matching the query for an update operation', function (done) {
          var query = new Kinvey.Query();
          query.equalTo('_id', entity1._id);
          storeToTest.pendingSyncEntities(query).then(function (entities) {
            (0, _chai.expect)(entities.length).to.equal(1);
            validateSyncEntity(entities[0], 'PUT', entity1._id);
            done();
          })["catch"](done);
        });
        it('should return only the entities, matching the query for a delete operation', function (done) {
          var query = new Kinvey.Query();
          query.equalTo('_id', entity3._id);
          storeToTest.pendingSyncEntities(query).then(function (entities) {
            (0, _chai.expect)(entities.length).to.equal(1);
            validateSyncEntity(entities[0], 'DELETE', entity3._id);
            done();
          })["catch"](done);
        });
        it('should return an empty array if there are no entities waiting to be synced', function (done) {
          syncStore.clearSync().then(function () {
            return storeToTest.pendingSyncEntities();
          }).then(function (entities) {
            (0, _chai.expect)(entities).to.be.an('array').that.is.empty;
            done();
          })["catch"](done);
        });
      });
    });
    describe('Sync operations', function () {
      var updatedEntity2;
      beforeEach(function (done) {
        updatedEntity2 = Object.assign({
          newProperty: utilities.randomString()
        }, entity2); // adding three items, eligible for sync and one item, which should not be synced

        utilities.cleanUpCollectionData(collectionName).then(function () {
          return syncStore.create(entity1);
        }) // set up a created entity
        .then(function () {
          return cacheStore.save(entity2);
        }).then(function () {
          return cacheStore.save(entity3);
        }).then(function () {
          return syncStore.save(updatedEntity2);
        }) // set up an updated entity
        .then(function () {
          return syncStore.removeById(entity3._id);
        }) // set up a deleted entity
        .then(function () {
          return cacheStore.save({});
        }).then(function () {
          return done();
        })["catch"](done);
      });
      describe('push()', function () {
        it('should push created/updated/deleted locally entities to the backend', function (done) {
          storeToTest.push().then(function (result) {
            return validatePushOperation(result, entity1, updatedEntity2, entity3, 3);
          }).then(done)["catch"](done);
        });
        it('should disregard the passed query and push all entities to the backend', function (done) {
          var query = new Kinvey.Query();
          query.equalTo('_id', entity1._id);
          storeToTest.push(query).then(function (result) {
            return validatePushOperation(result, entity1, updatedEntity2, entity3, 3);
          }).then(done)["catch"](done);
        }); // This does not seem to be correct
        // If an entity does not exist on the network and we are asking to remove it then the result on the network
        // is correct

        it.skip('should log an error, finish the push and not clear the sync queue if an item push fails', function (done) {
          networkStore.removeById(entity3._id).then(function () {
            return storeToTest.push();
          }).then(function (result) {
            (0, _chai.expect)(result.length).to.equal(3);

            var errorRecord = _lodash["default"].find(result, function (entity) {
              return entity._id === entity3._id;
            });

            (0, _chai.expect)(errorRecord.error.name).to.equal(notFoundErrorName);
            return networkStore.find().toPromise();
          }).then(function (result) {
            (0, _chai.expect)(_lodash["default"].find(result, function (entity) {
              return entity.newProperty === updatedEntity2.newProperty;
            })).to.exist;
            (0, _chai.expect)(_lodash["default"].find(result, function (entity) {
              return entity._id === entity1._id;
            })).to.exist;
            return storeToTest.pendingSyncCount();
          }).then(function (count) {
            (0, _chai.expect)(count).to.equal(1);
            done();
          })["catch"](done);
        });
        it('should recreate a modified locally, but already deleted item on the server', function (done) {
          networkStore.removeById(updatedEntity2._id).then(function () {
            return storeToTest.push();
          }).then(function (result) {
            return validatePushOperation(result, entity1, updatedEntity2, entity3, 3);
          }).then(done)["catch"](done);
        });
      });
      describe('pull()', function () {
        beforeEach(function (done) {
          utilities.cleanUpCollectionData(collectionName).then(function () {
            return networkStore.save(entity1);
          }).then(function () {
            return networkStore.save(entity2);
          }).then(function () {
            return done();
          })["catch"](done);
        });
        it('should save the entities from the backend in the cache', function (done) {
          storeToTest.pull().then(function (result) {
            return validatePullOperation(result, [entity1, entity2]);
          }).then(function () {
            return done();
          })["catch"](done);
        });
        it('should delete entities locally that are deleted in the server with autopagination', function (done) {
          var query = new Kinvey.Query();
          storeToTest.pull(query, {
            autoPagination: {
              pageSize: 1
            }
          }).then(function (result) {
            return validatePullOperation(result, [entity1, entity2]);
          }).then(function () {
            return networkStore.save(entity3);
          }).then(function () {
            return storeToTest.pull(query, {
              autoPagination: true
            });
          }).then(function (result) {
            return validatePullOperation(result, [entity1, entity2, entity3]);
          }).then(function () {
            return networkStore.removeById(entity1._id);
          }).then(function () {
            return networkStore.removeById(entity2._id);
          }).then(function () {
            return storeToTest.pull(query, {
              autoPagination: true
            });
          }).then(function (result) {
            return validatePullOperation(result, [entity3]);
          }).then(function () {
            var onNextSpy = _sinon["default"].spy();

            syncStore.find().subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(Kinvey.DataStoreType.Sync, onNextSpy, [entity3]);
                done();
              } catch (error) {
                done(error);
              }
            });
          })["catch"](done);
        });
        it('should pull only the entities, matching the query', function (done) {
          var query = new Kinvey.Query();
          query.equalTo('_id', entity1._id);
          storeToTest.pull(query).then(function (result) {
            return validatePullOperation(result, [entity1]);
          }).then(function () {
            return done();
          })["catch"](done);
        });
        it('should return an error if there are entities awaiting to be pushed to the backend', function (done) {
          syncStore.save(entity3).then(function () {
            return storeToTest.pull();
          }).then(function () {
            return Promise.reject(new Error('should not happen'));
          })["catch"](function (err) {
            (0, _chai.expect)(err.message).to.contain('There is 1 entity');
            done();
          })["catch"](done);
        });
        it('should overwrite locally changed items', function (done) {
          var updatedEntity3 = Object.assign({
            newProperty: utilities.randomString()
          }, entity3);
          cacheStore.save(entity3).then(function () {
            return syncStore.save(updatedEntity3);
          }).then(function () {
            return syncStore.clearSync();
          }).then(function () {
            return storeToTest.pull();
          }).then(function () {
            return syncStore.findById(updatedEntity3._id).toPromise();
          }).then(function (result) {
            (0, _chai.expect)(result.newProperty).to.not.exist;
            done();
          })["catch"](done);
        });
      });
      describe('sync()', function () {
        var serverEntity1;
        var serverEntity2;
        beforeEach(function (done) {
          // creating two server items - three items, eligible for sync are already created in cache
          serverEntity1 = utilities.getEntity(utilities.randomString());
          serverEntity2 = utilities.getEntity(utilities.randomString());
          networkStore.save(serverEntity1).then(function () {
            return networkStore.save(serverEntity2);
          }).then(function () {
            return done();
          })["catch"](done);
        });
        it('should push and then pull the entities from the backend in the cache', function (done) {
          var syncResult;
          storeToTest.sync().then(function (result) {
            syncResult = result;
            return validatePushOperation(syncResult.push, entity1, updatedEntity2, entity3, 5);
          }).then(function () {
            return validatePullOperation(syncResult.pull, [serverEntity1, serverEntity2, updatedEntity2], 5);
          }).then(function () {
            return done();
          })["catch"](done);
        });
        it('with query should push all entities and then pull only the entities, matching the query', function (done) {
          var syncResult;
          var query = new Kinvey.Query();
          query.equalTo('_id', updatedEntity2._id);
          storeToTest.sync(query).then(function (result) {
            syncResult = result;
            return validatePushOperation(syncResult.push, entity1, updatedEntity2, entity3, 5);
          }).then(function (result) {
            return validatePullOperation(syncResult.pull, [updatedEntity2]);
          }).then(function () {
            return done();
          })["catch"](done);
        });
      });
    });
  });
});