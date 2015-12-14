const promise = require('./init');
const DataPolicy = require('../src/core/enums').DataPolicy;
const Store = require('../src/core/stores/store');
const store = new Store('books');

promise.then(() => {
  return store.find();
}).then(books => {
  return store.create({
    title: 'Kinvey: Mobile Library Development 101'
  }, {
    dataPolicy: DataPolicy.ForceNetwork
  });
}).then(() => {
  return store.find();
}).then(() => {
  return store.find();
});
