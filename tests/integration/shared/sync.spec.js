import { expect } from 'chai';
import sinon from 'sinon';
import _ from 'lodash';
// eslint-disable-next-line import/extensions
import * as Kinvey from '__SDK__';
import * as config from './config';
import * as utilities from './utils';

const dataStoreTypes = [Kinvey.DataStoreType.Cache, Kinvey.DataStoreType.Sync];
const notFoundErrorName = 'NotFoundError';
const collectionName = config.collectionName;
let networkStore;
let syncStore;
let cacheStore;
let storeToTest;

// validates Push operation result for 1 created, 1 modified and 1 deleted locally items
const validatePushOperation = (result, createdItem, modifiedItem, deletedItem, expectedServerItemsCount) => {
  expect(result.length).to.equal(3);
  result.forEach((record) => {
    let expectedOperation;
    if (record._id === createdItem._id) {
      expectedOperation = 'POST';
    } else if (record._id === modifiedItem._id) {
      expectedOperation = 'PUT';
    } else if (record._id === deletedItem._id) {
      expectedOperation = 'DELETE';
    } else {
      throw new Error('Unexpected record id');
    }
    expect(record.operation).to.equal(expectedOperation);
    expect([createdItem._id, modifiedItem._id, deletedItem._id]).to.include(record._id);
    if (record.operation !== 'DELETE') {
      utilities.assertEntityMetadata(record.entity);
      utilities.deleteEntityMetadata(record.entity);
      expect(record.entity).to.deep.equal(record._id === createdItem._id ? createdItem : modifiedItem);
    } else {
      expect(record.entity).to.not.exist;
    }
  });
  return networkStore.find().toPromise()
    .then((result) => {
      expect(result.length).to.equal(expectedServerItemsCount);
      expect(_.find(result, e => e._id === deletedItem._id)).to.not.exist;
      expect(_.find(result, e => e.newProperty === modifiedItem.newProperty)).to.exist;
      const createdOnServer = _.find(result, e => e._id === createdItem._id);

      expect(utilities.deleteEntityMetadata(createdOnServer)).to.deep.equal(createdItem);
      return storeToTest.pendingSyncCount();
    })
    .then((count) => {
      expect(count).to.equal(0);
    });
};

// validates Pull operation result
const validatePullOperation = (result, expectedItems, expectedPulledItemsCount) => {
  expect(result).to.equal(expectedPulledItemsCount || expectedItems.length);

  return syncStore.find().toPromise()
    .then((result) => {
      expectedItems.forEach((entity) => {
        const cachedEntity = _.find(result, e => e._id === entity._id);
        expect(utilities.deleteEntityMetadata(cachedEntity)).to.deep.equal(entity);
      });
    });
};

const validateSyncEntity = (syncEntity, operationType, expectedEntityIds) => {
  expect(syncEntity._id).to.exist;
  expect(utilities.ensureArray(expectedEntityIds)).to.include(syncEntity.entityId);
  expect(syncEntity.collection).to.equal(collectionName);
  expect(syncEntity.state).to.deep.equal({ operation: operationType }); // for now, this is all that is kept in the state
};

before(() => {
  return Kinvey.init({
    appKey: process.env.APP_KEY,
    appSecret: process.env.APP_SECRET,
    masterSecret: process.env.MASTER_SECRET
  });
});

dataStoreTypes.forEach((currentDataStoreType) => {
  describe(`${currentDataStoreType} Sync Tests`, () => {
    const dataStoreType = currentDataStoreType;
    const entity1 = utilities.getEntity(utilities.randomString());
    const entity2 = utilities.getEntity(utilities.randomString());
    const entity3 = utilities.getEntity(utilities.randomString());
    const createdUserIds = [];

    before((done) => {
      utilities.cleanUpAppData(collectionName, createdUserIds)
        .then(() => Kinvey.User.signup())
        .then((user) => {
          createdUserIds.push(user.data._id);
          // store for setup
          networkStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Network);
          syncStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Sync);
          cacheStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Cache);
          // store to test
          storeToTest = Kinvey.DataStore.collection(collectionName, dataStoreType);
          done();
        })
        .catch(done);
    });

    after((done) => {
      utilities.cleanUpAppData(collectionName, createdUserIds)
        .then(() => done())
        .catch(done);
    });

    describe('Pending sync queue operations', () => {
      beforeEach((done) => {
        utilities.cleanUpCollectionData(collectionName)
          .then(() => {
            // set up a pending update
            return cacheStore.create(entity1)
              .then(() => syncStore.update(entity1))
          })
          .then(() => syncStore.create(entity2)) // set up a pending create
          .then(() => {
            return cacheStore.create(entity3)
              .then(() => syncStore.removeById(entity3._id)) // set up a pending delete
          })
          .then(() => done())
          .catch(done);
      });

      describe('pendingSyncCount()', () => {
        it('should return the count of the entities waiting to be synced', (done) => {
          storeToTest.pendingSyncCount()
            .then((count) => {
              expect(count).to.equal(3);
              done();
            })
            .catch(done);
        });

        it('should return the count of the entities, matching the query, for a create operation', (done) => {
          const query = new Kinvey.Query();
          query.equalTo('_id', entity2._id);
          storeToTest.pendingSyncCount(query)
            .then((count) => {
              expect(count).to.equal(1);
              done();
            })
            .catch(done);
        });

        it('should return the count of the entities, matching the query, for an update operation', (done) => {
          const query = new Kinvey.Query();
          query.equalTo('_id', entity1._id);
          storeToTest.pendingSyncCount(query)
            .then((count) => {
              expect(count).to.equal(1);
              done();
            })
            .catch(done);
        });

        it('should return the count of the entities, matching the query, for a delete operation', (done) => {
          const query = new Kinvey.Query();
          query.equalTo('_id', entity3._id);
          storeToTest.pendingSyncCount(query)
            .then((count) => {
              expect(count).to.equal(1);
              done();
            })
            .catch(done);
        });
      });

      describe('clearSync()', () => {
        it('should clear the pending sync queue', (done) => {
          syncStore.clearSync()
            .then(() => storeToTest.pendingSyncCount())
            .then((count) => {
              expect(count).to.equal(0);
              done();
            }).catch(done);
        });

        it('should clear only the items, matching the query from the pending sync queue, for a create operation', (done) => {
          const query = new Kinvey.Query();
          query.equalTo('_id', entity2._id);
          syncStore.clearSync(query)
            .then((result) => {
              expect(result).to.deep.equal(1);
              return storeToTest.pendingSyncEntities();
            })
            .then((result) => {
              expect(result.length).to.equal(2);
              const deletedEntity = result.find(e => e.state.operation === 'DELETE');
              const updatedEntity = result.find(e => e.state.operation === 'PUT');
              validateSyncEntity(deletedEntity, 'DELETE', entity3._id);
              validateSyncEntity(updatedEntity, 'PUT', entity1._id);
              done();
            })
            .catch(done);
        });

        it('should clear only the items, matching the query from the pending sync queue, for an update operation', (done) => {
          const query = new Kinvey.Query();
          query.equalTo('_id', entity1._id);
          syncStore.clearSync(query)
            .then((result) => {
              expect(result).to.deep.equal(1);
              return storeToTest.pendingSyncEntities();
            })
            .then((result) => {
              expect(result.length).to.equal(2);
              const deletedEntity = result.find(e => e.state.operation === 'DELETE');
              const createdEntity = result.find(e => e.state.operation === 'POST');
              validateSyncEntity(deletedEntity, 'DELETE', entity3._id);
              validateSyncEntity(createdEntity, 'POST', entity2._id);
              done();
            })
            .catch(done);
        });

        it('should clear only the items, matching the query from the pending sync queue, for a delete operation', (done) => {
          const query = new Kinvey.Query();
          query.equalTo('_id', entity3._id);
          syncStore.clearSync(query)
            .then((result) => {
              expect(result).to.deep.equal(1)
              return storeToTest.pendingSyncEntities();
            })
            .then((result) => {
              expect(result.length).to.equal(2);
              const updatedEntity = result.find(e => e.state.operation === 'PUT');
              const createdEntity = result.find(e => e.state.operation === 'POST');
              validateSyncEntity(updatedEntity, 'PUT', entity1._id);
              validateSyncEntity(createdEntity, 'POST', entity2._id);
              done();
            })
            .catch(done);
        });
      });

      describe('pendingSyncEntities()', () => {
        it('should return only the entities waiting to be synced', (done) => {
          storeToTest.pendingSyncEntities()
            .then((entities) => {
              expect(entities.length).to.equal(3);
              const updatedEntity = entities.find(e => e.state.operation === 'PUT');
              const createdEntity = entities.find(e => e.state.operation === 'POST');
              validateSyncEntity(updatedEntity, 'PUT', entity1._id);
              validateSyncEntity(createdEntity, 'POST', entity2._id);
              done();
            })
            .catch(done);
        });

        it('should return only the entities, matching the query for a create operation', (done) => {
          const query = new Kinvey.Query();
          query.equalTo('_id', entity2._id);
          storeToTest.pendingSyncEntities(query)
            .then((entities) => {
              expect(entities.length).to.equal(1);
              validateSyncEntity(entities[0], 'POST', entity2._id);
              done();
            })
            .catch(done);
        });

        it('should return only the entities, matching the query for an update operation', (done) => {
          const query = new Kinvey.Query();
          query.equalTo('_id', entity1._id);
          storeToTest.pendingSyncEntities(query)
            .then((entities) => {
              expect(entities.length).to.equal(1);
              validateSyncEntity(entities[0], 'PUT', entity1._id);
              done();
            })
            .catch(done);
        });

        it('should return only the entities, matching the query for a delete operation', (done) => {
          const query = new Kinvey.Query();
          query.equalTo('_id', entity3._id);
          storeToTest.pendingSyncEntities(query)
            .then((entities) => {
              expect(entities.length).to.equal(1);
              validateSyncEntity(entities[0], 'DELETE', entity3._id);
              done();
            })
            .catch(done);
        });

        it('should return an empty array if there are no entities waiting to be synced', (done) => {
          syncStore.clearSync()
            .then(() => storeToTest.pendingSyncEntities())
            .then((entities) => {
              expect(entities).to.be.an('array').that.is.empty;
              done();
            })
            .catch(done);
        });
      });
    });

    describe('Sync operations', () => {
      let updatedEntity2;

      beforeEach((done) => {
        updatedEntity2 = Object.assign({ newProperty: utilities.randomString() }, entity2);
        // adding three items, eligible for sync and one item, which should not be synced
        utilities.cleanUpCollectionData(collectionName)
          .then(() => syncStore.create(entity1)) // set up a created entity
          .then(() => cacheStore.save(entity2))
          .then(() => cacheStore.save(entity3))
          .then(() => syncStore.save(updatedEntity2)) // set up an updated entity
          .then(() => syncStore.removeById(entity3._id)) // set up a deleted entity
          .then(() => cacheStore.save({}))
          .then(() => done())
          .catch(done);
      });

      describe('push()', () => {
        it('should push created/updated/deleted locally entities to the backend', (done) => {
          storeToTest.push()
            .then((result) => validatePushOperation(result, entity1, updatedEntity2, entity3, 3))
            .then(done)
            .catch(done);
        });

        it('should disregard the passed query and push all entities to the backend', (done) => {
          const query = new Kinvey.Query();
          query.equalTo('_id', entity1._id);
          storeToTest.push(query)
            .then((result) => validatePushOperation(result, entity1, updatedEntity2, entity3, 3))
            .then(done)
            .catch(done);
        });

        // This does not seem to be correct
        // If an entity does not exist on the network and we are asking to remove it then the result on the network
        // is correct
        it.skip('should log an error, finish the push and not clear the sync queue if an item push fails', (done) => {
          networkStore.removeById(entity3._id)
            .then(() => storeToTest.push())
            .then((result) => {
              expect(result.length).to.equal(3);
              const errorRecord = _.find(result, (entity) => { return entity._id === entity3._id; });
              expect(errorRecord.error.name).to.equal(notFoundErrorName);
              return networkStore.find().toPromise();
            })
            .then((result) => {
              expect(_.find(result, (entity) => { return entity.newProperty === updatedEntity2.newProperty; })).to.exist;
              expect(_.find(result, (entity) => { return entity._id === entity1._id; })).to.exist;
              return storeToTest.pendingSyncCount();
            })
            .then((count) => {
              expect(count).to.equal(1);
              done();
            })
            .catch(done);
        });

        it('should recreate a modified locally, but already deleted item on the server', (done) => {
          networkStore.removeById(updatedEntity2._id)
            .then(() => storeToTest.push())
            .then((result) => validatePushOperation(result, entity1, updatedEntity2, entity3, 3))
            .then(done)
            .catch(done);
        });
      });

      describe('pull()', () => {
        beforeEach((done) => {
          utilities.cleanUpCollectionData(collectionName)
            .then(() => networkStore.save(entity1))
            .then(() => networkStore.save(entity2))
            .then(() => done())
            .catch(done);
        });

        it('should save the entities from the backend in the cache', (done) => {
          storeToTest.pull()
            .then((result) => validatePullOperation(result, [entity1, entity2]))
            .then(() => done())
            .catch(done);
        });

        it('should delete entities locally that are deleted in the server with autopagination', (done) => {
          let query = new Kinvey.Query();
          storeToTest.pull(query, { autoPagination: { pageSize: 1 } })
            .then((result) => validatePullOperation(result, [entity1, entity2]))
            .then(() => networkStore.save(entity3))
            .then(() => storeToTest.pull(query, { autoPagination: true }))
            .then((result) => validatePullOperation(result, [entity1, entity2, entity3]))
            .then(() => networkStore.removeById(entity1._id))
            .then(() => networkStore.removeById(entity2._id))
            .then(() => storeToTest.pull(query, { autoPagination: true }))
            .then((result) => validatePullOperation(result, [entity3]))
            .then(() => {
              let onNextSpy = sinon.spy();
              syncStore.find()
                .subscribe(onNextSpy, done, () => {
                  try {
                    utilities.validateReadResult(Kinvey.DataStoreType.Sync, onNextSpy, [entity3])
                    done();
                  } catch (error) {
                    done(error)
                  }
                })
            })
            .catch(done);
        });

        it('should pull only the entities, matching the query', (done) => {
          const query = new Kinvey.Query();
          query.equalTo('_id', entity1._id);
          storeToTest.pull(query)
            .then((result) => validatePullOperation(result, [entity1]))
            .then(() => done())
            .catch(done);
        });

        it('should return an error if there are entities awaiting to be pushed to the backend', (done) => {
          syncStore.save(entity3)
            .then(() => storeToTest.pull())
            .then(() => Promise.reject(new Error('should not happen')))
            .catch((err) => {
              expect(err.message).to.contain('There is 1 entity');
              done();
            })
            .catch(done);
        });

        it('should overwrite locally changed items', (done) => {
          const updatedEntity3 = Object.assign({ newProperty: utilities.randomString() }, entity3);
          cacheStore.save(entity3)
            .then(() => syncStore.save(updatedEntity3))
            .then(() => syncStore.clearSync())
            .then(() => storeToTest.pull())
            .then(() => syncStore.findById(updatedEntity3._id).toPromise())
            .then((result) => {
              expect(result.newProperty).to.not.exist;
              done();
            })
            .catch(done);
        });
      });

      describe('sync()', () => {
        let serverEntity1;
        let serverEntity2;

        beforeEach((done) => {
          // creating two server items - three items, eligible for sync are already created in cache
          serverEntity1 = utilities.getEntity(utilities.randomString());
          serverEntity2 = utilities.getEntity(utilities.randomString());
          networkStore.save(serverEntity1)
            .then(() => networkStore.save(serverEntity2))
            .then(() => done())
            .catch(done);
        });

        it('should push and then pull the entities from the backend in the cache', (done) => {
          let syncResult;
          storeToTest.sync()
            .then((result) => {
              syncResult = result;
              return validatePushOperation(syncResult.push, entity1, updatedEntity2, entity3, 5);
            })
            .then(() => validatePullOperation(syncResult.pull, [serverEntity1, serverEntity2, updatedEntity2], 5))
            .then(() => done())
            .catch(done);
        });

        it('with query should push all entities and then pull only the entities, matching the query', (done) => {
          let syncResult;
          const query = new Kinvey.Query();
          query.equalTo('_id', updatedEntity2._id);
          storeToTest.sync(query)
            .then((result) => {
              syncResult = result;
              return validatePushOperation(syncResult.push, entity1, updatedEntity2, entity3, 5);
            })
            .then((result) => {
              return validatePullOperation(syncResult.pull, [updatedEntity2]);
            })
            .then(() => done())
            .catch(done);
        });
      });
    });
  });
});
