"use strict";

require("core-js/modules/es.array.find");

require("core-js/modules/es.object.define-property");

require("core-js/modules/es.object.get-own-property-descriptor");

require("core-js/modules/es.object.to-string");

require("core-js/modules/es.promise");

var _chai = require("chai");

var Kinvey = _interopRequireWildcard(require("kinvey-html5-sdk"));

var config = _interopRequireWildcard(require("../config"));

var utilities = _interopRequireWildcard(require("../utils"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; return newObj; } }

var appCredentials;
var collectionName = config.collectionName;

var assertUserData = function assertUserData(user, expectedUsername, shouldReturnPassword) {
  (0, _chai.expect)(user.data._id).to.exist;
  (0, _chai.expect)(user.metadata.authtoken).to.exist;
  (0, _chai.expect)(user.metadata.lmt).to.exist;
  (0, _chai.expect)(user.metadata.ect).to.exist;
  (0, _chai.expect)(user._acl.creator).to.exist;

  if (expectedUsername) {
    (0, _chai.expect)(user.data.username).to.equal(expectedUsername);
  } else {
    (0, _chai.expect)(user.data.username).to.exist;
  }

  if (shouldReturnPassword) {
    (0, _chai.expect)(user.data.password).to.exist;
  }

  (0, _chai.expect)(user.isActive()).to.equal(true);
  (0, _chai.expect)(user).to.deep.equal(Kinvey.User.getActiveUser());
};

var getMissingUsernameErrorMessage = 'A username was not provided.';
var getMissingEmailErrorMessage = 'An email was not provided.';

var getNotAStringErrorMessage = function getNotAStringErrorMessage(parameter) {
  return "The provided ".concat(parameter, " is not a string.");
};

var safelySignUpUser = function safelySignUpUser(username, password, state, createdUserIds) {
  return Kinvey.User.logout().then(function () {
    return Kinvey.User.signup({
      username: username,
      password: password,
      email: utilities.randomEmailAddress()
    }, {
      state: state
    });
  }).then(function (user) {
    createdUserIds.push(user.data._id);
    return user;
  });
};

before(function () {
  appCredentials = Kinvey.init({
    appKey: process.env.APP_KEY,
    appSecret: process.env.APP_SECRET,
    masterSecret: process.env.MASTER_SECRET
  });
});
before(function () {
  utilities.cleanUpCollection(appCredentials, 'user');
});
describe('User tests', function () {
  var missingCredentialsError = 'Username and/or password missing';
  var createdUserIds = [];
  before(function (done) {
    utilities.cleanUpAppData(collectionName, createdUserIds).then(function () {
      return done();
    })["catch"](done);
  });
  after(function (done) {
    utilities.cleanUpAppData(collectionName, createdUserIds).then(function () {
      return done();
    })["catch"](done);
  });
  describe('login()', function () {
    beforeEach(function (done) {
      Kinvey.User.logout().then(function () {
        return done();
      });
    });
    it('should throw an error if an active user already exists', function (done) {
      Kinvey.User.signup().then(function (user) {
        createdUserIds.push(user.data._id);
        return Kinvey.User.login(utilities.randomString(), utilities.randomString());
      })["catch"](function (error) {
        (0, _chai.expect)(error.message).to.contain('An active user already exists.');
        done();
      })["catch"](done);
    });
    it('should throw an error if a username is not provided', function (done) {
      Kinvey.User.login(null, utilities.randomString())["catch"](function (error) {
        (0, _chai.expect)(error.message).to.contain(missingCredentialsError);
        done();
      })["catch"](done);
    });
    it('should throw an error if the username is an empty string', function (done) {
      Kinvey.User.login(' ', utilities.randomString())["catch"](function (error) {
        (0, _chai.expect)(error.message).to.contain(missingCredentialsError);
        done();
      })["catch"](done);
    });
    it('should throw an error if a password is not provided', function (done) {
      Kinvey.User.login(utilities.randomString())["catch"](function (error) {
        (0, _chai.expect)(error.message).to.contain(missingCredentialsError);
        done();
      })["catch"](done);
    });
    it('should throw an error if the password is an empty string', function (done) {
      Kinvey.User.login(utilities.randomString(), ' ')["catch"](function (error) {
        (0, _chai.expect)(error.message).to.contain(missingCredentialsError);
        done();
      })["catch"](done);
    });
    it('should throw an error if the username and/or password is invalid', function (done) {
      Kinvey.User.login(utilities.randomString(), utilities.randomString())["catch"](function (error) {
        (0, _chai.expect)(error.message).to.contain('Invalid credentials.');
        done();
      })["catch"](done);
    });
    it('should login a user', function (done) {
      var username = utilities.randomString();
      var password = utilities.randomString();
      Kinvey.User.signup({
        username: username,
        password: password
      }).then(function (user) {
        createdUserIds.push(user.data._id);
        return Kinvey.User.logout();
      }).then(function () {
        return Kinvey.User.login(username, password);
      }).then(function (user) {
        assertUserData(user, username);
        done();
      })["catch"](done);
    });
    it('should login a user by providing credentials as an object', function (done) {
      var username = utilities.randomString();
      var password = utilities.randomString();
      Kinvey.User.signup({
        username: username,
        password: password
      }).then(function (user) {
        createdUserIds.push(user.data._id);
        return Kinvey.User.logout();
      }).then(function () {
        return Kinvey.User.login({
          username: username,
          password: password
        });
      }).then(function (user) {
        assertUserData(user, username);
        done();
      })["catch"](done);
    });
  });
  describe('logout()', function () {
    var syncDataStore;
    var username = utilities.randomString();
    var password = utilities.randomString();
    before(function (done) {
      syncDataStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Sync);
      safelySignUpUser(username, password, true, createdUserIds).then(function () {
        return syncDataStore.save({
          field: 'value'
        });
      }).then(function () {
        return done();
      })["catch"](done);
    });
    it('should logout the active user', function (done) {
      (0, _chai.expect)(Kinvey.User.getActiveUser()).to.not.equal(null);
      Kinvey.User.logout().then(function (user) {
        (0, _chai.expect)(user.isActive()).to.equal(false);
        (0, _chai.expect)(Kinvey.User.getActiveUser()).to.equal(null);
        return Kinvey.User.signup();
      }).then(function (user) {
        createdUserIds.push(user.data._id);
        var dataStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Sync);
        return dataStore.find().toPromise();
      }).then(function (entities) {
        (0, _chai.expect)(entities).to.deep.equal([]);
        done();
      })["catch"](done);
    });
    it('should logout when there is not an active user', function (done) {
      Kinvey.User.logout().then(function () {
        return Kinvey.User.logout();
      }).then(function () {
        (0, _chai.expect)(Kinvey.User.getActiveUser()).to.equal(null);
      }).then(function () {
        return done();
      })["catch"](done);
    });
  });
  describe('signup', function () {
    beforeEach(function (done) {
      Kinvey.User.logout().then(function () {
        return done();
      });
    });
    it('should signup and set the user as the active user', function (done) {
      var username = utilities.randomString();
      Kinvey.User.signup({
        username: username,
        password: utilities.randomString()
      }).then(function (user) {
        createdUserIds.push(user.data._id);
        assertUserData(user, username, true);
        done();
      })["catch"](done);
    });
    it('should signup with a user and set the user as the active user', function (done) {
      var username = utilities.randomString();
      var newUser = new Kinvey.User({
        username: username,
        password: utilities.randomString()
      });
      Kinvey.User.signup(newUser).then(function (user) {
        createdUserIds.push(user.data._id);
        assertUserData(user, username, true);
        done();
      })["catch"](done);
    });
    it('should signup with attributes and store them correctly', function (done) {
      var data = {
        username: utilities.randomString(),
        password: utilities.randomString(),
        email: utilities.randomEmailAddress(),
        additionalField: 'test'
      };
      Kinvey.User.signup(data).then(function (user) {
        createdUserIds.push(user.data._id);
        assertUserData(user, data.username, true);
        (0, _chai.expect)(user.data.email).to.equal(data.email);
        (0, _chai.expect)(user.data.additionalField).to.equal(data.additionalField);
        done();
      })["catch"](done);
    });
    it('should signup user and not set the user as the active user if options.state = false', function (done) {
      Kinvey.User.signup({
        username: utilities.randomString(),
        password: utilities.randomString()
      }, {
        state: false
      }).then(function (user) {
        createdUserIds.push(user.data._id);
        (0, _chai.expect)(user.isActive()).to.equal(false);
        done();
      })["catch"](done);
    });
    it('should signup an implicit user and set the user as the active user', function (done) {
      Kinvey.User.signup().then(function (user) {
        createdUserIds.push(user.data._id);
        assertUserData(user, null, true);
        done();
      })["catch"](done);
    });
    it.skip('should merge the signup data and set the user as the active user', function (done) {
      var username = utilities.randomString();
      var password = utilities.randomString();
      var newUser = new Kinvey.User({
        username: utilities.randomString(),
        password: password
      });
      newUser.signup({
        username: username
      }).then(function (user) {
        createdUserIds.push(user.data._id);
        (0, _chai.expect)(user.isActive()).to.equal(true);
        (0, _chai.expect)(user.data.username).to.equal(username);
        (0, _chai.expect)(user.data.password).to.equal(password);
        (0, _chai.expect)(user).to.deep.equal(Kinvey.User.getActiveUser());
        done();
      })["catch"](done);
    });
    it('should throw an error if an active user already exists', function (done) {
      Kinvey.User.signup().then(function (user) {
        createdUserIds.push(user.data._id);
        return Kinvey.User.signup();
      })["catch"](function (error) {
        (0, _chai.expect)(error.message).to.contain('An active user already exists.');
        done();
      })["catch"](done);
    });
    it('should not throw an error with an active user and options.state set to false', function (done) {
      Kinvey.User.signup().then(function (user) {
        createdUserIds.push(user.data._id);
        return Kinvey.User.signup({
          username: utilities.randomString(),
          password: utilities.randomString()
        }, {
          state: false
        });
      }).then(function (user) {
        createdUserIds.push(user.data._id);
        (0, _chai.expect)(user.isActive()).to.equal(false);
        (0, _chai.expect)(user).to.not.equal(Kinvey.User.getActiveUser());
        done();
      })["catch"](done);
    });
  });
  describe('update()', function () {
    var username = utilities.randomString();
    before(function (done) {
      safelySignUpUser(username, null, true, createdUserIds).then(function () {
        return done();
      })["catch"](done);
    });
    it('should update the active user', function (done) {
      var newEmail = utilities.randomString();
      var newPassword = utilities.randomString();
      Kinvey.User.update({
        email: newEmail,
        password: newPassword
      }).then(function (user) {
        (0, _chai.expect)(user).to.deep.equal(Kinvey.User.getActiveUser());
        (0, _chai.expect)(user.data.email).to.equal(newEmail);
        var query = new Kinvey.Query();
        query.equalTo('email', newEmail);
        return Kinvey.User.lookup(query).toPromise();
      }).then(function (users) {
        (0, _chai.expect)(users.length).to.equal(1);
        (0, _chai.expect)(users[0].email).to.equal(newEmail);
        return Kinvey.User.logout();
      }).then(function () {
        return done();
      })["catch"](done);
    });
    it.skip('should throw an error if the user does not have an _id', function (done) {
      Kinvey.User.update({
        email: utilities.randomString()
      }).then(function () {
        throw new Error('This test should fail.');
      })["catch"](function (error) {
        (0, _chai.expect)(error.message).to.equal('User must have an _id.');
        done();
      })["catch"](done);
    });
  });
  describe('lookup()', function () {
    var username = utilities.randomString();
    before(function (done) {
      safelySignUpUser(username, null, true, createdUserIds).then(function () {
        return done();
      })["catch"](done);
    });
    it('should throw an error if the query argument is not an instance of the Query class', function (done) {
      Kinvey.User.lookup({}).toPromise()["catch"](function (error) {
        (0, _chai.expect)(error.message).to.equal('Invalid query. It must be an instance of the Query class.');
        done();
      })["catch"](done);
    });
    it('should return an array of users matching the query', function (done) {
      var query = new Kinvey.Query();
      query.equalTo('username', username);
      Kinvey.User.lookup(query).toPromise().then(function (users) {
        (0, _chai.expect)(users).to.be.an('array');
        (0, _chai.expect)(users.length).to.equal(1);
        var user = users[0];
        (0, _chai.expect)(user._id).to.exist;
        (0, _chai.expect)(user.username).to.equal(username);
        done();
      })["catch"](done);
    });
  });
  describe('remove()', function () {
    var userToRemoveId1;
    var userToRemoveId2;
    var username1 = utilities.randomString();
    var username2 = utilities.randomString();
    before(function (done) {
      safelySignUpUser(username1, null, false, createdUserIds).then(function (user) {
        userToRemoveId1 = user.data._id;
      }).then(function () {
        return Kinvey.User.signup({
          username: username2
        }, {
          state: false
        });
      }).then(function (user) {
        userToRemoveId2 = user.data._id;
      }).then(function () {
        return Kinvey.User.signup();
      }).then(function (user) {
        createdUserIds.push(user.data._id);
        done();
      })["catch"](done);
    });
    it('should throw a KinveyError if an id is not provided', function (done) {
      Kinvey.User.remove()["catch"](function (error) {
        (0, _chai.expect)(error.message).to.equal('An id was not provided.');
        done();
      })["catch"](done);
    });
    it('should throw a KinveyError if an id is not a string', function (done) {
      Kinvey.User.remove(1)["catch"](function (error) {
        (0, _chai.expect)(error.message).to.equal('The id provided is not a string.');
        done();
      })["catch"](done);
    });
    it('should return the error from the server if the id does not exist', function (done) {
      Kinvey.User.remove(utilities.randomString())["catch"](function (error) {
        (0, _chai.expect)(error.message).to.equal('This user does not exist for this app backend.');
        done();
      })["catch"](done);
    });
    it('should remove the user that matches the id argument, but the user should remain in the Backend', function (done) {
      Kinvey.User.remove(userToRemoveId1).then(function () {
        return Kinvey.User.exists(username1);
      }).then(function (result) {
        (0, _chai.expect)(result).to.be["true"];
        var query = new Kinvey.Query();
        query.equalTo('username', username1);
        return Kinvey.User.lookup(query).toPromise();
      }).then(function (users) {
        (0, _chai.expect)(users.length).to.equal(0);
        done();
      })["catch"](done);
    });
    it('should not logout user after remove', function (done) {
      Kinvey.User.remove(userToRemoveId1).then(function () {
        var activeUser = Kinvey.User.getActiveUser();
        (0, _chai.expect)(activeUser).to.not.equal(null);
        done();
      })["catch"](done);
    });
    it('should remove the user that matches the id argument permanently', function (done) {
      Kinvey.User.remove(userToRemoveId2, {
        hard: true
      }).then(function () {
        return Kinvey.User.exists(username2);
      }).then(function (result) {
        (0, _chai.expect)(result).to.be["false"];
        done();
      })["catch"](done);
    });
  });
  describe('exists()', function () {
    var username = utilities.randomString();
    before(function (done) {
      safelySignUpUser(username, null, true, createdUserIds).then(function () {
        return done();
      })["catch"](done);
    });
    it('should return true if the user exists in the Backend', function (done) {
      Kinvey.User.exists(username).then(function (result) {
        (0, _chai.expect)(result).to.be["true"];
        done();
      })["catch"](done);
    });
    it('should return false if the user does not exist in the Backend', function (done) {
      Kinvey.User.exists(utilities.randomString()).then(function (result) {
        (0, _chai.expect)(result).to.be["false"];
        done();
      })["catch"](done);
    });
  });
  describe('email sending operations', function () {
    var username = utilities.randomString();
    var email;
    before(function (done) {
      safelySignUpUser(username, null, true, createdUserIds).then(function (user) {
        email = user.data.email;
        done();
      })["catch"](done);
    });
    describe('verifyEmail()', function () {
      it('should start the email verification and User.me should get the updated user from the server', function (done) {
        Kinvey.User.verifyEmail(username).then(function () {
          // Kinvey.User.me() is used to get the created emailVerification field from the server
          return Kinvey.User.me();
        }).then(function (user) {
          (0, _chai.expect)(user.metadata.emailVerification).to.exist;
          done();
        })["catch"](done);
      });
      it('should throw an error if a username is not provided', function (done) {
        Kinvey.User.verifyEmail()["catch"](function (error) {
          (0, _chai.expect)(error.message).to.equal(getMissingUsernameErrorMessage);
          done();
        })["catch"](done);
      });
      it('should throw an error if the provided username is not a string', function (done) {
        Kinvey.User.verifyEmail(1)["catch"](function (error) {
          (0, _chai.expect)(error.message).to.equal(getNotAStringErrorMessage('username'));
          done();
        })["catch"](done);
      });
    });
    describe('forgotUsername()', function () {
      it('should start the email sending process on the server', function (done) {
        Kinvey.User.forgotUsername(email).then(function (result) {
          (0, _chai.expect)(['', null]).to.include(result);
          done();
        })["catch"](done);
      });
      it('should throw an error if an email is not provided', function (done) {
        Kinvey.User.forgotUsername()["catch"](function (error) {
          (0, _chai.expect)(error.message).to.equal(getMissingEmailErrorMessage);
          done();
        })["catch"](done);
      });
      it('should throw an error if the provided email is not a string', function (done) {
        Kinvey.User.forgotUsername(1)["catch"](function (error) {
          (0, _chai.expect)(error.message).to.equal(getNotAStringErrorMessage('email'));
          done();
        })["catch"](done);
      });
    });
    describe('resetPassword()', function () {
      it('should start the reset password procedure on the server', function (done) {
        Kinvey.User.resetPassword(username).then(function (result) {
          (0, _chai.expect)(['', null]).to.include(result);
          done();
        })["catch"](done);
      });
      it('should throw an error if a username is not provided', function (done) {
        Kinvey.User.resetPassword()["catch"](function (error) {
          (0, _chai.expect)(error.message).to.equal(getMissingUsernameErrorMessage);
          done();
        })["catch"](done);
      });
      it('should throw an error if the provided username is not a string', function (done) {
        Kinvey.User.resetPassword(1)["catch"](function (error) {
          (0, _chai.expect)(error.message).to.equal(getNotAStringErrorMessage('username'));
          done();
        })["catch"](done);
      });
    });
  });
  describe('restore', function () {
    before(function () {
      Kinvey.User.signup().then(function (user) {
        createdUserIds.push(user.data._id);
      })["catch"](function (err) {
        done(err);
      });
    });
    it('should return error when using the function', function (done) {
      Kinvey.User.restore('nonExistingUser').then(function () {
        Promise.reject(new Error('This should not happen'));
      })["catch"](function (err) {
        (0, _chai.expect)(err.message).to.equal('This function requires a master secret to be provided for your application. We strongly advise not to do this.');
        done();
      });
    });
  });
  describe('signUpWithIdentity', function () {
    before(function () {
      Kinvey.User.signup().then(function (user) {
        createdUserIds.push(user.data._id);
      })["catch"](function (err) {
        done(err);
      });
    });
    it('should return error when using the function', function () {
      return Kinvey.User.signUpWithIdentity('identity').then(function () {
        Promise.reject(new Error('This should not happen'));
      })["catch"](function (err) {
        (0, _chai.expect)(err.message).to.equal('This function has been deprecated. You should use MIC to login instead.');
      });
    });
  });
});