const promise = require('./init');
const DataPolicy = require('../src/core/enums').DataPolicy;
const LocalStore = require('../src/core/stores/localStore');
const Query = require('../src/core/query');
const store = new LocalStore('books');

promise.then(() => {
  return store.find();
}).then(books => {
  console.log(books);
  return store.create({
    title: 'Kinvey: A Path to Success'
  }, {
    dataPolicy: DataPolicy.ForceLocal
  });
}).then(book => {
  console.log(book);
  return store.find();
}).then(books => {
  console.log(books);
});
