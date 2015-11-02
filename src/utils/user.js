const StoreAdapter = require('../core/enums/storeAdapter');
const Store = require('../core/storage/store');
const Client = require('../core/client');
const result = require('lodash/object/result');
const activeUserCollection = 'activeUser';

function getActiveUser() {
  const client = Client.sharedInstance();
  const store = new Store(StoreAdapter.LocalStorage, {
    name: client.appId,
    collection: activeUserCollection
  });

  return store.find().then(users => {
    if (users.length === 0) {
      return null;
    }

    return users[0];
  });
}

function setActiveUser(user) {
  const client = Client.sharedInstance();
  const store = new Store(StoreAdapter.LocalStorage, {
    name: client.appId,
    collection: activeUserCollection
  });

  const promise = getActiveUser().then(activeUser => {
    if (activeUser) {
      return store.delete(activeUser._id);
    }
  }).then(() => {
    if (user) {
      return store.save(result(user, 'toJSON', user));
    }
  });

  return promise;
}

module.exports = {
  getActiveUser: getActiveUser,
  setActiveUser: setActiveUser
};
