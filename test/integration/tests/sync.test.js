function testFunc() {
  const dataStoreTypes = [Kinvey.DataStoreType.Cache, Kinvey.DataStoreType.Sync];
  let networkStore;
  let syncStore;
  let cacheStore;
  let storeToTest;
  const notFoundErrorName = 'NotFoundError';
  const collectionName = externalConfig.collectionWithPreSaveHook;
  const propertyFromBLName = externalConfig.propertyFromBLName;
  const propertyFromBLValue = externalConfig.propertyFromBLValue;

  const simulateBLPreSaveHook = (entities) => {
    const isSingle = !_.isArray(entities);
    entities = utilities.ensureArray(entities);
    const clonedEntities = _.cloneDeep(entities);
    clonedEntities.forEach(e => {
      e[propertyFromBLName] = propertyFromBLValue;
    });
    return isSingle ? clonedEntities[0] : clonedEntities;
  };

  // validates Push operation result for 1 created, 1 modified and 1 deleted locally items
  const validatePushOperation = (result, createdItem, modifiedItem, deletedItem, expectedServerItemsCount) => {
    expect(result.length).to.equal(3);
    result.forEach((record) => {
      expect(record.operation).to.equal(record._id === deletedItem._id ? 'DELETE' : 'PUT');
      expect([createdItem._id, modifiedItem._id, deletedItem._id]).to.include(record._id);
      if (record.operation !== 'DELETE') {
        utilities.assertEntityMetadata(record.entity);
        utilities.deleteEntityMetadata(record.entity);
        const expectedItem = record._id === createdItem._id ? createdItem : modifiedItem;
        expect(record.entity).to.deep.equal(simulateBLPreSaveHook(expectedItem));
      } else {
        expect(record.entity).to.not.exist;
      }
    });
    networkStore.find().toPromise()
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
    expect(result.length).to.equal(expectedPulledItemsCount || expectedItems.length);
    expectedItems = simulateBLPreSaveHook(expectedItems);
    expectedItems.forEach((entity) => {
      const resultEntity = _.find(result, e => e._id === entity._id);
      expect(utilities.deleteEntityMetadata(resultEntity)).to.deep.equal(entity);
    });

    return syncStore.find().toPromise()
      .then((result) => {
        expectedItems.forEach((entity) => {
          const cachedEntity = _.find(result, e => e._id === entity._id);
          expect(utilities.deleteEntityMetadata(cachedEntity)).to.deep.equal(entity);
        });
      });
  };

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
            .then(() => syncStore.save(entity1))
            .then(() => syncStore.save(entity2))
            .then(() => cacheStore.save(entity3))
            .then(() => done())
            .catch(done);
        });

        it('pendingSyncCount() should return the count of the entities waiting to be synced', (done) => {
          storeToTest.pendingSyncCount()
            .then((count) => {
              expect(count).to.equal(2);
              done();
            }).catch(done);
        });

        it('pendingSyncCount() should return the count of the entities, matching the query', (done) => {
          const query = new Kinvey.Query();
          query.equalTo('_id', entity1._id);
          storeToTest.pendingSyncCount(query)
            .then((count) => {
              expect(count).to.equal(1);
              done();
            }).catch(done);
        });

        it('clearSync() should clear the pending sync queue', (done) => {
          syncStore.clearSync()
            .then(() => storeToTest.pendingSyncCount())
            .then((count) => {
              expect(count).to.equal(0);
              done();
            }).catch(done);
        });

        it('clearSync() should clear only the items, matching the query from the pending sync queue', (done) => {
          const query = new Kinvey.Query();
          query.equalTo('_id', entity1._id);
          syncStore.clearSync(query)
            .then(() => storeToTest.pendingSyncEntities())
            .then((result) => {
              expect(result.length).to.equal(1);
              expect(result[0].entityId).to.equal(entity2._id);
              done();
            }).catch(done);
        });

        it('pendingSyncEntities() should return only the entities waiting to be synced', (done) => {
          storeToTest.pendingSyncEntities()
            .then((entities) => {
              expect(entities.length).to.equal(2);
              entities.forEach((entity) => {
                expect(entity.collection).to.equal(collectionName);
                expect(entity.state.operation).to.equal('PUT');
                expect([entity1._id, entity2._id]).to.include(entity.entityId);
              });
              done();
            }).catch(done);
        });

        it('pendingSyncEntities() should return only the entities, matching the query', (done) => {
          const query = new Kinvey.Query();
          query.equalTo('_id', entity1._id);
          storeToTest.pendingSyncEntities(query)
            .then((entities) => {
              expect(entities.length).to.equal(1);
              expect(entities[0].entityId).to.equal(entity1._id);
              done();
            }).catch(done);
        });

        it('pendingSyncEntities() should return an empty array if there are no entities waiting to be synced', (done) => {
          syncStore.clearSync()
            .then(() => storeToTest.pendingSyncEntities())
            .then((entities) => {
              expect(entities).to.be.an.empty.array;
              done();
            }).catch(done);
        });
      });

      describe('Sync operations', () => {
        let updatedEntity2;

        beforeEach((done) => {
          updatedEntity2 = Object.assign({ newProperty: utilities.randomString() }, entity2);
          // adding three items, eligible for sync and one item, which should not be synced
          utilities.cleanUpCollectionData(collectionName)
            .then(() => syncStore.save(entity1))
            .then(() => cacheStore.save(entity2))
            .then(() => cacheStore.save(entity3))
            .then(() => syncStore.save(updatedEntity2))
            .then(() => syncStore.removeById(entity3._id))
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

          it('should push to the backend only the entities matching the query', (done) => {
            const query = new Kinvey.Query();
            query.equalTo('_id', entity1._id);
            storeToTest.push(query)
              .then((result) => {
                expect(result.length).to.equal(1);
                expect(result[0]._id).to.equal(entity1._id);

                return networkStore.find().toPromise()
                  .then((result) => {
                    expect(_.find(result, (entity) => { return entity._id === entity1._id; })).to.exist;
                    expect(_.find(result, (entity) => { return entity._id === entity3._id; })).to.exist;
                    done();
                  });
              })
              .catch(done);
          });

          it('should update local entities with result from network', (done) => {
            storeToTest.push()
              .then(() => syncStore.find().toPromise())
              .then((offlineEntities) => {
                expect(offlineEntities.length).to.equal(3);
                const ent1 = offlineEntities.find(e => e._id === entity1._id);
                const ent2 = offlineEntities.find(e => e._id === entity2._id);
                const modifiedEntities = offlineEntities.filter(e => propertyFromBLName in e);
                expect(modifiedEntities.length).to.equal(3);
                expect(ent1[propertyFromBLName]).to.equal(true);
                expect(ent2[propertyFromBLName]).to.equal(true);
              })
              .then(done)
              .catch(done);
          });

          it('should log an error, finish the push and not clear the sync queue if an item push fails', (done) => {
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

          it('should pull only the entities, matching the query', (done) => {
            const query = new Kinvey.Query();
            query.equalTo('_id', entity1._id);
            storeToTest.pull(query)
              .then((result) => validatePullOperation(result, [entity1]))
              .then(() => done())
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

          it('should push and then pull only the entities, matching the query', (done) => {
            let syncResult;
            const query = new Kinvey.Query();
            query.equalTo('_id', updatedEntity2._id);
            storeToTest.sync(query)
              .then((result) => {
                syncResult = result;
                expect(syncResult.push.length).to.equal(1);
                expect(syncResult.push[0]._id).to.equal(updatedEntity2._id);
                return networkStore.find().toPromise();
              })
              .then((result) => {
                expect(_.find(result, (entity) => { return entity._id === updatedEntity2._id; })).to.exist;
                return validatePullOperation(syncResult.pull, [updatedEntity2]);
              })
              .then(() => done())
              .catch(done);
          });
        });
      });
    });
  });
}

runner.run(testFunc);
