const promise = require('./init');
// const DataPolicy = require('../src/core/enums').DataPolicy;
const assert = require('assert');
const SyncStore = require('../src/core/stores/syncStore');
const store = new SyncStore('books');

promise.then(() => {
  return store.find();
}).then(books => {
  assert(books, []);
  return store.create({
    title: 'Kinvey: Mobile Library Development 101'
  });
}).then(() => {
  return store.find();
}).then(books => {
  console.log(books);
  return store.push();
}).then(result => {
  console.log(result);
  return store.syncCount();
}).then(result => {
  console.log(result);
  return store.find();
}).then(books => {
  console.log(books);
});

// promise.then(() => {
//   return store.find();
// }).then(books => {
//   assert(books, []);
//   return store.sync();
// }).then(result => {
//   console.log(result);
//   return store.find();
// }).then(books => {
//   console.log(books);
// });
