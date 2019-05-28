import { expect } from 'chai';
import isArray from 'lodash/isArray';
import { init, DataStore, DataStoreType, User, Query, Errors } from '__SDK__';
import { collectionName, deltaCollectionName } from '../config';
import { randomString, createSampleCollectionData, cleanUpCollectionData } from '../utils';

describe('AutoStore', function() {
  before(function() {
    // Initialize the SDK
    return init({
      appKey: process.env.APP_KEY,
      appSecret: process.env.APP_SECRET,
      masterSecret: process.env.MASTER_SECRET
    });
  });

  before(function() {
    // Signup an anonymous user
    return User.signup();
  });

  afterEach(function() {
    // Clean up sample data
    return cleanUpCollectionData(collectionName);
  });

  afterEach(function () {
    // Clean up sample data
    return cleanUpCollectionData(deltaCollectionName);
  });

  after(function() {
    // Remove the active user
    const activeUser = User.getActiveUser();
    if (activeUser) {
      return User.remove(activeUser._id, { hard: true });
    }
    return null;
  });

  describe('Find', function() {
    describe('with correct data and querries and no network interruption', function() {
      it('should return the data', async function () {
        // Create sample data
        const sampleDocs = await createSampleCollectionData(collectionName, 2);

        // Verify the docs are returned from the AUTO store type
        const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
        const docs = await autoTypeCollection.find();
        expect(docs.length).to.equal(sampleDocs.length);
        docs.map((doc) => {
          const sampleDoc = sampleDocs.find((sampleDoc) => sampleDoc._id === doc._id);
          expect(doc).to.deep.equal(sampleDoc);
        });

        // Verify that the docs are stored in the cache
        const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);
        const cachedDocs = await syncTypeCollection.find().toPromise();
        expect(cachedDocs.length).to.equal(sampleDocs.length);
        cachedDocs.map((cachedDoc) => {
          const sampleDoc = sampleDocs.find((sampleDoc) => sampleDoc._id === cachedDoc._id);
          expect(cachedDoc).to.deep.equal(sampleDoc);
        });
      });

      it('should return correct data with query', async function () {
        // Create sample data
        const propertyName = 'title';
        const sampleDocs = await createSampleCollectionData(collectionName, 3, propertyName);

        // Create a query
        const query = new Query()
          .contains(propertyName, [sampleDocs[0][propertyName], sampleDocs[1][propertyName]])
          .ascending(propertyName);

        // Verify the docs are returned from the AUTO store type that match the query
        const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
        const docs = await autoTypeCollection.find(query);
        expect(docs.length).to.equal(2);
        expect(docs).to.deep.equal([sampleDocs[0], sampleDocs[1]]);

        // Verify that the docs are stored in the cache that match the query
        const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);
        const cachedDocs = await syncTypeCollection.find(query).toPromise();
        expect(cachedDocs.length).to.equal(2);
        expect(cachedDocs).to.deep.equal([sampleDocs[0], sampleDocs[1]]);
      });

      it('should return correct data with limit and skip', async function () {
        // Create sample data
        const propertyName = 'title';
        const sampleDocs = await createSampleCollectionData(collectionName, 3, propertyName);

        // Create a query
        const query = new Query()
          .ascending(propertyName);
        query.limit = 1;
        query.skip = 1;

        // Verify the docs are returned from the AUTO store type that match the query
        const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
        const docs = await autoTypeCollection.find(query);
        expect(docs.length).to.equal(1);
        expect(docs).to.deep.equal([sampleDocs[1]]);

        // Verify that the docs are stored in the cache that match the query
        const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);
        const cachedDocs = await syncTypeCollection.find(query).toPromise();
        expect(cachedDocs.length).to.equal(1);
        expect(cachedDocs).to.deep.equal([sampleDocs[1]]);
      });

      it('should return correct data with delta set', async function () {
        // Create sample data
        const sampleDocs1 = await createSampleCollectionData(deltaCollectionName, 2);

        // Verify the docs are returned from the AUTO store type
        const autoTypeCollection = DataStore.collection(deltaCollectionName, DataStoreType.Auto, { useDeltaSet: true });
        const docs1 = await autoTypeCollection.find();
        expect(docs1.length).to.equal(sampleDocs1.length);
        docs1.map((doc) => {
          const sampleDoc = sampleDocs1.find((sampleDoc) => sampleDoc._id === doc._id);
          expect(doc).to.deep.equal(sampleDoc);
        });

        // Create sample data
        const sampleDocs2 = await createSampleCollectionData(deltaCollectionName, 1);

        // Verify the docs are returned from the AUTO store type
        const docs2 = await autoTypeCollection.find();
        expect(docs2.length).to.equal(sampleDocs1.length + sampleDocs2.length);
        docs2.map((doc) => {
          const sampleDoc = [].concat(sampleDocs1, sampleDocs2).find((sampleDoc) => sampleDoc._id === doc._id);
          expect(doc).to.deep.equal(sampleDoc);
        });

        // Create sample data
        const sampleDocs3 = await createSampleCollectionData(deltaCollectionName, 1);

        // Verify the docs are returned from the AUTO store type
        const docs3 = await autoTypeCollection.find();
        expect(docs3.length).to.equal(sampleDocs1.length + sampleDocs2.length + sampleDocs3.length);
        docs3.map((doc) => {
          const sampleDoc = [].concat(sampleDocs1, sampleDocs2, sampleDocs3).find((sampleDoc) => sampleDoc._id === doc._id);
          expect(doc).to.deep.equal(sampleDoc);
        });

        // Verify that the docs are stored in the cache
        const syncTypeCollection = DataStore.collection(deltaCollectionName, DataStoreType.Sync);
        const cachedDocs = await syncTypeCollection.find().toPromise();
        expect(cachedDocs.length).to.equal(sampleDocs1.length + sampleDocs2.length + sampleDocs3.length);
        cachedDocs.map((cachedDoc) => {
          const sampleDoc = [].concat(sampleDocs1, sampleDocs2, sampleDocs3).find((sampleDoc) => sampleDoc._id === cachedDoc._id);
          expect(cachedDoc).to.deep.equal(sampleDoc);
        });
      });

      it('should return correctly sorted data descending', async function() {
        // Create sample data
        const propertyName = 'title';
        const sampleDocs = await createSampleCollectionData(collectionName, 3, propertyName);

        // Create a query
        const query = new Query()
          .descending(propertyName);

        // Sort sample docs
        const modifier = query.sort[propertyName];
        const sortedSampleDocs = sampleDocs.sort((a, b) => {
          if (a[propertyName] < b[propertyName]) return -1 * modifier;
          if (a[propertyName] > b[propertyName]) return 1 * modifier;
          return 0;
        });

        // Verify the docs are returned from the AUTO store type that match the query
        const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
        const docs = await autoTypeCollection.find(query);
        expect(docs.length).to.equal(sortedSampleDocs.length);
        expect(docs).to.deep.equal(sortedSampleDocs);

        // Verify that the docs are stored in the cache that match the query
        const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);
        const cachedDocs = await syncTypeCollection.find(query).toPromise();
        expect(cachedDocs.length).to.equal(sortedSampleDocs.length);
        expect(cachedDocs).to.deep.equal(sortedSampleDocs);
      });

      it('should return correctly sorted data ascending', async function () {
        // Create sample data
        const propertyName = 'title';
        const sampleDocs = await createSampleCollectionData(collectionName, 3, propertyName);

        // Create a query
        const query = new Query()
          .ascending(propertyName);

        // Sort sample docs
        const modifier = query.sort[propertyName];
        const sortedSampleDocs = sampleDocs.sort((a, b) => {
          if (a[propertyName] < b[propertyName]) return -1 * modifier;
          if (a[propertyName] > b[propertyName]) return 1 * modifier;
          return 0;
        });

        // Verify the docs are returned from the AUTO store type that match the query
        const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
        const docs = await autoTypeCollection.find(query);
        expect(docs.length).to.equal(sortedSampleDocs.length);
        expect(docs).to.deep.equal(sortedSampleDocs);

        // Verify that the docs are stored in the cache that match the query
        const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);
        const cachedDocs = await syncTypeCollection.find(query).toPromise();
        expect(cachedDocs.length).to.equal(sortedSampleDocs.length);
        expect(cachedDocs).to.deep.equal(sortedSampleDocs);
      });

      it('should delete items in the cache that have been deleted in the backend', async function () {
        // Create sample data
        const sampleDocs = await createSampleCollectionData(collectionName, 2);

        // Delete 1 doc
        const networkCollection = DataStore.collection(collectionName, DataStoreType.Network);
        const doc = sampleDocs.shift();
        await networkCollection.removeById(doc._id);

        // Verify the docs are returned from the AUTO store type
        const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
        const docs = await autoTypeCollection.find();
        expect(docs.length).to.equal(sampleDocs.length);
        docs.map((doc) => {
          const sampleDoc = sampleDocs.find((sampleDoc) => sampleDoc._id === doc._id);
          expect(doc).to.deep.equal(sampleDoc);
        });

        // Verify that the docs are stored in the cache
        const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);
        const cachedDocs = await syncTypeCollection.find().toPromise();
        expect(cachedDocs.length).to.equal(sampleDocs.length);
        cachedDocs.map((cachedDoc) => {
          const sampleDoc = sampleDocs.find((sampleDoc) => sampleDoc._id === cachedDoc._id);
          expect(cachedDoc).to.deep.equal(sampleDoc);
        });
      });

      it('should use different collection with tagged data store', async function () {
        const tag = 'tag';

        // Create sample data
        const sampleDocs = await createSampleCollectionData(collectionName, 2);

        // Verify the docs are returned from the AUTO store type
        const taggedAutoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto, { tag });
        const docs = await taggedAutoTypeCollection.find();
        expect(docs.length).to.equal(sampleDocs.length);
        docs.map((doc) => {
          const sampleDoc = sampleDocs.find((sampleDoc) => sampleDoc._id === doc._id);
          expect(doc).to.deep.equal(sampleDoc);
        });

        // Verify that the docs are stored in the cache
        const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);
        const cachedDocs = await syncTypeCollection.find().toPromise();
        expect(cachedDocs.length).to.equal(0);

        // Verify that the docs are stored in the cache using tag
        const taggedSyncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync, { tag });
        const taggedCachedDocs = await taggedSyncTypeCollection.find().toPromise();
        expect(taggedCachedDocs.length).to.equal(sampleDocs.length);
        taggedCachedDocs.map((cachedDoc) => {
          const sampleDoc = sampleDocs.find((sampleDoc) => sampleDoc._id === cachedDoc._id);
          expect(cachedDoc).to.deep.equal(sampleDoc);
        });
      });
    });

    describe('with invalid data and network interruptions', function() {
      it('should return an error for an invalid query');
      it('should return regular error for invalid operation');
      it('should return locally stored data if connectivity error');
      it('should return locally stored data if connectivity error with tagged store');
      it('should return backend data after connectivity error is eliminated');
      it('should return queried data if connectivity error');
      it('should return correct data with limit and skip');
      it('should return sorted data');
      it('should return correct data with delta set');
      it('should remove entities no longer existing in the backend');
    });
  });

  describe('Count', function() {
    describe('with valid data and no network issues', function() {
      it('should return the count of all items', async function() {
        const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);

        // Create sample data
        await createSampleCollectionData(collectionName, 2);

        // Verify count
        expect(await autoTypeCollection.count()).to.deep.equal(2);

        // Create sample data
        await createSampleCollectionData(collectionName, 1);

        // Verify count
        expect(await autoTypeCollection.count()).to.deep.equal(3);
      });

      it('should return the count of all items from the tagged data store', async function() {
        const tag = randomString();
        const taggedAutoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto, { tag });
        const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);

        // Create sample data
        await createSampleCollectionData(collectionName, 2);

        // Verify count
        expect(await taggedAutoTypeCollection.count()).to.deep.equal(2);

        // Create sample data
        await createSampleCollectionData(collectionName, 1);

        // Verify count
        expect(await taggedAutoTypeCollection.count()).to.deep.equal(3);

        // Verify count
        expect(await syncTypeCollection.count().toPromise()).to.deep.equal(0);
      });

      it('should return the count of queried items', async function() {
        const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);

        // Create sample data
        const propertyName = 'title';
        const sampleDocs = await createSampleCollectionData(collectionName, 3, propertyName);

        // Create a query
        const query = new Query()
          .contains(propertyName, [sampleDocs[0][propertyName], sampleDocs[1][propertyName]]);

        // Verify count
        expect(await autoTypeCollection.count(query)).to.deep.equal(2);
      });
    });

    describe('with invalid data or with network interruption', async function() {
      it('should return an error for an invalid query');
      it('should return the number of locally stored items with network interruption');
      it('should return the number of locally stored items with network interruption and tagged store');
      it('should throw regular error for invalid operation');
    });
  });

  describe('FindById', function() {
    describe('with correct data and no network interruption', function() {
      it('should return the correct item', async function() {
        const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
        const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);

        // Create sample data
        const sampleDocs = await createSampleCollectionData(collectionName, 2);
        const sampleDoc = sampleDocs.shift();

        // Verify
        expect(await autoTypeCollection.findById(sampleDoc._id)).to.deep.equal(sampleDoc);
        expect(await syncTypeCollection.findById(sampleDoc._id).toPromise()).to.deep.equal(sampleDoc);
      });

      it('should return the correct item with a tagged store', async function() {
        const tag = randomString();
        const taggedAutoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto, { tag });
        const taggedSyncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync, { tag });
        const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);

        // Create sample data
        const sampleDocs = await createSampleCollectionData(collectionName, 2);
        const sampleDoc = sampleDocs.shift();

        // Verify
        expect(await taggedAutoTypeCollection.findById(sampleDoc._id)).to.deep.equal(sampleDoc);
        expect(await taggedSyncTypeCollection.findById(sampleDoc._id).toPromise()).to.deep.equal(sampleDoc);

        try {
          await syncTypeCollection.findById(sampleDoc._id).toPromise();
          throw new Error('This test failed.');
        } catch (error) {
          expect(error).to.be.an.instanceOf(Errors.NotFoundError);
        }
      });
    });

    describe('with invalid data and network interruptions', function () {
      it('should throw error if an id is not provided');
      it('should throw regular error for an invalid operation');
      it('should return locally stored items if connectivity error is returned');
      it('should delete the item locally if it has been deleted in the backend');
    });
  });

  describe('Pull', function() {
    it('should pull all data with no connectivity issues', async function() {
      const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
      const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);

      // Create sample data
      const sampleDocs = await createSampleCollectionData(collectionName, 2);

      // Verify
      expect(await autoTypeCollection.pull()).to.equal(2);

      const docs = await syncTypeCollection.find().toPromise();
      expect(docs.length).to.equal(sampleDocs.length);
      docs.map((doc) => {
        const sampleDoc = sampleDocs.find((sampleDoc) => sampleDoc._id === doc._id);
        expect(doc).to.deep.equal(sampleDoc);
      });
    });

    it('should pull all data with no connectivity issues with tagged store', async function() {
      const tag = randomString();
      const taggedAutoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto, { tag });
      const taggedSyncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync, { tag });
      const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);

      // Create sample data
      const sampleDocs = await createSampleCollectionData(collectionName, 2);

      // Verify
      expect(await taggedAutoTypeCollection.pull()).to.equal(2);

      const docs1 = await taggedSyncTypeCollection.find().toPromise();
      expect(docs1.length).to.equal(sampleDocs.length);
      docs1.map((doc) => {
        const sampleDoc = sampleDocs.find((sampleDoc) => sampleDoc._id === doc._id);
        expect(doc).to.deep.equal(sampleDoc);
      });

      expect(await syncTypeCollection.find().toPromise()).to.deep.equal([]);
    });

    it('should return error with connectivity issue');

    it('should pull only the items conforming to a query', async function() {
      const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
      const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);

      // Create sample data
      const propertyName = randomString();
      const sampleDocs = await createSampleCollectionData(collectionName, 3, propertyName);

      // Create a query
      const query = new Query()
        .contains(propertyName, [sampleDocs[0][propertyName], sampleDocs[1][propertyName]])
        .descending(propertyName);

      // Sort sample docs
      const modifier = query.sort[propertyName];
      const sortedSampleDocs = sampleDocs
        .filter((doc) => doc[propertyName] === sampleDocs[0][propertyName] || doc[propertyName] === sampleDocs[1][propertyName])
        .sort((a, b) => {
          if (a[propertyName] < b[propertyName]) return -1 * modifier;
          if (a[propertyName] > b[propertyName]) return 1 * modifier;
          return 0;
        });

      // Verify
      expect(await autoTypeCollection.pull(query)).to.equal(2);
      expect(await syncTypeCollection.find(query).toPromise()).to.deep.equal(sortedSampleDocs);
    });

    it('should delete locally stored items that are deleted from the backend', async function() {
      const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
      const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);
      const networkTypeCollection = DataStore.collection(collectionName, DataStoreType.Network);

      // Create sample data
      const sampleDocs = await createSampleCollectionData(collectionName, 4);

      // Verify
      expect(await autoTypeCollection.pull()).to.equal(sampleDocs.length);

      // Remove 2 docs
      const removedDoc1 = sampleDocs.shift();
      await networkTypeCollection.removeById(removedDoc1._id);
      const removedDoc2 = sampleDocs.shift();
      await networkTypeCollection.removeById(removedDoc2._id);

      // Verify
      expect(await autoTypeCollection.pull()).to.equal(sampleDocs.length);

      const docs = await syncTypeCollection.find().toPromise();
      expect(docs.length).to.equal(sampleDocs.length);
      docs.map((doc) => {
        const sampleDoc = sampleDocs.find((sampleDoc) => sampleDoc._id === doc._id);
        expect(doc).to.deep.equal(sampleDoc);
      });
    });

    it('should update items in the cache that are changed in the backend', async function() {
      const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
      const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);
      const networkTypeCollection = DataStore.collection(collectionName, DataStoreType.Network);

      // Create sample data
      const sampleDocs = await createSampleCollectionData(collectionName, 4);

      // Verify
      expect(await autoTypeCollection.pull()).to.equal(sampleDocs.length);

      // Update 2 docs
      const updatedDoc1 = await networkTypeCollection.update(Object.assign({}, sampleDocs.shift(), { [randomString()]: randomString() }));
      sampleDocs.push(updatedDoc1);
      const updatedDoc2 = await networkTypeCollection.update(Object.assign({}, sampleDocs.shift(), { [randomString()]: randomString() }));
      sampleDocs.push(updatedDoc2);

      // Verify
      expect(await autoTypeCollection.pull()).to.equal(sampleDocs.length);

      const docs = await syncTypeCollection.find().toPromise();
      expect(docs.length).to.equal(sampleDocs.length);
      docs.map((doc) => {
        const sampleDoc = sampleDocs.find((sampleDoc) => sampleDoc._id === doc._id);
        expect(doc).to.deep.equal(sampleDoc);
      });
    });

    it('should use autopagination when turned on', async function() {
      const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto, { useAutoPagination: true });
      const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);

      // Create sample data
      const sampleDocs = await createSampleCollectionData(collectionName, 4);

      // Create a query
      const query = new Query();
      query.limit = 2;

      // Verify
      expect(await autoTypeCollection.pull(query)).to.equal(sampleDocs.length);

      const docs = await syncTypeCollection.find().toPromise();
      expect(docs.length).to.equal(sampleDocs.length);
      docs.map((doc) => {
        const sampleDoc = sampleDocs.find((sampleDoc) => sampleDoc._id === doc._id);
        expect(doc).to.deep.equal(sampleDoc);
      });
    });

    it('should return error for invalid query');

    it('should return error if there are items not synced with the backend');

    it('should persist updated and deleted items', async function() {
      const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
      const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);
      const networkTypeCollection = DataStore.collection(collectionName, DataStoreType.Network);

      // Create sample data
      const sampleDocs = await createSampleCollectionData(collectionName, 3);

      // Verify
      expect(await autoTypeCollection.pull()).to.equal(sampleDocs.length);

      // Remove and update docs
      const removedDoc1 = sampleDocs.shift();
      await networkTypeCollection.removeById(removedDoc1._id);
      const updatedDoc1 = await networkTypeCollection.update(Object.assign({}, sampleDocs.shift(), { [randomString()]: randomString() }));
      sampleDocs.push(updatedDoc1);

      // Verify
      expect(await autoTypeCollection.pull()).to.equal(sampleDocs.length);

      const docs = await syncTypeCollection.find().toPromise();
      expect(docs.length).to.equal(sampleDocs.length);
      docs.map((doc) => {
        const sampleDoc = sampleDocs.find((sampleDoc) => sampleDoc._id === doc._id);
        expect(doc).to.deep.equal(sampleDoc);
      });
    });
  });

  describe('Push', function() {
    it('should push created items to the backend', async function() {
      const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
      const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);
      const networkTypeCollection = DataStore.collection(collectionName, DataStoreType.Network);

      // Create sample data
      await syncTypeCollection.create({});
      await syncTypeCollection.create({});

      // Push
      const results = await autoTypeCollection.push();
      const sampleDocs = results.map((result) => result.entity);

      // Verify
      const docs = await networkTypeCollection.find().toPromise();
      expect(docs.length).to.equal(sampleDocs.length);
      docs.map((doc) => {
        const sampleDoc = sampleDocs.find((sampleDoc) => sampleDoc._id === doc._id);
        expect(doc).to.deep.equal(sampleDoc);
      });

      expect(await autoTypeCollection.pendingSyncEntities()).to.deep.equal([]);
    });

    it('should push created items to the backend with tagged store', async function() {
      const tag = randomString();
      const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
      const taggedAutoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto, { tag });
      const taggedSyncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync, { tag });
      const networkTypeCollection = DataStore.collection(collectionName, DataStoreType.Network);

      // Create sample data
      await taggedSyncTypeCollection.create({});
      await taggedSyncTypeCollection.create({});

      // Push
      const results = await taggedAutoTypeCollection.push();
      const sampleDocs = results.map((result) => result.entity);

      // Verify
      const docs = await networkTypeCollection.find().toPromise();
      expect(docs.length).to.equal(sampleDocs.length);
      docs.map((doc) => {
        const sampleDoc = sampleDocs.find((sampleDoc) => sampleDoc._id === doc._id);
        expect(doc).to.deep.equal(sampleDoc);
      });

      expect(await taggedAutoTypeCollection.pendingSyncEntities()).to.deep.equal([]);
      expect(await autoTypeCollection.pendingSyncEntities()).to.deep.equal([]);
    });

    it('should push updated items to the backend', async function() {
      const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
      const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);
      const networkTypeCollection = DataStore.collection(collectionName, DataStoreType.Network);

      // Create sample data
      const sampleDocs = await createSampleCollectionData(collectionName, 2);

      // Pull
      expect(await autoTypeCollection.pull()).to.equal(2);

      // Update doc
      await syncTypeCollection.update(Object.assign({}, sampleDocs.shift(), { [randomString()]: randomString() }));

      // Push
      const results = await autoTypeCollection.push();
      sampleDocs.push(results[0].entity);

      // Verify
      const docs = await networkTypeCollection.find().toPromise();
      expect(docs.length).to.equal(sampleDocs.length);
      docs.map((doc) => {
        const sampleDoc = sampleDocs.find((sampleDoc) => sampleDoc._id === doc._id);
        expect(doc).to.deep.equal(sampleDoc);
      });

      expect(await autoTypeCollection.pendingSyncEntities()).to.deep.equal([]);
    });

    it('should push deleted items to the backend', async function() {
      const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
      const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);
      const networkTypeCollection = DataStore.collection(collectionName, DataStoreType.Network);

      // Create sample data
      const sampleDocs = await createSampleCollectionData(collectionName, 3);

      // Pull
      expect(await autoTypeCollection.pull()).to.equal(3);

      // Remove docs
      const removedDoc1 = sampleDocs.shift();
      await networkTypeCollection.removeById(removedDoc1._id);
      const removedDoc2 = sampleDocs.shift();
      await networkTypeCollection.removeById(removedDoc2._id);

      // Push
      await autoTypeCollection.push();

      // Verify
      const docs = await networkTypeCollection.find().toPromise();
      expect(docs.length).to.equal(sampleDocs.length);
      docs.map((doc) => {
        const sampleDoc = sampleDocs.find((sampleDoc) => sampleDoc._id === doc._id);
        expect(doc).to.deep.equal(sampleDoc);
      });

      expect(await autoTypeCollection.pendingSyncEntities()).to.deep.equal([]);
    });

    it('should return error for connectivity error');

    it('should push all items disregarding a query', async function() {
      const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
      const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);
      const networkTypeCollection = DataStore.collection(collectionName, DataStoreType.Network);

      // Create sample data
      let sampleDocs = [];
      const property = randomString();
      sampleDocs.push(await syncTypeCollection.create({ [property]: randomString() }));
      sampleDocs.push(await syncTypeCollection.create({ [property]: randomString() }));
      sampleDocs.push(await syncTypeCollection.create({ [property]: randomString() }));

      // Query
      const query = new Query().contains(property, [sampleDocs[0][property], sampleDocs[1][property]]);

      // Push
      const results = await autoTypeCollection.push(query);
      expect(results.length).to.equal(sampleDocs.length);
      sampleDocs = results.map((result) => result.entity);

      // Verify
      const docs = await networkTypeCollection.find().toPromise();
      expect(docs.length).to.equal(sampleDocs.length);
      docs.map((doc) => {
        const sampleDoc = sampleDocs.find((sampleDoc) => sampleDoc._id === doc._id);
        expect(doc).to.deep.equal(sampleDoc);
      });
    });

    it('should complete push of multiple items if one of them fails');

    it('should recreate an item changed locally but deleted from the server', async function() {
      const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
      const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);
      const networkTypeCollection = DataStore.collection(collectionName, DataStoreType.Network);

      // Create sample data
      let sampleDocs = [];
      const property = randomString();
      sampleDocs.push(await syncTypeCollection.create({ [property]: randomString() }));
      sampleDocs.push(await syncTypeCollection.create({ [property]: randomString() }));

      // Push
      let results = await autoTypeCollection.push();
      expect(results.length).to.equal(sampleDocs.length);
      sampleDocs = results.map((result) => result.entity);

      // Update doc
      const updatedDoc = await syncTypeCollection.update(Object.assign({}, sampleDocs.shift(), { [property]: randomString() }));
      sampleDocs.push(updatedDoc);

      // Remove doc
      expect(await networkTypeCollection.removeById(updatedDoc._id)).to.deep.equal({ count: 1 });

      // Push
      results = await autoTypeCollection.push();
      expect(results.length).to.equal(1);
    });
  });

  describe('Sync', function() {
    it('should push all items and pull all items', async function() {
      const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
      const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);
      const networkTypeCollection = DataStore.collection(collectionName, DataStoreType.Network);

      // Create sample data
      const propertyName = randomString();
      const syncSampleDocs = [];
      syncSampleDocs.push(await syncTypeCollection.create({ [propertyName]: randomString() }));
      syncSampleDocs.push(await syncTypeCollection.create({ [propertyName]: randomString() }));
      syncSampleDocs.push(await syncTypeCollection.create({ [propertyName]: randomString() }));
      const networkSampleDocs = await createSampleCollectionData(collectionName, 2, propertyName);

      // Sync
      const { push, pull } = await autoTypeCollection.sync();
      expect(push.length).to.equal(syncSampleDocs.length);
      expect(pull).to.equal(syncSampleDocs.length + networkSampleDocs.length);
      const sampleDocs = networkSampleDocs.concat(push.map((result) => result.entity));

      // Find SyncStore
      const cachedDocs = await syncTypeCollection.find().toPromise();
      expect(cachedDocs.length).to.equal(sampleDocs.length);
      cachedDocs.map((doc) => {
        const sampleDoc = sampleDocs.find((sampleDoc) => sampleDoc._id === doc._id);
        expect(doc).to.deep.equal(sampleDoc);
      });

      // Find NetworkStore
      const networkDocs = await networkTypeCollection.find().toPromise();
      expect(networkDocs.length).to.equal(sampleDocs.length);
      networkDocs.map((doc) => {
        const sampleDoc = sampleDocs.find((sampleDoc) => sampleDoc._id === doc._id);
        expect(doc).to.deep.equal(sampleDoc);
      });
    });

    it('should push all items with a query and pull only the items conforming to that query', async function() {
      const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
      const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);
      const networkTypeCollection = DataStore.collection(collectionName, DataStoreType.Network);

      // Create sample data
      const propertyName = randomString();
      const syncSampleDocs = [];
      syncSampleDocs.push(await syncTypeCollection.create({ [propertyName]: randomString() }));
      syncSampleDocs.push(await syncTypeCollection.create({ [propertyName]: randomString() }));
      syncSampleDocs.push(await syncTypeCollection.create({ [propertyName]: randomString() }));
      const networkSampleDocs = await createSampleCollectionData(collectionName, 2, propertyName);

      // Query
      const query = new Query()
        .contains(propertyName, [syncSampleDocs[0][propertyName], syncSampleDocs[1][propertyName], networkSampleDocs[0][propertyName]]);

      // Sync
      const { push, pull } = await autoTypeCollection.sync(query);
      expect(push.length).to.equal(syncSampleDocs.length);
      expect(pull).to.equal(3);

      // TODO: Find SyncStore
      // const syncDocs = await syncTypeCollection.find(query);
      // expect(syncDocs.length).to.equal(3);
      // syncDocs.map((doc) => {
      //   const sampleDoc = sampleDocs.find((sampleDoc) => sampleDoc._id === doc._id);
      //   expect(doc).to.deep.equal(sampleDoc);
      // });
    });

    it('should return error if there is network connectivity for the push request and save the sync queue');

    it('should push the data and return connectivity error if the pull request cannot connect');

    it('should push all items and pull all items with tagged store', async function() {
      const tag = randomString();
      const taggedAutoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto, { tag });
      const taggedSyncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync, { tag });
      const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);
      const networkTypeCollection = DataStore.collection(collectionName, DataStoreType.Network);

      // Create sample data
      const propertyName = randomString();
      const syncSampleDocs = [];
      syncSampleDocs.push(await taggedSyncTypeCollection.create({ [propertyName]: randomString() }));
      syncSampleDocs.push(await taggedSyncTypeCollection.create({ [propertyName]: randomString() }));
      syncSampleDocs.push(await taggedSyncTypeCollection.create({ [propertyName]: randomString() }));
      const networkSampleDocs = await createSampleCollectionData(collectionName, 2, propertyName);

      // Sync
      const { push, pull } = await taggedAutoTypeCollection.sync();
      expect(push.length).to.equal(syncSampleDocs.length);
      expect(pull).to.equal(syncSampleDocs.length + networkSampleDocs.length);
      const sampleDocs = networkSampleDocs.concat(push.map((result) => result.entity));;

      // Find SyncStore
      const taggedSyncDocs = await taggedSyncTypeCollection.find().toPromise();
      expect(taggedSyncDocs.length).to.equal(sampleDocs.length);
      taggedSyncDocs.map((doc) => {
        const sampleDoc = sampleDocs.find((sampleDoc) => sampleDoc._id === doc._id);
        expect(doc).to.deep.equal(sampleDoc);
      });

      // Find SyncStore
      const syncDocs = await syncTypeCollection.find().toPromise();
      expect(syncDocs.length).to.equal(0);

      // Find NetworkStore
      const networkDocs = await networkTypeCollection.find().toPromise();
      expect(networkDocs.length).to.equal(sampleDocs.length);
      networkDocs.map((doc) => {
        const sampleDoc = sampleDocs.find((sampleDoc) => sampleDoc._id === doc._id);
        expect(doc).to.deep.equal(sampleDoc);
      });
    });
  });

  // describe('PendingSyncCount');
  // describe('PendingSyncEntities');
  // describe('ClearSync');
  // describe('Clear');
  // describe('Save');

  describe('Create', function() {
    it('should throw an error when trying to create an array of items');

    it('should create an item even if _id was not provided', async function() {
      const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
      const networkTypeCollection = DataStore.collection(collectionName, DataStoreType.Network);

      // Create a doc
      const doc = await autoTypeCollection.create({});

      // Find with Network
      expect(await networkTypeCollection.findById(doc._id).toPromise()).to.deep.equal(doc);
    });

    it('should create an item using _id provided', async function() {
      const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
      const networkTypeCollection = DataStore.collection(collectionName, DataStoreType.Network);

      // Create a doc
      const doc = await autoTypeCollection.create({ _id: randomString() });

      // Find with Network
      expect(await networkTypeCollection.findById(doc._id).toPromise()).to.deep.equal(doc);
    });

    it.skip('should update an item with existing _id', async function() {
      const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
      const networkTypeCollection = DataStore.collection(collectionName, DataStoreType.Network);

      // Create a doc
      let doc = await autoTypeCollection.create({});
      doc = await autoTypeCollection.create(Object.assign({}, doc, { foo: 'bar' }));

      // Find with Network
      expect(await networkTypeCollection.findById(doc._id).toPromise()).to.deep.equal(doc);
    });

    it('should save locally the item if connectivity error occurs');

    it('should throw regular error for invalid operation');

    it('should create multiple sync operations with connectivity issues');

    it('should create locally an item with tagged store', async function() {
      const tag = randomString();
      const taggedAutoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto, { tag });
      const taggedSyncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync, { tag });
      const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);

      // Create a doc
      const docs = [];
      docs.push(await taggedAutoTypeCollection.create({}));
      docs.push(await taggedAutoTypeCollection.create({}));

      // Find with tagged Sync
      expect(await taggedSyncTypeCollection.find().toPromise()).to.deep.equal(docs);

      // Find with Sync
      expect(await syncTypeCollection.find().toPromise()).to.deep.equal([]);
    });
  });

  describe('Update', function() {
    it('should throw an error when trying to update an array of items');

    it('should throw an error for trying to update without supplying and _id');

    it('should create an item whose _id does not exist', async function() {
      const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
      const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);
      const networkTypeCollection = DataStore.collection(collectionName, DataStoreType.Network);

      // Update a doc
      const doc = await autoTypeCollection.update({ _id: randomString() });

      // Find with Sync
      expect(await syncTypeCollection.findById(doc._id).toPromise()).to.deep.equal(doc);

      // Find with Network
      expect(await networkTypeCollection.findById(doc._id).toPromise()).to.deep.equal(doc);
    });

    it('should update an item with existing _id', async function() {
      const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
      const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);
      const networkTypeCollection = DataStore.collection(collectionName, DataStoreType.Network);

      // Update a doc
      let doc = await autoTypeCollection.create({});
      doc = await autoTypeCollection.update(Object.assign({}, doc, { foo: 'bar' }));

      // Find with Sync
      expect(await syncTypeCollection.findById(doc._id).toPromise()).to.deep.equal(doc);

      // Find with Network
      expect(await networkTypeCollection.findById(doc._id)).to.deep.equal(doc);
    });

    it('should save locally the item if connectivity error occurs');

    it('should throw error if invalid credentials');

    it('should create mutiple sync operations with connectivity issues');

    it('should update an item with existing _id tagged store', async function() {
      const tag = randomString();
      const taggedAutoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto, { tag });
      const taggedSyncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync, { tag });
      const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);
      const networkTypeCollection = DataStore.collection(collectionName, DataStoreType.Network);

      // Update a doc
      let doc = await taggedAutoTypeCollection.create({});
      doc = await taggedAutoTypeCollection.update(Object.assign({}, doc, { foo: 'bar' }));

      // Find with Network
      expect(await networkTypeCollection.find().toPromise()).to.deep.equal([doc]);

      // Find with tagged Sync
      expect(await taggedSyncTypeCollection.find().toPromise()).to.deep.equal([doc]);

      // Find with Sync
      expect(await syncTypeCollection.find().toPromise()).to.deep.equal([]);
    });
  });

  describe('Remove', function() {
    it('should remove items matching a query', async function() {
      const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
      const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);
      const networkTypeCollection = DataStore.collection(collectionName, DataStoreType.Network);

      // Create sample docs
      const propertyName = 'title';
      const sampleDocs = [];
      sampleDocs.push(await autoTypeCollection.create({ [propertyName]: randomString() }));
      sampleDocs.push(await autoTypeCollection.create({ [propertyName]: randomString() }));
      sampleDocs.push(await autoTypeCollection.create({ [propertyName]: randomString() }));

      // Create a query
      const query = new Query()
        .contains(propertyName, [sampleDocs[0][propertyName], sampleDocs[1][propertyName]]);

      // Remove docs
      expect(await autoTypeCollection.remove(query)).to.deep.equal({ count: 2 });

      // Find with Network
      expect(await networkTypeCollection.find().toPromise()).to.deep.equal([sampleDocs[2]]);

      // Find with Sync
      expect(await syncTypeCollection.find().toPromise()).to.deep.equal([sampleDocs[2]]);
    });

    it('should remove items from the backend even if they are deleted locally', async function() {
      const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
      const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);
      const networkTypeCollection = DataStore.collection(collectionName, DataStoreType.Network);

      // Create sample docs
      const propertyName = 'title';
      const sampleDocs = [];
      sampleDocs.push(await autoTypeCollection.create({ [propertyName]: randomString() }));
      sampleDocs.push(await autoTypeCollection.create({ [propertyName]: randomString() }));

      // Create a query
      const query = new Query()
        .contains(propertyName, [sampleDocs[0][propertyName]]);

      // Remove docs with Sync
      expect(await syncTypeCollection.remove(query)).to.deep.equal({ count: 1 });

      // Remove docs with Auto
      expect(await autoTypeCollection.remove(query)).to.deep.equal({ count: 1 });

      // Find with Network
      try {
        await networkTypeCollection.findById(sampleDocs[0]._id).toPromise();
        throw new Error('This test should fail');
      } catch (error) {
        expect(error).to.be.instanceOf(Errors.NotFoundError);
      }
    });

    it('should return 0 when no items are deleted', async function() {
      const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
      const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);
      const networkTypeCollection = DataStore.collection(collectionName, DataStoreType.Network);

      // Create sample docs
      const propertyName = 'title';
      const sampleDocs = [];
      sampleDocs.push(await autoTypeCollection.create({ [propertyName]: randomString() }));
      sampleDocs.push(await autoTypeCollection.create({ [propertyName]: randomString() }));
      sampleDocs.push(await autoTypeCollection.create({ [propertyName]: randomString() }));

      // Create a query
      const query = new Query()
        .equalTo(propertyName, randomString());

      // Remove docs
      expect(await autoTypeCollection.remove(query)).to.deep.equal({ count: 0 });

      // Find with Network
      expect(await networkTypeCollection.find().toPromise()).to.deep.equal(sampleDocs);

      // Find with Sync
      expect(await syncTypeCollection.find().toPromise()).to.deep.equal(sampleDocs);
    });

    it('should return an error for invalid query');

    it('should remove item locally and create delete operation in the sync queue with connectivity error');

    it('should delete locally stored items that are deleted from the backend', async function() {
      const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
      const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);
      const networkTypeCollection = DataStore.collection(collectionName, DataStoreType.Network);

      // Create sample docs
      const propertyName = 'title';
      const sampleDocs = [];
      sampleDocs.push(await autoTypeCollection.create({ [propertyName]: randomString() }));
      sampleDocs.push(await autoTypeCollection.create({ [propertyName]: randomString() }));

      // Create a query
      const query = new Query()
        .contains(propertyName, [sampleDocs[0][propertyName]]);

      // Remove docs with Network
      expect(await networkTypeCollection.remove(query)).to.deep.equal({ count: 1 });

      // Remove docs with Auto
      expect(await autoTypeCollection.remove(query)).to.deep.equal({ count: 0 });

      // Find with Sync
      try {
        await syncTypeCollection.findById(sampleDocs[0]._id).toPromise();
        throw new Error('This test should fail');
      } catch (error) {
        expect(error).to.be.instanceOf(Errors.NotFoundError);
      }
    });

    it.skip('should delete items with tagged store', async function() {
      const tag = randomString();
      const taggedAutoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto, { tag });
      const autoTypeCollection = DataStore.collection(collectionName, DataStoreType.Auto);
      const taggedSyncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync, { tag });
      const syncTypeCollection = DataStore.collection(collectionName, DataStoreType.Sync);

      // Create sample docs
      const propertyName = 'title';
      const taggedDoc = await taggedAutoTypeCollection.create({ [propertyName]: randomString() });
      const doc = await autoTypeCollection.create({ [propertyName]: randomString() });

      // // Find with tagged Sync
      // expect(await taggedSyncTypeCollection.find().toPromise()).to.deep.equal([taggedDoc]);

      // Remove with Auto
      expect(await taggedAutoTypeCollection.remove()).to.deep.equal({ count: 1 });

      // // Find with tagged Sync
      // expect(await taggedSyncTypeCollection.find().toPromise()).to.deep.equal([]);

      // // Find with Sync
      // expect(await syncTypeCollection.find().toPromise()).to.deep.equal([doc]);
    });
  });

  // describe('RemoveById');
});
