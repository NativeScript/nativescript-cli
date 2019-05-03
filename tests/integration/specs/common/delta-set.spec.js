import { expect } from 'chai';
import sinon from 'sinon';
import _ from 'lodash';
import * as Kinvey from '__SDK__';
import * as config from '../config';
import * as utilities from '../utils';

const dataStoreTypes = [Kinvey.DataStoreType.Cache, Kinvey.DataStoreType.Sync];

before(() => {
  const initProperties = {
    appKey: process.env.APP_KEY,
    appSecret: process.env.APP_SECRET,
    masterSecret: process.env.MASTER_SECRET
  }
  return Kinvey.init(utilities.setOfflineProvider(initProperties, process.env.OFFLINE_STORAGE));
});

dataStoreTypes.forEach((currentDataStoreType) => {
  describe(`${currentDataStoreType} Deltaset tests`, () => {
    const conditionalDescribe = currentDataStoreType === Kinvey.DataStoreType.Sync ? describe.skip : describe;
    const deltaCollectionName = config.deltaCollectionName;
    const secondDeltaCollectionName = config.secondDeltaCollectioName;
    const collectionWithoutDelta = config.collectionName;
    const tagStore = 'kinveyTest';
    let deltaNetworkStore;
    let syncStore;
    let cacheStore;
    let deltaSyncStore;
    let deltaCacheStore;

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

    const validateNewPullOperation = (result, expectedPulledItems, expectedDeletedItems, tagStore, collectionName) => {
      const collectioNameForStore = collectionName ? collectionName : deltaCollectionName;
      expect(result).to.equal(expectedPulledItems.length);
      let storeToFind;
      if (tagStore){
        storeToFind = Kinvey.DataStore.collection(collectioNameForStore, Kinvey.DataStoreType.Sync, { tag: tagStore });
      }
      else{
        storeToFind = collectionName? Kinvey.DataStore.collection(collectioNameForStore, Kinvey.DataStoreType.Sync) : syncStore;
      }
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

    before(() => {
      deltaNetworkStore = Kinvey.DataStore.collection(deltaCollectionName, Kinvey.DataStoreType.Network);
      syncStore = Kinvey.DataStore.collection(deltaCollectionName, Kinvey.DataStoreType.Sync);
      cacheStore = Kinvey.DataStore.collection(deltaCollectionName, Kinvey.DataStoreType.Cache);
      deltaSyncStore = Kinvey.DataStore.collection(deltaCollectionName, Kinvey.DataStoreType.Sync, { useDeltaSet: true });
      deltaCacheStore = Kinvey.DataStore.collection(deltaCollectionName, Kinvey.DataStoreType.Cache, { useDeltaSet: true });
    });

    describe('pull', () => {
      const entity1 = utilities.getEntity(utilities.randomString());
      const entity2 = utilities.getEntity(utilities.randomString());
      const entity3 = utilities.getEntity(utilities.randomString());
      const entity1Col2 = utilities.getEntity(utilities.randomString());
      const entity2Col2 = utilities.getEntity(utilities.randomString());
      const entity3Col2 = utilities.getEntity(utilities.randomString());
      const createdUserIds = [];
      let deltaStoreToTest;
      let taggedDeltaStoreToTest;

      before(() => {
        deltaStoreToTest = Kinvey.DataStore.collection(deltaCollectionName, currentDataStoreType, { useDeltaSet: true });
        taggedDeltaStoreToTest = Kinvey.DataStore.collection(deltaCollectionName, currentDataStoreType, { useDeltaSet: true, tag: tagStore });
      });

      before((done) => {
        utilities.cleanUpAppData(deltaCollectionName, createdUserIds)
          .then(() => utilities.cleanUpAppData(secondDeltaCollectionName, createdUserIds))
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

      it('should return corrsect number of items for multiple collections', (done) => {
        const secondDeltaCollection = Kinvey.DataStore.collection(secondDeltaCollectionName, currentDataStoreType, { useDeltaSet: true });
        const secondDeltaCollectionNetwork = Kinvey.DataStore.collection(secondDeltaCollectionName, Kinvey.DataStoreType.Network);
        const secondDeltaCollectionSync = Kinvey.DataStore.collection(secondDeltaCollectionName, Kinvey.DataStoreType.Sync);
        secondDeltaCollectionNetwork.save(entity1Col2)
          .then(() => deltaStoreToTest.pull())
          .then((result) => validatePullOperation(result, [entity1, entity2]))
          .then(() => deltaNetworkStore.save(entity3))
          .then(() => secondDeltaCollectionNetwork.save(entity2Col2))
          .then(() => secondDeltaCollection.pull())
          .then((result) => validatePullOperation(result, [entity1Col2, entity2Col2], 2, null, secondDeltaCollectionName))
          .then(() => secondDeltaCollectionNetwork.save(entity3Col2))
          .then(() => deltaStoreToTest.pull())
          .then((result) => validateNewPullOperation(result, [entity3], []))
          .then(() => secondDeltaCollection.pull())
          .then((result) => validateNewPullOperation(result, [entity3Col2], [], null, secondDeltaCollectionName))
          .then(() => done())
          .catch((error) => done(error));
      })

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

      it('should return correct number of items with tagged dataStore', (done) => {
        const onNextSpy = sinon.spy();
        syncStore.save(entity1)
          .then(() => taggedDeltaStoreToTest.pull())
          .then((result) => validatePullOperation(result, [entity1, entity2], 2, tagStore))
          .then(() => deltaNetworkStore.save(entity3))
          .then(() => taggedDeltaStoreToTest.pull())
          .then((result) => validateNewPullOperation(result, [entity3], [], tagStore))
          .then(() => deltaNetworkStore.removeById(entity1._id))
          .then(() => taggedDeltaStoreToTest.pull())
          .then((result) => { validateNewPullOperation(result, [], [entity1], tagStore) })
          .then(() => {
            syncStore.find()
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(Kinvey.DataStoreType.Sync, onNextSpy, [entity1]);
                  done();
                } catch (error) {
                  done(error);
                }
              })
          })
          .catch(done);
      });

      it('should return correct number of items with deleted item', (done) => {
        deltaNetworkStore.save(entity3)
          .then(() => deltaStoreToTest.pull())
          .then((result) => validatePullOperation(result, [entity1, entity2, entity3]))
          .then(() => deltaNetworkStore.removeById(entity1._id))
          .then(() => deltaStoreToTest.pull())
          .then((result) => validateNewPullOperation(result, [], [entity1]))
          .then(() => deltaNetworkStore.removeById(entity2._id))
          .then(() => deltaNetworkStore.removeById(entity3._id))
          .then(() => deltaStoreToTest.pull())
          .then((result) => validateNewPullOperation(result, [], [entity2, entity3]))
          .then(() => done())
          .catch(done);
      });

      it('should return correct number of items with updated item', (done) => {
        const updatedEntity = _.clone(entity2);
        const updatedEntity1 = _.clone(entity1);
        const updatedEntity2 = _.clone(entity3);
        updatedEntity.textField = utilities.randomString();
        updatedEntity1.textField = utilities.randomString();
        updatedEntity2.textField = utilities.randomString();
        deltaNetworkStore.save(entity3)
          .then(() => deltaStoreToTest.pull())
          .then((result) => validatePullOperation(result, [entity1, entity2, entity3]))
          .then(() => deltaNetworkStore.save(updatedEntity))
          .then(() => deltaStoreToTest.pull())
          .then((result) => validateNewPullOperation(result, [updatedEntity], []))
          .then(() => deltaNetworkStore.save(updatedEntity1))
          .then(() => deltaNetworkStore.save(updatedEntity2))
          .then(() => deltaStoreToTest.pull())
          .then((result) => validateNewPullOperation(result, [updatedEntity1, updatedEntity2], []))
          .then(() => done())
          .catch(done);
      });

      it('should return correct number of items with updated and deleted item', (done) => {
        const entity4 = utilities.getEntity(utilities.randomString())
        const updatedEntity = _.clone(entity2);
        const updatedEntity1 = _.clone(entity1);
        const updatedEntity2 = _.clone(entity3);
        updatedEntity.textField = utilities.randomString();
        updatedEntity1.textField = utilities.randomString();
        updatedEntity2.textField = utilities.randomString();
        deltaNetworkStore.save(entity3)
          .then(() => deltaNetworkStore.save(entity4))
          .then(() => deltaStoreToTest.pull())
          .then((result) => validatePullOperation(result, [entity1, entity2, entity3, entity4]))
          .then(() => deltaNetworkStore.save(updatedEntity))
          .then(() => deltaNetworkStore.removeById(entity1._id))
          .then(() => deltaStoreToTest.pull())
          .then((result) => validateNewPullOperation(result, [updatedEntity], [entity1]))
          .then(() => deltaNetworkStore.save(updatedEntity2))
          .then(() => deltaNetworkStore.removeById(updatedEntity._id))
          .then(() => deltaNetworkStore.removeById(entity4._id))
          .then(() => deltaStoreToTest.pull())
          .then((result) => validateNewPullOperation(result, [updatedEntity2], [updatedEntity, entity4]))
          .then(() => done())
          .catch(done);
      });

      it('should return correct number of items with query with updated item', (done) => {
        const entity4 = utilities.getEntity(utilities.randomString(), 'queryValue');
        const entity5 = utilities.getEntity(utilities.randomString(), 'queryValue');
        const entity6 = utilities.getEntity(utilities.randomString(), 'queryValue');
        const updatedEntity = _.clone(entity5);
        updatedEntity.numberField = 5;
        const query = new Kinvey.Query();
        query.equalTo('textField', 'queryValue');
        deltaNetworkStore.save(entity4)
          .then(() => deltaNetworkStore.save(entity5))
          .then(() => deltaNetworkStore.save(entity6))
          .then(() => deltaStoreToTest.pull(query)
            .then((result) => validatePullOperation(result, [entity4, entity5, entity6]))
            .then(() => deltaNetworkStore.save(updatedEntity))
            .then(() => deltaStoreToTest.pull(query))
            .then((result) => validateNewPullOperation(result, [updatedEntity], []))
            .then(() => done()))
          .catch(done);
      });

      it('should return correct number of items with query with deleted item', (done) => {
        const entity4 = utilities.getEntity(utilities.randomString(), 'queryValue');
        const entity5 = utilities.getEntity(utilities.randomString(), 'queryValue');
        const entity6 = utilities.getEntity(utilities.randomString(), 'queryValue');
        const query = new Kinvey.Query();
        query.equalTo('textField', 'queryValue');
        deltaNetworkStore.save(entity4)
          .then(() => deltaNetworkStore.save(entity5))
          .then(() => deltaNetworkStore.save(entity6))
          .then(() => deltaStoreToTest.pull(query)
            .then((result) => validatePullOperation(result, [entity4, entity5, entity6]))
            .then(() => deltaNetworkStore.removeById(entity5._id))
            .then(() => deltaStoreToTest.pull(query))
            .then((result) => validateNewPullOperation(result, [], [entity5]))
            .then(() => done()))
          .catch(done);
      });

      it('should not use deltaset with skip and limit query and should not record X-Kinvey-Request-Start', (done) => {
        const entity4 = utilities.getEntity(utilities.randomString(), 'queryValue', 1);
        const entity5 = utilities.getEntity(utilities.randomString(), 'queryValue', 2);
        const entity6 = utilities.getEntity(utilities.randomString(), 'queryValue', 3);
        const query = new Kinvey.Query();
        query.ascending('numberField');
        query.limit = 1;
        query.skip = 1;
        query.equalTo('textField', 'queryValue');
        const queryWithoutModifiers = new Kinvey.Query();
        queryWithoutModifiers.equalTo('textField', 'queryValue');
        deltaNetworkStore.save(entity4)
          .then(() => deltaNetworkStore.save(entity5))
          .then(() => deltaNetworkStore.save(entity6))
          .then(() => deltaStoreToTest.pull(queryWithoutModifiers))
          .then((result) => validatePullOperation(result, [entity4, entity5, entity6]))
          .then(() => deltaNetworkStore.removeById(entity4._id))
          .then(() => deltaStoreToTest.pull(query))
          .then((result) => validatePullOperation(result, [entity6]))
          .then(() => deltaStoreToTest.pull(query))
          .then((result) => validatePullOperation(result, [entity6]))
          .then(() => deltaStoreToTest.pull(queryWithoutModifiers))
          .then((result) => validateNewPullOperation(result, [], [entity4]))
          .then(() => done())
          .catch(done);

      });

      it('limit and skip query should not delete data', (done) => {
        const onNextSpy = sinon.spy();
        const query = new Kinvey.Query();
        query.limit = 2;
        query.skip = 1;
        deltaNetworkStore.save(entity3)
          .then(() => deltaStoreToTest.pull())
          .then((result) => validatePullOperation(result, [entity1, entity2, entity3]))
          .then(() => deltaStoreToTest.pull(query))
          .then((result) => validatePullOperation(result, [entity2, entity3]))
          .then(() => deltaStoreToTest.pull())
          .then((result) => validateNewPullOperation(result, [], []))
          .then(() => {
            syncStore.find()
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(Kinvey.DataStoreType.Sync, onNextSpy, [entity1, entity2, entity3], [], true);
                  done();
                } catch (error) {
                  done(error);
                }
              })
          })
          .catch(done);

      });
    });

    describe('sync', () => {
      const dataStoreType = currentDataStoreType;
      const entity1 = utilities.getEntity(utilities.randomString());
      const entity2 = utilities.getEntity(utilities.randomString());
      const entity3 = utilities.getEntity(utilities.randomString());
      const createdUserIds = [];
      let deltaStoreToTest;
      let taggedDeltaStoreToTest;

      before(() => {
        deltaStoreToTest = Kinvey.DataStore.collection(deltaCollectionName, currentDataStoreType, { useDeltaSet: true });
        taggedDeltaStoreToTest = Kinvey.DataStore.collection(deltaCollectionName, currentDataStoreType, { useDeltaSet: true, tag: tagStore });
      });

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
        deltaStoreToTest.sync()
          .then((result) => validatePullOperation(result.pull, [entity1, entity2]))
          .then(() => deltaStoreToTest.pull())
          .then((result) => validateNewPullOperation(result, [], []))
          .then(() => done())
          .catch(done);
      });

      it('should return correct number of items with disabled deltaset', (done) => {
        let deisabledDeltaSetStore = currentDataStoreType === Kinvey.DataStoreType.Cache ? cacheStore : syncStore;
        deisabledDeltaSetStore.sync()
          .then((result) => validatePullOperation(result.pull, [entity1, entity2]))
          .then(() => deisabledDeltaSetStore.sync())
          .then((result) => validatePullOperation(result.pull, [entity1, entity2]))
          .then(() => done())
          .catch(done);
      });

      it('should return correct number of items with tagged dataStore', (done) => {
        const onNextSpy = sinon.spy();
        syncStore.save(entity1)
          .then(() => taggedDeltaStoreToTest.sync())
          .then((result) => validatePullOperation(result.pull, [entity1, entity2], 2, tagStore))
          .then(() => deltaNetworkStore.save(entity3))
          .then(() => taggedDeltaStoreToTest.sync())
          .then((result) => validateNewPullOperation(result.pull, [entity3], [], tagStore))
          .then(() => deltaNetworkStore.removeById(entity1._id))
          .then(() => taggedDeltaStoreToTest.sync())
          .then((result) => { validateNewPullOperation(result.pull, [], [entity1], tagStore) })
          .then(() => {
            syncStore.find()
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(Kinvey.DataStoreType.Sync, onNextSpy, [entity1]);
                  done();
                } catch (error) {
                  done(error);
                }
              })
          })
          .catch(done);
      });

      it('should return correct number of items with created item', (done) => {
        const entity4 = utilities.getEntity(utilities.randomString());
        const entity5 = utilities.getEntity(utilities.randomString());
        deltaStoreToTest.sync()
          .then((result) => validatePullOperation(result.pull, [entity1, entity2]))
          .then(() => deltaNetworkStore.save(entity3))
          .then(() => deltaStoreToTest.sync())
          .then((result) => validateNewPullOperation(result.pull, [entity3], []))
          .then(() => deltaNetworkStore.save(entity4))
          .then(() => deltaNetworkStore.save(entity5))
          .then(() => deltaStoreToTest.sync())
          .then((result) => validateNewPullOperation(result.pull, [entity4, entity5], []))
          .then(() => done())
          .catch(done);
      });

      it('should return correct number of items with created item with 3rd request', (done) => {
        const entity4 = utilities.getEntity(utilities.randomString());
        deltaStoreToTest.sync()
          .then((result) => validatePullOperation(result.pull, [entity1, entity2]))
          .then(() => deltaNetworkStore.save(entity3))
          .then(() => deltaStoreToTest.sync())
          .then((result) => validateNewPullOperation(result.pull, [entity3], []))
          .then(() => deltaNetworkStore.save(entity4))
          .then(() => deltaStoreToTest.sync())
          .then((result) => validateNewPullOperation(result.pull, [entity4], []))
          .then(() => done())
          .catch(done);
      });

      it('should return correct number of items with auto-pagination', (done) => {
        deltaStoreToTest.sync(new Kinvey.Query(), { autoPagination: true })
          .then((result) => validatePullOperation(result.pull, [entity1, entity2]))
          .then(() => deltaNetworkStore.save(entity3))
          .then(() => deltaStoreToTest.sync(new Kinvey.Query(), { autoPagination: true }))
          .then((result) => validateNewPullOperation(result.pull, [entity3], []))
          .then(() => done())
          .catch(done);
      });

      it('should return correct number of items with auto-pagination and skip and limit', (done) => {
        const query = new Kinvey.Query();
        query.skip = 1;
        query.limit = 2;
        deltaStoreToTest.sync(query, { autoPagination: true })
          .then((result) => validatePullOperation(result.pull, [entity1, entity2]))
          .then(() => deltaNetworkStore.save(entity3))
          .then(() => deltaStoreToTest.sync(query, { autoPagination: true }))
          .then((result) => validateNewPullOperation(result.pull, [entity1, entity2, entity3], []))
          .then(() => done())
          .catch(done);
      });


      it('should return correct number of items with tagged dataStore', (done) => {
        const onNextSpy = sinon.spy();
        syncStore.save(entity1)
          .then(() => taggedDeltaStoreToTest.sync())
          .then((result) => validatePullOperation(result.pull, [entity1, entity2], 2, tagStore))
          .then(() => deltaNetworkStore.save(entity3))
          .then(() => taggedDeltaStoreToTest.sync())
          .then((result) => validateNewPullOperation(result.pull, [entity3], [], tagStore))
          .then(() => deltaNetworkStore.removeById(entity1._id))
          .then(() => taggedDeltaStoreToTest.sync())
          .then((result) => { validateNewPullOperation(result.pull, [], [entity1], tagStore) })
          .then(() => {
            syncStore.find()
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(Kinvey.DataStoreType.Sync, onNextSpy, [entity1]);
                  done();
                } catch (error) {
                  done(error);
                }
              })
          })
          .catch(done);
      });

      it('should return correct number of items with deleted item', (done) => {
        deltaNetworkStore.save(entity3)
          .then(() => deltaStoreToTest.sync())
          .then((result) => validatePullOperation(result.pull, [entity1, entity2, entity3]))
          .then(() => deltaNetworkStore.removeById(entity1._id))
          .then(() => deltaStoreToTest.sync())
          .then((result) => validateNewPullOperation(result.pull, [], [entity1]))
          .then(() => deltaNetworkStore.removeById(entity2._id))
          .then(() => deltaNetworkStore.removeById(entity3._id))
          .then(() => deltaStoreToTest.sync())
          .then((result) => validateNewPullOperation(result.pull, [], [entity2, entity3]))
          .then(() => done())
          .catch(done);
      });

      it('should return correct number of items with updated item', (done) => {
        const updatedEntity = _.clone(entity2);
        const updatedEntity1 = _.clone(entity1);
        const updatedEntity2 = _.clone(entity3);
        updatedEntity.textField = utilities.randomString();
        updatedEntity1.textField = utilities.randomString();
        updatedEntity2.textField = utilities.randomString();
        deltaNetworkStore.save(entity3)
          .then(() => deltaStoreToTest.sync())
          .then((result) => validatePullOperation(result.pull, [entity1, entity2, entity3]))
          .then(() => deltaNetworkStore.save(updatedEntity))
          .then(() => deltaStoreToTest.sync())
          .then((result) => validateNewPullOperation(result.pull, [updatedEntity], []))
          .then(() => deltaNetworkStore.save(updatedEntity1))
          .then(() => deltaNetworkStore.save(updatedEntity2))
          .then(() => deltaStoreToTest.sync())
          .then((result) => validateNewPullOperation(result.pull, [updatedEntity1, updatedEntity2], []))
          .then(() => done())
          .catch(done);
      });

      it('should return correct number of items with updated and deleted item', (done) => {
        const entity4 = utilities.getEntity(utilities.randomString())
        const updatedEntity = _.clone(entity2);
        const updatedEntity1 = _.clone(entity1);
        const updatedEntity2 = _.clone(entity3);
        updatedEntity.textField = utilities.randomString();
        updatedEntity1.textField = utilities.randomString();
        updatedEntity2.textField = utilities.randomString();
        deltaNetworkStore.save(entity3)
          .then(() => deltaNetworkStore.save(entity4))
          .then(() => deltaStoreToTest.sync())
          .then((result) => validatePullOperation(result.pull, [entity1, entity2, entity3, entity4]))
          .then(() => deltaNetworkStore.save(updatedEntity))
          .then(() => deltaNetworkStore.removeById(entity1._id))
          .then(() => deltaStoreToTest.sync())
          .then((result) => validateNewPullOperation(result.pull, [updatedEntity], [entity1]))
          .then(() => deltaNetworkStore.save(updatedEntity2))
          .then(() => deltaNetworkStore.removeById(updatedEntity._id))
          .then(() => deltaNetworkStore.removeById(entity4._id))
          .then(() => deltaStoreToTest.sync())
          .then((result) => validateNewPullOperation(result.pull, [updatedEntity2], [updatedEntity, entity4]))
          .then(() => done())
          .catch(done);
      });

      it('should return correct number of items with query with updated item', (done) => {
        const entity4 = utilities.getEntity(utilities.randomString(), 'queryValue');
        const entity5 = utilities.getEntity(utilities.randomString(), 'queryValue');
        const entity6 = utilities.getEntity(utilities.randomString(), 'queryValue');
        const updatedEntity = _.clone(entity5);
        updatedEntity.numberField = 5;
        const query = new Kinvey.Query();
        query.equalTo('textField', 'queryValue');
        deltaNetworkStore.save(entity4)
          .then(() => deltaNetworkStore.save(entity5))
          .then(() => deltaNetworkStore.save(entity6))
          .then(() => deltaStoreToTest.sync(query)
            .then((result) => validatePullOperation(result.pull, [entity4, entity5, entity6]))
            .then(() => deltaNetworkStore.save(updatedEntity))
            .then(() => deltaStoreToTest.sync(query))
            .then((result) => validateNewPullOperation(result.pull, [updatedEntity], []))
            .then(() => done()))
          .catch(done);
      });

      it('should return correct number of items with query with deleted item', (done) => {
        let entity4 = utilities.getEntity(utilities.randomString(), 'queryValue');
        let entity5 = utilities.getEntity(utilities.randomString(), 'queryValue');
        let entity6 = utilities.getEntity(utilities.randomString(), 'queryValue');
        let query = new Kinvey.Query();
        query.equalTo('textField', 'queryValue');
        deltaNetworkStore.save(entity4)
          .then(() => deltaNetworkStore.save(entity5))
          .then(() => deltaNetworkStore.save(entity6))
          .then(() => deltaStoreToTest.sync(query)
            .then((result) => validatePullOperation(result.pull, [entity4, entity5, entity6]))
            .then(() => deltaNetworkStore.removeById(entity5._id))
            .then(() => deltaStoreToTest.sync(query))
            .then((result) => validateNewPullOperation(result.pull, [], [entity5]))
            .then(() => done()))
          .catch(done);
      });

      it('should not use deltaset with skip and limit query and should not record X-Kinvey-Request-Start', (done) => {
        const entity4 = utilities.getEntity(utilities.randomString(), 'queryValue', 1);
        const entity5 = utilities.getEntity(utilities.randomString(), 'queryValue', 2);
        const entity6 = utilities.getEntity(utilities.randomString(), 'queryValue', 3);
        const query = new Kinvey.Query();
        query.ascending('numberField');
        query.limit = 1;
        query.skip = 1;
        query.equalTo('textField', 'queryValue');
        const queryWithoutModifiers = new Kinvey.Query();
        queryWithoutModifiers.equalTo('textField', 'queryValue')
        deltaNetworkStore.save(entity4)
          .then(() => deltaNetworkStore.save(entity5))
          .then(() => deltaNetworkStore.save(entity6))
          .then(() => deltaStoreToTest.sync(queryWithoutModifiers))
          .then((result) => validatePullOperation(result.pull, [entity4, entity5, entity6]))
          .then(() => deltaNetworkStore.removeById(entity4._id))
          .then(() => deltaStoreToTest.sync(query))
          .then((result) => validatePullOperation(result.pull, [entity6]))
          .then(() => deltaStoreToTest.sync(query))
          .then((result) => validatePullOperation(result.pull, [entity6]))
          .then(() => deltaStoreToTest.sync(queryWithoutModifiers))
          .then((result) => validateNewPullOperation(result.pull, [], [entity4]))
          .then(() => done())
          .catch(done);

      });
    });

    conditionalDescribe('find', () => {
      const dataStoreType = currentDataStoreType;
      const entity1 = utilities.getEntity(utilities.randomString());
      const entity2 = utilities.getEntity(utilities.randomString());
      const entity3 = utilities.getEntity(utilities.randomString());
      const createdUserIds = [];
      let deltaStoreToTest;

      before(() => {
        deltaStoreToTest = Kinvey.DataStore.collection(deltaCollectionName, currentDataStoreType, { useDeltaSet: true });
      });

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
          .then(() => deltaStoreToTest.save(entity1))
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
        const onNextSpy = sinon.spy();
        deltaStoreToTest.find()
          .subscribe(onNextSpy, done, () => {
            try {
              utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity1], [entity1, entity2], true);
              const anotherSpy = sinon.spy();
              deltaStoreToTest.find()
                .subscribe(anotherSpy, done, () => {
                  try {
                    // utilities.validateReadResult(currentDataStoreType, anotherSpy, [entity1, entity2], [entity1, entity2], true);
                    done();
                  }
                  catch (error) {
                    done(error);
                  }
                })
            }
            catch (error) {
              done(error);
            }
          });
      });

      it('should return correct number of items with disabled deltaset', (done) => {
        let deisabledDeltaSetStore = cacheStore;
        const onNextSpy = sinon.spy();
        deisabledDeltaSetStore.find()
          .subscribe(onNextSpy, done, () => {
            try {
              utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity1], [entity1, entity2], true);
              const anotherSpy = sinon.spy();
              deisabledDeltaSetStore.find()
                .subscribe(anotherSpy, done, () => {
                  try {
                    utilities.validateReadResult(currentDataStoreType, anotherSpy, [entity1, entity2], [entity1, entity2], true);
                    done();
                  }
                  catch (error) {
                    done(error);
                  }
                })
            }
            catch (error) {
              done(error);
            }
          });
      });

      it('should return correct number of items with created item', (done) => {
        const onNextSpy = sinon.spy();
        deltaStoreToTest.find()
          .subscribe(onNextSpy, done, () => {
            try {
              utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity1], [entity1, entity2], true);
              const anotherSpy = sinon.spy();
              deltaNetworkStore.save(entity3)
                .then(() => deltaStoreToTest.find()
                  .subscribe(anotherSpy, done, () => {
                    try {
                      utilities.validateReadResult(currentDataStoreType, anotherSpy, [entity1, entity2], [entity1, entity2, entity3], true);
                      done();
                    }
                    catch (error) {
                      done(error);
                    }
                  }))
            }
            catch (error) {
              done(error);
            }
          });
      });

      it('should return correct number of items with created item with third request', (done) => {
        let entity4 = utilities.getEntity(utilities.randomString(), 'queryValue');
        const onNextSpy = sinon.spy();
        deltaStoreToTest.find()
          .subscribe(onNextSpy, done, () => {
            try {
              utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity1], [entity1, entity2], true);
              const anotherSpy = sinon.spy();
              deltaNetworkStore.save(entity3)
                .then(() => deltaStoreToTest.find()
                  .subscribe(anotherSpy, done, () => {
                    try {
                      utilities.validateReadResult(currentDataStoreType, anotherSpy, [entity1, entity2], [entity1, entity2, entity3], true);
                      const yetAnotherSpy = sinon.spy();
                      deltaNetworkStore.save(entity4)
                        .then(() => deltaStoreToTest.find()
                          .subscribe(yetAnotherSpy, done, () => {
                            try {
                              utilities.validateReadResult(currentDataStoreType, yetAnotherSpy, [entity1, entity2, entity3], [entity1, entity2, entity3, entity4], true);
                              done();
                            }
                            catch (error) {
                              done(error);
                            }
                          }))
                    }
                    catch (error) {
                      done(error);
                    }
                  }))
            }
            catch (error) {
              done(error);
            }
          });
      });

      it('should return correct number of items with auto-pagination', (done) => {
        const onNextSpy = sinon.spy();
        deltaStoreToTest.find(new Kinvey.Query(), { autoPagination: true })
          .subscribe(onNextSpy, done, () => {
            try {
              utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity1], [entity1, entity2], true);
              const anotherSpy = sinon.spy();
              deltaNetworkStore.save(entity3)
                .then(() => deltaStoreToTest.find(new Kinvey.Query(), { autoPagination: true })
                  .subscribe(anotherSpy, done, () => {
                    try {
                      utilities.validateReadResult(currentDataStoreType, anotherSpy, [entity1, entity2], [entity1, entity2, entity3], true);
                      done();
                    }
                    catch (error) {
                      done(error);
                    }
                  }))
            }
            catch (error) {
              done(error);
            }
          });
      });

      it('should return correct number of items with deleted item', (done) => {
        const entity4 = utilities.getEntity(utilities.randomString())
        const onNextSpy = sinon.spy();
        deltaNetworkStore.save(entity3)
          .then(() => deltaNetworkStore.save(entity4))
          .then(() => deltaStoreToTest.find()
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity1], [entity1, entity2, entity3, entity4], true);
                onNextSpy.resetHistory();
                deltaNetworkStore.removeById(entity1._id)
                  .then(() => deltaStoreToTest.find()
                    .subscribe(onNextSpy, done, () => {
                      try {
                        utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity1, entity2, entity3, entity4], [entity2, entity3, entity4], true);
                        const secondSpy = sinon.spy();
                        deltaNetworkStore.removeById(entity2._id)
                          .then(() => deltaNetworkStore.removeById(entity3._id))
                          .then(() => deltaStoreToTest.find()
                            .subscribe(secondSpy, done, () => {
                              try {
                                utilities.validateReadResult(currentDataStoreType, secondSpy, [entity2, entity3, entity4], [entity4], true);
                                onNextSpy.resetHistory();
                                syncStore.find()
                                  .subscribe(onNextSpy, done, () => {
                                    try {
                                      utilities.validateReadResult(Kinvey.DataStoreType.Sync, onNextSpy, [entity4])
                                      done();
                                    } catch (error) {
                                      done(error)
                                    }
                                  })
                              } catch (error) {
                                done(error);
                              }
                            })
                          )
                          .catch(done);

                      }
                      catch (error) {
                        done(error);
                      }
                    }))
              }
              catch (error) {
                done(error);
              }
            })
          )
          .catch(done);
      });

      it('should return correct number of items with updated item', (done) => {
        let updatedEntity = _.clone(entity2);
        updatedEntity.textField = utilities.randomString();
        const onNextSpy = sinon.spy();
        deltaStoreToTest.find()
          .subscribe(onNextSpy, done, () => {
            try {
              utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity1], [entity1, entity2], true);
              const anotherSpy = sinon.spy();
              deltaNetworkStore.save(updatedEntity)
                .then(() => deltaStoreToTest.find()
                  .subscribe(anotherSpy, done, () => {
                    try {
                      utilities.validateReadResult(currentDataStoreType, anotherSpy, [entity1, entity2], [entity1, updatedEntity], true);
                      done();
                    }
                    catch (error) {
                      done(error);
                    }
                  }))
            }
            catch (error) {
              done(error);
            }
          });
      });

      it('should return correct number of items with updated and deleted item', (done) => {
        let updatedEntity = _.clone(entity2);
        updatedEntity.textField = utilities.randomString();
        const onNextSpy = sinon.spy();
        deltaStoreToTest.find()
          .subscribe(onNextSpy, done, () => {
            try {
              utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity1], [entity1, entity2], true);
              const anotherSpy = sinon.spy();
              deltaNetworkStore.save(updatedEntity)
                .then(() => deltaNetworkStore.removeById(entity1._id))
                .then(() => deltaStoreToTest.find()
                  .subscribe(anotherSpy, done, () => {
                    try {
                      utilities.validateReadResult(currentDataStoreType, anotherSpy, [entity1, entity2], [updatedEntity], true);
                      done();
                    }
                    catch (error) {
                      done(error);
                    }
                  }))
            }
            catch (error) {
              done(error);
            }
          });
      });

      it('should return correct number of items with query with updated item', (done) => {
        let entity4 = utilities.getEntity(utilities.randomString(), 'queryValue');
        let entity5 = utilities.getEntity(utilities.randomString(), 'queryValue');
        let entity6 = utilities.getEntity(utilities.randomString(), 'queryValue');
        let updatedEntity = _.clone(entity5);
        updatedEntity.numberField = 5;
        let query = new Kinvey.Query();
        query.equalTo('textField', 'queryValue');
        const onNextSpy = sinon.spy();
        deltaNetworkStore.save(entity4)
          .then(() => deltaStoreToTest.save(entity5))
          .then(() => deltaNetworkStore.save(entity6))
          .then(() => deltaStoreToTest.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity5], [entity4, entity5, entity6], true);
                const anotherSpy = sinon.spy();
                deltaNetworkStore.save(updatedEntity)
                  .then(() => deltaStoreToTest.find(query)
                    .subscribe(anotherSpy, done, () => {
                      try {
                        utilities.validateReadResult(currentDataStoreType, anotherSpy, [entity4, entity5, entity6], [entity4, updatedEntity, entity6], true);
                        done();
                      }
                      catch (error) {
                        done(error);
                      }
                    }))
              }
              catch (error) {
                done(error);
              }
            }));
      });

      it('should return correct number of items with query with deleted item', (done) => {
        let entity4 = utilities.getEntity(utilities.randomString(), 'queryValue');
        let entity5 = utilities.getEntity(utilities.randomString(), 'queryValue');
        let entity6 = utilities.getEntity(utilities.randomString(), 'queryValue');
        let updatedEntity = _.clone(entity5);
        updatedEntity.numberField = 5;
        let query = new Kinvey.Query();
        query.equalTo('textField', 'queryValue');
        const onNextSpy = sinon.spy();
        deltaNetworkStore.save(entity4)
          .then(() => deltaStoreToTest.save(entity5))
          .then(() => deltaNetworkStore.save(entity6))
          .then(() => deltaStoreToTest.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity5], [entity4, entity5, entity6], true);
                const anotherSpy = sinon.spy();
                deltaNetworkStore.removeById(entity5._id)
                  .then(() => deltaStoreToTest.find(query)
                    .subscribe(anotherSpy, done, () => {
                      try {
                        utilities.validateReadResult(currentDataStoreType, anotherSpy, [entity4, entity5, entity6], [entity4, entity6], true);
                        done();
                      }
                      catch (error) {
                        done(error);
                      }
                    }))
              }
              catch (error) {
                done(error);
              }
            }));
      });
    });

    describe('when switching stores', () => {
      const dataStoreType = currentDataStoreType;
      const entity1 = utilities.getEntity(utilities.randomString());
      const entity2 = utilities.getEntity(utilities.randomString());
      const entity3 = utilities.getEntity(utilities.randomString());
      const entity4 = utilities.getEntity(utilities.randomString());
      const createdUserIds = [];
      let deltaStoreToTest;

      before(() => {
        deltaStoreToTest = Kinvey.DataStore.collection(deltaCollectionName, currentDataStoreType, { useDeltaSet: true });
      });

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

      if (currentDataStoreType === Kinvey.DataStoreType.Sync) {
        it('should use deltaset consistently when switching from sync to cache', (done) => {
          deltaStoreToTest.pull()
            .then((result) => validatePullOperation(result, [entity1, entity2]))
            .then(() => deltaNetworkStore.save(entity3))
            .then(() => deltaStoreToTest.pull())
            .then((result) => validateNewPullOperation(result, [entity3], []))
            .then(() => deltaNetworkStore.save(entity4))
            .then(() => deltaCacheStore.pull())
            .then((result) => validateNewPullOperation(result, [entity4], []))
            .then(() => done())
            .catch(done);
        });
      }

      if (currentDataStoreType === Kinvey.DataStoreType.Cache) {
        it('should use deltaset consistently when switching from cache to sync', (done) => {
          deltaStoreToTest.pull()
            .then((result) => validatePullOperation(result, [entity1, entity2]))
            .then(() => deltaNetworkStore.save(entity3))
            .then(() => deltaStoreToTest.pull())
            .then((result) => validateNewPullOperation(result, [entity3], []))
            .then(() => deltaNetworkStore.save(entity4))
            .then(() => deltaSyncStore.pull())
            .then((result) => validateNewPullOperation(result, [entity4], []))
            .then(() => done())
            .catch(done);
        });
      }

      if (currentDataStoreType === Kinvey.DataStoreType.Sync) {
        it('should use deltaset consistently when switching from network to sync', (done) => {
          let onNextSpy = sinon.spy();
          deltaNetworkStore.find()
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(Kinvey.DataStoreType.Network, onNextSpy, [entity1], [entity1, entity2], true);
                deltaNetworkStore.save(entity3)
                  .then(() => deltaStoreToTest.pull())
                  .then((result) => validatePullOperation(result, [entity1, entity2, entity3]))
                  .then(() => deltaNetworkStore.save(entity4))
                  .then(() => deltaSyncStore.pull())
                  .then((result) => validateNewPullOperation(result, [entity4], []))
                  .then(() => done())
                  .catch(done);
              }
              catch (error) {
                done(error);
              }
            });
        })
      }

      if (currentDataStoreType === Kinvey.DataStoreType.Cache) {
        it('should use deltaset consistently when switching from network to cache', (done) => {
          let onNextSpy = sinon.spy();
          deltaNetworkStore.find()
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(Kinvey.DataStoreType.Network, onNextSpy, [entity1], [entity1, entity2], true);
                deltaNetworkStore.save(entity3)
                  .then(() => deltaStoreToTest.pull())
                  .then((result) => validatePullOperation(result, [entity1, entity2, entity3]))
                  .then(() => deltaNetworkStore.save(entity4))
                  .then(() => deltaSyncStore.pull())
                  .then((result) => validateNewPullOperation(result, [entity4], []))
                  .then(() => done())
                  .catch(done);
              }
              catch (error) {
                done(error);
              }
            });
        })
      }
    });

    describe('when clearing cache', () => {
      const dataStoreType = currentDataStoreType;
      const entity1 = utilities.getEntity(utilities.randomString());
      const entity2 = utilities.getEntity(utilities.randomString());
      const entity3 = utilities.getEntity(utilities.randomString());
      const entity4 = utilities.getEntity(utilities.randomString());
      const createdUserIds = [];
      let deltaStoreToTest;

      before(() => {
        deltaStoreToTest = Kinvey.DataStore.collection(deltaCollectionName, currentDataStoreType, { useDeltaSet: true });
      });

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

      it('should send regular GET after clearCache()', (done) => {
        deltaStoreToTest.pull()
          .then((result) => validatePullOperation(result, [entity1, entity2]))
          .then(() => deltaNetworkStore.save(entity3))
          .then(() => deltaStoreToTest.pull())
          .then((result) => validateNewPullOperation(result, [entity3], []))
          .then(() => Kinvey.DataStore.clearCache())
          .then(() => deltaNetworkStore.save(entity4))
          .then(() => deltaStoreToTest.pull())
          .then((result) => validatePullOperation(result, [entity1, entity2, entity3, entity4]))
          .then(() => deltaNetworkStore.removeById(entity3._id))
          .then(() => deltaStoreToTest.pull())
          .then((result) => validateNewPullOperation(result, [], [entity3]))
          .then(() => done())
          .catch((error) => done(error));
      });
    });

    describe('error handling', function () {
      const dataStoreType = currentDataStoreType;
      const entity1 = utilities.getEntity(utilities.randomString());
      const entity2 = utilities.getEntity(utilities.randomString());
      const entity3 = utilities.getEntity(utilities.randomString());
      const entity4 = utilities.getEntity(utilities.randomString());
      const createdUserIds = [];
      let deltaStoreToTest;
      let nonDeltaStoreToTest;
      let nonDeltaNetworkStore;

      before(() => {
        deltaStoreToTest = Kinvey.DataStore.collection(deltaCollectionName, currentDataStoreType, { useDeltaSet: true });
        nonDeltaStoreToTest = Kinvey.DataStore.collection(collectionWithoutDelta, currentDataStoreType, { useDeltaSet: true });
        nonDeltaNetworkStore = Kinvey.DataStore.collection(collectionWithoutDelta, Kinvey.DataStoreType.Network);
      });

      before((done) => {
        utilities.cleanUpAppData(deltaCollectionName, createdUserIds)
          .then(() => utilities.cleanUpAppData(collectionWithoutDelta, createdUserIds))
          .then(() => Kinvey.User.signup())
          .then((user) => {
            createdUserIds.push(user.data._id);
            done();
          })
          .catch(done);
      });

      beforeEach((done) => {
        utilities.cleanUpCollectionData(deltaCollectionName)
          .then(() => utilities.cleanUpCollectionData(collectionWithoutDelta))
          .then(() => utilities.cleanUpCollectionData(deltaCollectionName))
          .then(() => nonDeltaNetworkStore.save(entity1))
          .then(() => nonDeltaNetworkStore.save(entity2))
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

      it('should send regular GET after failure for missing configuration', (done) => {
        nonDeltaStoreToTest.pull()
          .then((result) => {
            return validatePullOperation(result, [entity1, entity2], null, null, collectionWithoutDelta);
          })
          .then(() => {
            return nonDeltaNetworkStore.save(entity3);
          })
          .then(() => {
            return nonDeltaStoreToTest.pull();
          })
          .then((result) => {
            return validatePullOperation(result, [entity1, entity2, entity3], null, null, collectionWithoutDelta);
          })
          .then(() => {
            return nonDeltaNetworkStore.save(entity4);
          })
          .then(() => {
            return nonDeltaStoreToTest.pull();
          })
          .then((result) => {
            return validatePullOperation(result, [entity1, entity2, entity3, entity4], null, null, collectionWithoutDelta);
          })
          .then(() => {
            return done();
          })
          .catch(done);
      });

      it.skip('should send regular GET after fail for outdated since param', function (done) {
        let db = window.openDatabase(process.env.APP_KEY, 1, 'Kinvey Cache', 20000);
        deltaStoreToTest.pull()
          .then((result) => validatePullOperation(result, [entity1, entity2]))
          .then(() => {
            db.transaction((tx) => {
              try {
                tx.executeSql(`SELECT * FROM _QueryCache WHERE value LIKE '%"query":""%'`, [], (tx1, resultSet) => {
                  try {
                    let item = resultSet.rows[0];
                    let queryParsed = JSON.parse(item.value);
                    let lastRequest = queryParsed.lastRequest;
                    let lastRequestDateObject = new Date(lastRequest);
                    lastRequestDateObject.setDate(lastRequestDateObject.getDate() - 31);
                    let outdatedTimeToString = lastRequestDateObject.toISOString();
                    queryParsed.lastRequest = outdatedTimeToString;
                    tx.executeSql(`UPDATE _QueryCache SET value = ? WHERE value LIKE '%"query":""%'`, [JSON.stringify(queryParsed)], () => {
                      deltaStoreToTest.pull()
                        .then((result) => validatePullOperation(result, [entity1, entity2]))
                        .then(() => done())
                        .catch((error) => done(error));
                    });
                  }
                  catch (error) {
                    done(error);
                  }
                });
              }
              catch (error) {
                done(error);
              }
            })
          })
          .catch((error) => done(error));
      });

      it.skip('with outdated since param subsequent pull should delete items in the cache', (done) => {
        let db = window.openDatabase(process.env.APP_KEY, 1, 'Kinvey Cache', 20000);
        deltaStoreToTest.pull()
          .then((result) => validatePullOperation(result, [entity1, entity2]))
          .then(() => deltaNetworkStore.removeById(entity1._id))
          .then(() => {
            db.transaction((tx) => {
              try {
                tx.executeSql(`SELECT * FROM _QueryCache WHERE value LIKE '%"query":""%'`, [], (tx1, resultSet) => {
                  try {
                    let item = resultSet.rows[0];
                    let queryParsed = JSON.parse(item.value);
                    let lastRequest = queryParsed.lastRequest;
                    let lastRequestDateObject = new Date(lastRequest);
                    lastRequestDateObject.setDate(lastRequestDateObject.getDate() - 31);
                    let outdatedTimeToString = lastRequestDateObject.toISOString();
                    queryParsed.lastRequest = outdatedTimeToString;
                    tx.executeSql(`UPDATE _QueryCache SET value = ? WHERE value LIKE '%"query":""%'`, [JSON.stringify(queryParsed)], () => {
                      deltaStoreToTest.pull()
                        .then((result) => validatePullOperation(result, [entity2]))
                        .then(() => done())
                        .catch((error) => done(error));
                    });
                  }
                  catch (error) {
                    done(error);
                  }
                });
              }
              catch (error) {
                done(error);
              }
            })
          })
          .catch((error) => done(error));
      });
    });
  });
});
