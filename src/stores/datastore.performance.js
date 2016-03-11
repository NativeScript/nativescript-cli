/* eslint-disable no-console */
import { Kinvey } from '../kinvey';
import { DataStore, DataStoreType } from './datastore';
import { User } from '../user';
import LegacyKinvey from 'kinvey';
import prettyHrtime from 'pretty-hrtime';
let start;
let end;

Kinvey.init({
  appKey: 'kid_byGoHmnX2',
  appSecret: '9b8431f34279434bbedaceb2fe6b8fb5'
});

User.login('admin', 'admin').then(() => {
  start = process.hrtime();
  const store = DataStore.getInstance('books', DataStoreType.Cache);
  return store.find(null, {
    useDeltaFetch: false
  });
}).then(response => {
  return response.networkPromise;
}).then(() => {
  end = process.hrtime(start);
  console.log(`3.x took ${prettyHrtime(end)}`);
}).catch(error => {
  console.log(error);
}).then(() => {
  return LegacyKinvey.init({
    appKey: 'kid_byGoHmnX2',
    appSecret: '9b8431f34279434bbedaceb2fe6b8fb5'
  });
}).then(user => {
  if (!user) {
    return LegacyKinvey.User.login('admin', 'admin');
  }

  return user;
}).then(() => {
  start = process.hrtime();
  return LegacyKinvey.DataStore.find('books', null, {
    offline: false,
    fallback: true,
    refresh: true
  });
}).then(() => {
  end = process.hrtime(start);
  console.log(`1.x took ${prettyHrtime(end)}`);
}).catch(error => {
  console.log(error);
});
