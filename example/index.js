require('babel-core/register');
const Kinvey = require('../src/kinvey');
Kinvey.Logger.setLevel(Kinvey.Logger.levels.DEBUG);

const client = Kinvey.init({
  appKey: 'kid_byGoHmnX2',
  appSecret: '9b8431f34279434bbedaceb2fe6b8fb5'
});

Kinvey.User.login('admin', 'admin').then(user => {
  var books = new Kinvey.Datastore('books');
  return books.find();
});
