function testFunc() {
  const dataStoreTypes = [Kinvey.DataStoreType.Cache, Kinvey.DataStoreType.Sync];
  const deltaCollectionName = externalConfig.deltaCollectionName;
  const collectionWithoutDelta = externalConfig.collectionName;
  const deltaNetworkStore = Kinvey.DataStore.collection(deltaCollectionName, Kinvey.DataStoreType.Network);
  const syncStore = Kinvey.DataStore.collection(deltaCollectionName, Kinvey.DataStoreType.Sync);
  const cacheStore = Kinvey.DataStore.collection(deltaCollectionName, Kinvey.DataStoreType.Cache);
  const deltaSyncStore = Kinvey.DataStore.collection(deltaCollectionName, Kinvey.DataStoreType.Sync, { useDeltaSet: true });
  const deltaCacheStore = Kinvey.DataStore.collection(deltaCollectionName, Kinvey.DataStoreType.Cache, { useDeltaSet: true });
  const tagStore = 'kinveyTest';

  const validatePullOperation = (result, expectedItems, expectedPulledItemsCount, tagStore, collectionName) => {
    const collectioNameForStore = collectionName ? collectionName : deltaCollectionName;
    const taggedDataStore = tagStore ? Kinvey.DataStore.collection(deltaCollectionName, Kinvey.DataStoreType.Sync, { tag: tagStore }) : null;
    const syncStoreToFind = Kinvey.DataStore.collection(collectioNameForStore, Kinvey.DataStoreType.Sync)
    expect(result).to.equal(expectedPulledItemsCount || expectedItems.length);
    const storeToFind = tagStore ? taggedDataStore : syncStoreToFind;
    return storeToFind.find().toPromise()
      .then((result) => {
        expectedItems.forEach((entity) => {
          const cachedEntity = _.find(result, e => e._id === entity._id);
          expect(utilities.deleteEntityMetadata(cachedEntity)).to.deep.equal(entity);
        });
      });
  }

  const validateNewPullOperation = (result, expectedPulledItems, expectedDeletedItems, tagStore) => {
    expect(result).to.equal(expectedPulledItems.length);
    const storeToFind = tagStore ? Kinvey.DataStore.collection(deltaCollectionName, Kinvey.DataStoreType.Sync, { tag: tagStore }) : syncStore;
    return storeToFind.find().toPromise()
      .then((result) => {
        expectedPulledItems.forEach((entity) => {
          const cachedEntity = _.find(result, e => e._id === entity._id);
          expect(utilities.deleteEntityMetadata(cachedEntity)).to.deep.equal(entity);
        });

        expectedDeletedItems.forEach((entity) => {
          const deletedEntity = _.find(result, e => e._id === entity._id);
          expect(deletedEntity).to.equal(undefined);
        });
      });
  }

  dataStoreTypes.forEach((currentDataStoreType) => {
    describe(`${currentDataStoreType} Deltaset tests`, () => {
      const conditionalDescribe = currentDataStoreType === Kinvey.DataStoreType.Sync ? describe.skip : describe;
      describe('pull', () => {
        const entity1 = utilities.getEntity(utilities.randomString());
        const entity2 = utilities.getEntity(utilities.randomString());
        const entity3 = utilities.getEntity(utilities.randomString());
        const createdUserIds = [];
        const deltaStoreToTest = Kinvey.DataStore.collection(deltaCollectionName, currentDataStoreType, { useDeltaSet: true });
        const taggedDeltaStoreToTest = Kinvey.DataStore.collection(deltaCollectionName, currentDataStoreType, { useDeltaSet: true, tag: tagStore });

        before((done) => {
          utilities.cleanUpAppData(deltaCollectionName, createdUserIds)
            .then(() => Kinvey.User.signup())
            .then((user) => {
              createdUserIds.push(user.data._id);
              done();
            })
            .catch(done);
        });

        beforeEach((done) => {
          utilities.cleanUpCollectionData(deltaCollectionName)
            .then(() => deltaNetworkStore.save(entity1))
            .then(() => deltaNetworkStore.save(entity2))
            .then(() => done())
            .catch(done);
        });

        after((done) => {
          utilities.cleanUpAppData(deltaCollectionName, createdUserIds)
            .then(() => done())
            .catch(done);
        });

        it('should return correct number of items without changes', (done) => {
          deltaStoreToTest.pull()
            .then((result) => validatePullOperation(result, [entity1, entity2]))
            .then(() => deltaStoreToTest.pull())
            .then((result) => validateNewPullOperation(result, [], []))
            .then(() => done())
            .catch((error) => done(error));
        });

        it('should return correct number of items with disabled deltaset', (done) => {
          const disabledDeltaSetStore = currentDataStoreType === Kinvey.DataStoreType.Cache ? cacheStore : syncStore;
          disabledDeltaSetStore.pull()
            .then((result) => validatePullOperation(result, [entity1, entity2]))
            .then(() => disabledDeltaSetStore.pull())
            .then((result) => validatePullOperation(result, [entity1, entity2]))
            .then(() => done())
            .catch(done);
        });

        it('should return correct number of items with created item', (done) => {
          const entity4 = utilities.getEntity(utilities.randomString());
          const entity5 = utilities.getEntity(utilities.randomString());
          deltaStoreToTest.pull()
            .then((result) => validatePullOperation(result, [entity1, entity2]))
            .then(() => deltaNetworkStore.save(entity3))
            .then(() => deltaStoreToTest.pull())
            .then((result) => validateNewPullOperation(result, [entity3], []))
            .then(() => deltaNetworkStore.save(entity4))
            .then(() => deltaNetworkStore.save(entity5))
            .then(() => deltaStoreToTest.pull())
            .then((result) => validateNewPullOperation(result, [entity4, entity5], []))
            .then(() => done())
            .catch(done);
        });

        it('should return correct number of items with created item with 3rd request', (done) => {
          const entity4 = utilities.getEntity(utilities.randomString());
          deltaStoreToTest.pull()
            .then((result) => validatePullOperation(result, [entity1, entity2]))
            .then(() => deltaNetworkStore.save(entity3))
            .then(() => deltaStoreToTest.pull())
            .then((result) => validateNewPullOperation(result, [entity3], []))
            .then(() => deltaNetworkStore.save(entity4))
            .then(() => deltaStoreToTest.pull())
            .then((result) => validateNewPullOperation(result, [entity4], []))
            .then(() => done())
            .catch(done);
        });

        it('should return correct number of items with auto-pagination', (done) => {
          deltaStoreToTest.pull(new Kinvey.Query(), { autoPagination: true })
            .then((result) => validatePullOperation(result, [entity1, entity2]))
            .then(() => deltaNetworkStore.save(entity3))
            .then(() => deltaStoreToTest.pull(new Kinvey.Query(), { autoPagination: true }))
            .then((result) => validateNewPullOperation(result, [entity3], []))
            .then(() => done())
            .catch(done);
        });

        it('should return correct number of items with auto-pagination and skip and limit', (done) => {
          const query = new Kinvey.Query();
          query.skip = 1;
          query.limit = 2;
          deltaStoreToTest.pull(query, { autoPagination: true })
            .then((result) => validatePullOperation(result, [entity1, entity2]))
            .then(() => deltaNetworkStore.save(entity3))
            .then(() => deltaStoreToTest.pull(query, { autoPagination: true }))
            .then((result) => validateNewPullOperation(result, [entity1, entity2, entity3], []))
            .then(() => done())
            .catch(done);
        });

        // it('should return correct number of items with tagged dataStore', (done) => {
        //   const onNextSpy = sinon.spy();
        //   syncStore.save(entity1)
        //     .then(() => taggedDeltaStoreToTest.pull())
        //     .then((result) => validatePullOperation(result, [entity1, entity2], 2, tagStore))
        //     .then(() => deltaNetworkStore.save(entity3))
        //     .then(() => taggedDeltaStoreToTest.pull())
        //     .then((result) => validateNewPullOperation(result, [entity3], [], tagStore))
        //     .then(() => deltaNetworkStore.removeById(entity1._id))
        //     .then(() => taggedDeltaStoreToTest.pull())
        //     .then((result) => { validateNewPullOperation(result, [], [entity1], tagStore) })
        //     .then(() => {
        //       syncStore.find()
        //         .subscribe(onNextSpy, done, () => {
        //           try {
        //             utilities.validateReadResult(Kinvey.DataStoreType.Sync, onNextSpy, [entity1]);
        //             done();
        //           } catch (error) {
        //             done(error);
        //           }
        //         })
        //     })
        //     .catch(done);
        // });

        // it('should return correct number of items with deleted item', (done) => {
        //   deltaNetworkStore.save(entity3)
        //     .then(() => deltaStoreToTest.pull())
        //     .then((result) => validatePullOperation(result, [entity1, entity2, entity3]))
        //     .then(() => deltaNetworkStore.removeById(entity1._id))
        //     .then(() => deltaStoreToTest.pull())
        //     .then((result) => validateNewPullOperation(result, [], [entity1]))
        //     .then(() => deltaNetworkStore.removeById(entity2._id))
        //     .then(() => deltaNetworkStore.removeById(entity3._id))
        //     .then(() => deltaStoreToTest.pull())
        //     .then((result) => validateNewPullOperation(result, [], [entity2, entity3]))
        //     .then(() => done())
        //     .catch(done);
        // });

        // it('should return correct number of items with updated item', (done) => {
        //   const updatedEntity = _.clone(entity2);
        //   const updatedEntity1 = _.clone(entity1);
        //   const updatedEntity2 = _.clone(entity3);
        //   updatedEntity.textField = utilities.randomString();
        //   updatedEntity1.textField = utilities.randomString();
        //   updatedEntity2.textField = utilities.randomString();
        //   deltaNetworkStore.save(entity3)
        //     .then(() => deltaStoreToTest.pull())
        //     .then((result) => validatePullOperation(result, [entity1, entity2, entity3]))
        //     .then(() => deltaNetworkStore.save(updatedEntity))
        //     .then(() => deltaStoreToTest.pull())
        //     .then((result) => validateNewPullOperation(result, [updatedEntity], []))
        //     .then(() => deltaNetworkStore.save(updatedEntity1))
        //     .then(() => deltaNetworkStore.save(updatedEntity2))
        //     .then(() => deltaStoreToTest.pull())
        //     .then((result) => validateNewPullOperation(result, [updatedEntity1, updatedEntity2], []))
        //     .then(() => done())
        //     .catch(done);
        // });

        // it('should return correct number of items with updated and deleted item', (done) => {
        //   const entity4 = utilities.getEntity(utilities.randomString())
        //   const updatedEntity = _.clone(entity2);
        //   const updatedEntity1 = _.clone(entity1);
        //   const updatedEntity2 = _.clone(entity3);
        //   updatedEntity.textField = utilities.randomString();
        //   updatedEntity1.textField = utilities.randomString();
        //   updatedEntity2.textField = utilities.randomString();
        //   deltaNetworkStore.save(entity3)
        //     .then(() => deltaNetworkStore.save(entity4))
        //     .then(() => deltaStoreToTest.pull())
        //     .then((result) => validatePullOperation(result, [entity1, entity2, entity3, entity4]))
        //     .then(() => deltaNetworkStore.save(updatedEntity))
        //     .then(() => deltaNetworkStore.removeById(entity1._id))
        //     .then(() => deltaStoreToTest.pull())
        //     .then((result) => validateNewPullOperation(result, [updatedEntity], [entity1]))
        //     .then(() => deltaNetworkStore.save(updatedEntity2))
        //     .then(() => deltaNetworkStore.removeById(updatedEntity._id))
        //     .then(() => deltaNetworkStore.removeById(entity4._id))
        //     .then(() => deltaStoreToTest.pull())
        //     .then((result) => validateNewPullOperation(result, [updatedEntity2], [updatedEntity, entity4]))
        //     .then(() => done())
        //     .catch(done);
        // });

        // it('should return correct number of items with query with updated item', (done) => {
        //   const entity4 = utilities.getEntity(utilities.randomString(), 'queryValue');
        //   const entity5 = utilities.getEntity(utilities.randomString(), 'queryValue');
        //   const entity6 = utilities.getEntity(utilities.randomString(), 'queryValue');
        //   const updatedEntity = _.clone(entity5);
        //   updatedEntity.numberField = 5;
        //   const query = new Kinvey.Query();
        //   query.equalTo('textField', 'queryValue');
        //   deltaNetworkStore.save(entity4)
        //     .then(() => deltaNetworkStore.save(entity5))
        //     .then(() => deltaNetworkStore.save(entity6))
        //     .then(() => deltaStoreToTest.pull(query)
        //       .then((result) => validatePullOperation(result, [entity4, entity5, entity6]))
        //       .then(() => deltaNetworkStore.save(updatedEntity))
        //       .then(() => deltaStoreToTest.pull(query))
        //       .then((result) => validateNewPullOperation(result, [updatedEntity], []))
        //       .then(() => done()))
        //     .catch(done);
        // });

        // it('should return correct number of items with query with deleted item', (done) => {
        //   const entity4 = utilities.getEntity(utilities.randomString(), 'queryValue');
        //   const entity5 = utilities.getEntity(utilities.randomString(), 'queryValue');
        //   const entity6 = utilities.getEntity(utilities.randomString(), 'queryValue');
        //   const query = new Kinvey.Query();
        //   query.equalTo('textField', 'queryValue');
        //   deltaNetworkStore.save(entity4)
        //     .then(() => deltaNetworkStore.save(entity5))
        //     .then(() => deltaNetworkStore.save(entity6))
        //     .then(() => deltaStoreToTest.pull(query)
        //       .then((result) => validatePullOperation(result, [entity4, entity5, entity6]))
        //       .then(() => deltaNetworkStore.removeById(entity5._id))
        //       .then(() => deltaStoreToTest.pull(query))
        //       .then((result) => validateNewPullOperation(result, [], [entity5]))
        //       .then(() => done()))
        //     .catch(done);
        // });

        // it('should not use deltaset with skip and limit query and should not record X-Kinvey-Request-Start', (done) => {
        //   const entity4 = utilities.getEntity(utilities.randomString(), 'queryValue', 1);
        //   const entity5 = utilities.getEntity(utilities.randomString(), 'queryValue', 2);
        //   const entity6 = utilities.getEntity(utilities.randomString(), 'queryValue', 3);
        //   const query = new Kinvey.Query();
        //   query.ascending('numberField');
        //   query.limit = 1;
        //   query.skip = 1;
        //   query.equalTo('textField', 'queryValue');
        //   const queryWithoutModifiers = new Kinvey.Query();
        //   queryWithoutModifiers.equalTo('textField', 'queryValue');
        //   deltaNetworkStore.save(entity4)
        //     .then(() => deltaNetworkStore.save(entity5))
        //     .then(() => deltaNetworkStore.save(entity6))
        //     .then(() => deltaStoreToTest.pull(queryWithoutModifiers))
        //     .then((result) => validatePullOperation(result, [entity4, entity5, entity6]))
        //     .then(() => deltaNetworkStore.removeById(entity4._id))
        //     .then(() => deltaStoreToTest.pull(query))
        //     .then((result) => validatePullOperation(result, [entity6]))
        //     .then(() => deltaStoreToTest.pull(query))
        //     .then((result) => validatePullOperation(result, [entity6]))
        //     .then(() => deltaStoreToTest.pull(queryWithoutModifiers))
        //     .then((result) => validateNewPullOperation(result, [], [entity4]))
        //     .then(() => done())
        //     .catch(done);

        // });

        // it('limit and skip query should not delete data', (done) => {
        //   const onNextSpy = sinon.spy();
        //   const query = new Kinvey.Query();
        //   query.limit = 2;
        //   query.skip = 1;
        //   deltaNetworkStore.save(entity3)
        //     .then(() => deltaStoreToTest.pull())
        //     .then((result) => validatePullOperation(result, [entity1, entity2, entity3]))
        //     .then(() => deltaStoreToTest.pull(query))
        //     .then((result) => validatePullOperation(result, [entity2, entity3]))
        //     .then(() => deltaStoreToTest.pull())
        //     .then((result) => validateNewPullOperation(result, [], []))
        //     .then(() => {
        //       syncStore.find()
        //         .subscribe(onNextSpy, done, () => {
        //           try {
        //             utilities.validateReadResult(Kinvey.DataStoreType.Sync, onNextSpy, [entity1, entity2, entity3], [], true);
        //             done();
        //           } catch (error) {
        //             done(error);
        //           }
        //         })
        //     })
        //     .catch(done);

        // });
      });
    });
  });
}

runner.run(testFunc);
