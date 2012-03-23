/*global require:true */
var Kinvey = require('../dist/kinvey.js');

// Tests class inheritance
exports.Util = function(test) {
  var Entity = new Kinvey.Entity('');
  var User = new Kinvey.User();

  test.expect(4);
  test.ok(User instanceof Kinvey.User, 'User is a Kinvey.User');
  test.ok(User instanceof Kinvey.Entity, 'User is a Kinvey.Entity');
  test.ok(Entity instanceof Kinvey.Entity, 'Entity is a Kinvey.Entity');
  test.ok(!(Entity instanceof Kinvey.User), 'Entity is not a Kinvey.User');
  test.done();
};

// Test top-level namespace
exports.Kinvey = {
  // Kinvey.init
  'init': function(test) {
    test.expect(2);
    test.throws(function() {
      Kinvey.init({
        appSecret: 'foo'
      });
    }, Error, 'Init throws Error on empty appKey');
    test.throws(function() {
      Kinvey.init({
        appKey: 'foo'
      });
    }, Error, 'Init throws Error on empty appSecret');
    test.done();
  },

  // Kinvey.ping
  'ping': function(test) {
    test.expect(1);
    Kinvey.ping(function() {
      test.ok(true, 'Ping successful');
      test.done();
    }, function() {
      test.ok(false, 'Ping failed');
      test.done();
    });
  }
};