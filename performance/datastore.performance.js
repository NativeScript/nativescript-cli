/* eslint-disable no-console */
import { Kinvey } from '../src/kinvey';
import { DataStore, DataStoreType } from '../src/stores/datastore';
import { User } from '../src/user';
import LegacyKinvey from 'kinvey';
import prettyHrtime from 'pretty-hrtime';
let start;
let end;

// Kinvey.init({
//   appKey: 'kid_b1d6IY_x7l',
//   appSecret: '079412ee99f4485d85e6e362fb987de8'
// });

// User.login('admin', 'admin').then(() => {
//   // console.profile('datastore');
//   start = process.hrtime();
//   const store = DataStore.getInstance('posts', DataStoreType.Cache);
//   return store.find(null, {
//     useDeltaFetch: false
//   });
// }).then(response => {
//   return response.networkPromise;
// }).then(() => {
//   end = process.hrtime(start);
//   // console.profileEnd('datastore');
//   console.log(`3.x took ${prettyHrtime(end)}`);
// }).catch(error => {
//   console.log(error);
// });

// User.login('admin', 'admin').then(() => {
//   // console.profile('datastore');
//   start = process.hrtime();
//   const store = DataStore.getInstance('posts', DataStoreType.Network);
//   return store.find();
// }).then(() => {
//   end = process.hrtime(start);
//   // console.profileEnd('datastore');
//   console.log(`3.x took ${prettyHrtime(end)}`);
// }).catch(error => {
//   console.log(error);
// });

// User.login('admin', 'admin').then(() => {
//   const store = DataStore.getInstance('longdata', DataStoreType.Cache);
//   return store.find(null, {
//     useDeltaFetch: true
//   });
// }).then(response => {
//   return response.networkPromise;
// }).then(() => {
//   start = process.hrtime();
//   const store = DataStore.getInstance('longdata', DataStoreType.Cache);
//   return store.find(null, {
//     useDeltaFetch: true
//   });
// }).then(response => {
//   return response.networkPromise;
// }).then(() => {
//   end = process.hrtime(start);
//   console.log(`3.x took ${prettyHrtime(end)}`);
// }).catch(error => {
//   console.log(error);
// });

LegacyKinvey.init({
  appKey: 'kid_byGoHmnX2',
  appSecret: '9b8431f34279434bbedaceb2fe6b8fb5'
}).then(user => {
  if (!user) {
    return LegacyKinvey.User.login('admin', 'admin');
  }

  return user;
}).then(() => {
  start = process.hrtime();
  return LegacyKinvey.DataStore.find('posts', null, {
    offline: true,
    fallback: true,
    refresh: true
  });
}).then(() => {
  end = process.hrtime(start);
  console.log(`1.x took ${prettyHrtime(end)}`);
}).catch(error => {
  console.log(error);
});
