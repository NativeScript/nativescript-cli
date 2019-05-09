import { expect } from 'chai';
import nock from 'nock';
import { init, DataStore, DataStoreType, User, Query } from '__SDK__';
import { collectionName } from '../config';
import { cleanUpAppData } from '../utils';

describe('AutoStore', function() {
  const cachedDocs = [];

  before(function () {
    // Turn off nock
    return nock.restore();
  });

  before(function() {
    // Initialize the SDK
    return init({
      appKey: process.env.APP_KEY,
      appSecret: process.env.APP_SECRET
    });
  });

  before(function () {
    // Remove any existing data in the collection
    return cleanUpAppData(collectionName);
  });

  before(function() {
    // Signup an anonymous user
    return User.signup();
  });

  before(function() {
    const collection = DataStore.collection(collectionName, DataStoreType.Sync);
    return collection.save({ title: 'Cached Book' })
      .then((doc) => {
        cachedDocs.push(doc);
        const query = new Query().equalTo('_id', doc._id);
        collection.clearSync(query);
      });
  });

  before(function() {
    // Turn on nock
    return nock.activate();
  });

  after(function () {
    // Turn off nock
    return nock.restore();
  });

  after(function() {
    // Remove any existing data in the collection
    return cleanUpAppData(collectionName);
  });

  after(function() {
    // Remove the active user
    const activeUser = User.getActiveUser();
    if (activeUser) {
      return User.remove(activeUser._id, { hard: true });
    }
    return null;
  });

  it('should return cached items when the network request fails', async function() {
    const scope = nock('https://baas.kinvey.com')
      .get(`/appdata/${process.env.APP_KEY}/${collectionName}`)
      .replyWithError({
        message: 'no network connection'
      });

    const collection = DataStore.collection(collectionName, DataStoreType.Auto);
    const docs = await collection.find();
    expect(docs).to.deep.equal(cachedDocs);
    expect(scope.isDone()).to.equal(true);
  });
});
