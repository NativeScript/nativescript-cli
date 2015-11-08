const StoreAdapter = require('../core/enums/storeAdapter');
const Store = require('../core/store');
const Client = require('../core/client');
const result = require('lodash/object/result');
const activeUserCollection = 'activeUser';

function getActiveUser(client = Client.sharedInstance()) {
  const store = new Store(`${client.appId}.${activeUserCollection}`, [StoreAdapter.IndexedDB, StoreAdapter.WebSQL]);

  return store.find().then(users => {
    if (users.length === 0) {
      return null;
    }

    return users[0];
  });
}

function setActiveUser(user, client = Client.sharedInstance()) {
  const store = new Store(`${client.appId}.${activeUserCollection}`, [StoreAdapter.IndexedDB, StoreAdapter.WebSQL]);

  const promise = getActiveUser().then(activeUser => {
    if (activeUser) {
      return store.remove(activeUser._id);
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
