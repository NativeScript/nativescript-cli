import StoreAdapter from '../core/enums/storeAdapter';
import Store from '../core/cache/store';
import Client from '../core/client';
const activeUserCollection = 'activeUser';

export function getActiveUser() {
  const client = Client.sharedInstance();
  const store = new Store(StoreAdapter.LocalStorage, {
    name: client.appKey,
    collection: activeUserCollection
  });

  return store.find().then(users => {
    if (users.length === 0) {
      return null;
    }

    return users[0];
  });
}

export function setActiveUser(user) {
  const client = Client.sharedInstance();
  const store = new Store(StoreAdapter.LocalStorage, {
    name: client.appKey,
    collection: activeUserCollection
  });

  const promise = getActiveUser().then(activeUser => {
    if (activeUser) {
      return store.delete(activeUser._id);
    }
  }).then(() => {
    if (user) {
      return store.save(user);
    }
  });

  return promise;
}
