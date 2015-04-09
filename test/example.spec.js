(function() {
  'use strict';

  var chai = require('chai');
  chai.use(require('chai-as-promised'));// Apply chai-as-promised extension.
  chai.use(require('sinon-chai'));//Apply sinon-chai extension.
  var expect = chai.expect;
  var nock = require('nock');
  var Kinvey = require('./../dist/publish/kinvey-nodejs-1.2.1');
  require('./../dist/intermediate/config.js');

  describe('Example', function() {

    it('should work', function() {
      expect(true).to.be.true;
    });

    describe('Network Request', function() {
      //var api = null;
      var user = null;

      before(function() {
        nock.enableNetConnect();
      });

      before(function() {
        var promise = Kinvey.init({
          appKey    : config.test.appKey,
          appSecret : config.test.appSecret
        });
        return promise.then(null, function(error) {
          // Do not fail if the active user was deleted via the console.
          if (Kinvey.Error.INVALID_CREDENTIALS === error.name) {
            Kinvey.setActiveUser(null); // Reset.
            return null;
          }
          return Kinvey.Defer.reject(error);
        });
      });

      afterEach(function() {
        Kinvey.appKey = config.test.appKey;
        Kinvey.appSecret = config.test.appSecret;
      });

      before(function() {
        return Kinvey.User.create({}, { state: false }).then(function(_user) {
          user = _user;
        });
      });

      after(function() {// Delete the user using its credentials.
        Kinvey.setActiveUser(user);
        return Kinvey.User.destroy(user._id, { hard: true }).then(function() {
          Kinvey.setActiveUser(null); // Reset.
        });
      });

      after(function() { // Cleanup.
        user = null;
      });

      before(function() {
        // api = nock(config.kcs.protocol + '://' + config.kcs.host)
        //       .get('/example')
        //       .reply(200, 'Hello World');
      });

      it('should respond with a 200', function(done) {
        Kinvey.DataStore.find('books').then(function(books) {
          expect(books).to.be.instanceof(Array);
          expect(books.length).to.equal(0);
          done();
        }, function(err) {
          console.log(err);
          done(err);
        });
      });
    });
  });
})();
