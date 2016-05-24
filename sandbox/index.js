require('babel-regenerator-runtime');
var Kinvey = require('../es5/kinvey').default;

Kinvey.init({
  appKey: 'kid_byGoHmnX2',
  appSecret: '9b8431f34279434bbedaceb2fe6b8fb5'
});

Kinvey.User.login('admin', 'admin').then(function() {
  var foo = Kinvey.DataStore.collection('foo');
  foo.offline();
  return foo.update([
    {
      prop: 'bar'
    },
    {
      prop: 'baz'
    }
  ]);
}).then(function() {
  // var foo = Kinvey.DataStore.collection('foo');
  // return foo.update([
  //   {
  //     prop: 'barr'
  //   },
  //   {
  //     prop: 'bazz'
  //   }
  // ]);
  return;
}).then(function() {
  var foo = Kinvey.DataStore.collection('foo');
  return foo.find().subscribe(function(entities) {
    console.log(entities);
  });
}).catch(function(error) {
  console.log(error);
});
