const promise = require('./init');

promise.then(() => {
  const User = require('../src/core/models/user');
  const Users = require('../src/core/stores/users');
  const Client = require('../src/core/client');

  const customerClient = new Client({
    appId: 'kid_Wk65R8jK5x',
    appSecret: '6ded79dd091f4bb7ac0cc0ca1e4db700'
  });
  const customerUsersCollection = new Users({
    client: customerClient
  });
  const customerUser = new User({
    username: 'thomas.conner',
    password: 'secret'
  }, {
    client: customerClient
  });

  const adminClient = new Client({
    appId: 'kid_ZkshTIoY5g',
    appSecret: 'e0938dd41f2a496cb14bc754ecfd3890'
  });
  const adminUsersCollection = new Users({
    client: adminClient
  });
  const adminUser = new User({
    username: 'admin',
    password: 'admin'
  }, {
    client: adminClient
  });

  customerUsersCollection.signup(customerUser).catch(() => {
    return customerUser.login();
  }).then(() => {
    return adminUsersCollection.signup(adminUser);
  }).catch(() => {
    return adminUser.login();
  }).then(() => {
    return User.getActive();
  }).then(customerUser => {
    console.log(customerUser);
    return User.getActive({
      client: adminClient
    });
  }).then(adminUser => {
    console.log(adminUser);
  });
});
