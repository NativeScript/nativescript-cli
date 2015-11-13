require('babel-core/register');
const Kinvey = require('../src/kinvey');
Kinvey.Logger.setLevel(Kinvey.Logger.levels.DEBUG);

const client = Kinvey.init({
  appKey: 'kid_byGoHmnX2',
  appSecret: '9b8431f34279434bbedaceb2fe6b8fb5'
});

Kinvey.User.getActive().then(user => {
  if (!user) {
    return Kinvey.User.login('admin', 'admin');
  }

  return user;
}).then(user => {
  const booksCollection = new Kinvey.Collection('books');
  const query = new Kinvey.Query();
  query.equalTo('title', 'Harry Potter');
  query.limit(2);
  return booksCollection.find(query);
}).then(books => {
  console.log(books);
});
