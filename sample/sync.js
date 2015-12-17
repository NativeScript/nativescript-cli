require('babel-core/register');
var Kinvey = require('../src/kinvey');

// Initialize the library
Kinvey.init({
  appId: 'kid_byGoHmnX2',
  appSecret: '9b8431f34279434bbedaceb2fe6b8fb5'
});

var User = require('../src/core/models/user');
var SyncStore = require('../src/core/stores/syncStore');
var store = new SyncStore('books');

// Login the admin user
var promise = User.login('admin', 'admin');

promise.then(function() {
  // Lets pull some data from the Kinvey Backend
  // into our store
  return store.pull();
}).then(function() {
  // Lets create a book that can be synced
  // at a later time
  return store.create({
    title: 'Kinvey: JavaScript Library 3.0'
  });
}).then(function() {
  // Lets see what data we have in our store
  return store.find();
}).then(function(books) {
  console.log(books);

  // Lets update a book that can be synced
  // at a later time
  var book = books.find(function(book) {
    return !book.isNew();
  });
  book.set('title', 'This is a new title.');
  return store.update(book);
}).then(function() {
  // How many items are available to sync?
  return store.syncCount();
}).then(function(count) {
  console.log('Sync count = %d', count);

  // Lets sync these items
  return store.push();
}).then(function(result) {
  console.log('Sync result: %s', result);
});
