require('babel-core/register');
const Kinvey = require('../src/kinvey');
Kinvey.Logger.setLevel(Kinvey.Logger.levels.ERROR);

const client = Kinvey.init({
  appKey: 'kid_byGoHmnX2',
  appSecret: '9b8431f34279434bbedaceb2fe6b8fb5'
});

Kinvey.User.login('admin', 'admin').then(user => {
  const booksCollection = new Kinvey.Collection('books');
  return booksCollection.find();
}).then(books => {
  console.log(books);
});
