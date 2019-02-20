import { expect } from 'chai';
import _ from 'lodash';
// eslint-disable-next-line import/extensions
import * as Kinvey from '__SDK__';
import * as utilities from './utils';

const createdUserIds = [];
const collectionName = process.env.COLLECTION_NAME;
var networkStore;
var appCredentials;

const checkLocalStorageForSubscriptionKey = () => {
  var hasSubscriptionKey = false;
  for (var key in localStorage) {
    if (key.indexOf('sub') !== -1) {
      hasSubscriptionKey = true;
    }
  }
  return hasSubscriptionKey;
}

describe.skip('Live-services', () => {
  networkStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Network);

  var messageCreated;
  var messageUpdated;

  const entity1 = utilities.getEntity(utilities.randomString());
  const entity2 = utilities.getEntity(utilities.randomString());
  const entity3 = utilities.getEntity(utilities.randomString());

  before(() => {
    appCredentials = Kinvey.init({
      appKey: process.env.APP_KEY,
      appSecret: process.env.APP_SECRET,
      masterSecret: process.env.MASTER_SECRET
    });
  });

  before((done) => {
    utilities.cleanUpAppData(collectionName, createdUserIds)
      .then(() => Kinvey.User.signup())
      .then((user) => {
        createdUserIds.push(user.data._id);
        done();
      })
      .catch(done);
  });

  before((done) => {
    networkStore.save(entity1)
      .then(() => {
        networkStore.save(entity2)
          .then(() => {
            done();
          })
      }).catch(done);
  })

  afterEach((done) => {
    const activeUser = Kinvey.User.getActiveUser();
    if (activeUser) {
      activeUser.unregisterFromLiveService()
        .then(() => {
          //expect(checkLocalStorageForSubscriptionKey()).to.equal(false);
          done();
        })
        .catch(done);
    }
  });


  it('should register user for live services', (done) => {
    const activeUser = Kinvey.User.getActiveUser();
    activeUser.registerForLiveService()
      .then((res) => {
        expect(res).to.equal(true);
        expect(checkLocalStorageForSubscriptionKey()).to.equal(true);
        done();
      })
      .catch(done);
  });

  it('should subscribe user and receive messages for created items', (done) => {
    const activeUser = Kinvey.User.getActiveUser();
    activeUser.registerForLiveService()
      .then((res) => {
        expect(res).to.equal(true);
        expect(checkLocalStorageForSubscriptionKey()).to.equal(true);
        networkStore.subscribe({
          onMessage: (m) => {
            messageCreated = m;
          },
          onStatus: (s) => {
            throw new Error('This should not happen');
          },
          onError: (e) => {
            throw new Error(err);
          }
        })
          .then(() => {
            networkStore.save(entity3)
              .then((res) => {
                setTimeout(()=>{
                  expect(utilities.deleteEntityMetadata(messageCreated)).to.deep.equal(entity3);
                  done();
                }, 4000)
              })
              .catch(done);
          })
          .catch(done);
      })
      .catch(done);
  });

  it('should subscribe user and receive messages for updated items', (done) => {
    const updatedEntity = Object.assign({}, entity1)
    updatedEntity.textField = 'updatedField';

    const activeUser = Kinvey.User.getActiveUser();
    activeUser.registerForLiveService()
      .then((res) => {
        expect(res).to.equal(true);
        expect(checkLocalStorageForSubscriptionKey()).to.equal(true);
        networkStore.subscribe({
          onMessage: (m) => {
            messageUpdated = m;
          },
          onStatus: (s) => {
            throw new Error('This should not happen');
          },
          onError: (e) => {
            throw new Error(err);
          }
        })
          .then(() => {
            networkStore.save(updatedEntity)
              .then(() => {
                setTimeout(()=>{
                  expect(utilities.deleteEntityMetadata(messageUpdated)).to.deep.equal(updatedEntity);
                  done();
                }, 4000)
              })
              .catch(done);
          })
          .catch(done);
      })
      .catch(done);
  });
});
