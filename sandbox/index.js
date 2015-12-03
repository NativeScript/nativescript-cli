require('babel-core/register');
const Kinvey = require('../src/kinvey');
const Files = require('../src/core/collections/files');
const User = require('../src/core/models/user');
const fs = require('fs');
const path = require('path');

Kinvey.Logger.setLevel(Kinvey.Logger.levels.DEBUG);

Kinvey.init({
  appKey: 'kid_byGoHmnX2',
  appSecret: '9b8431f34279434bbedaceb2fe6b8fb5'
});

User.login('admin', 'admin').then(() => {
  const filename = 'test.png';
  fs.readFile(path.normalize(path.join(__dirname, filename)), (err, data) => {
    if (err) {
      return console.log(err);
    }

    const files = new Files();
    files.upload(data, null, {
      public: true
    }).then(response => {
      console.log(response);
    });
  });
});

// User.login('admin', 'admin').then(() => {
//   const files = new Files();
//   return files.find();
// }).then(files => {
//   console.log(files);
// });
