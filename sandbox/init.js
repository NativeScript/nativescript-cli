require('babel-core/register');
const Kinvey = require('../src/kinvey');
const User = require('../src/core/models/user');

Kinvey.init({
  appId: 'kid_byGoHmnX2',
  appSecret: '9b8431f34279434bbedaceb2fe6b8fb5'
});

module.exports = User.login('admin', 'admin');
