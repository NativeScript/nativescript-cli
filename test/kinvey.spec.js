/**
 * Copyright 2014 Kinvey, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* jshint newcap: false */

/**
 * Test suite for `Kinvey`.
 */
describe('Kinvey', function() {

  // Kinvey.
  describe('the namespace', function() {
    it('should be a function.', function() {
      expect(Kinvey).to.be.a('function');
    });

    describe('when invoked', function() {
      // Test suite.
      it('should return a new copy.', function() {
        var copy = Kinvey();
        expect(copy).to.be.a('function');
        expect(copy.appKey).to.be['null'];
        expect(copy.appSecret).to.be['null'];
      });
    });
  });

  // Kinvey.init.
  describe('the init method', function() {
    // Housekeeping: define mock user.
    before(function() {
      this.mock = {
        _id  : this.randomID(),
        _kmd : { authtoken: this.randomID() }
      };
    });
    after(function() {// Cleanup.
      delete this.mock;
    });

    // Housekeeping: clear the active user.
    afterEach(function() {
      Kinvey.setActiveUser(null);

      // Reset APIHostName
      Kinvey.APIHostName = config.kcs.protocol + '://' + config.kcs.host;
    });

    // Test suite.
    it('should throw on invalid arguments: options.', function() {
      expect(Kinvey.init).to.Throw('appKey');
    });
    it('should throw on invalid arguments: options.appKey.', function() {
      expect(function() {
        Kinvey.init({ appSecret: true });
      }).to.Throw('appKey');
    });
    it(
      'should throw on invalid arguments: options.appSecret and/or options.masterSecret.',
      function() {
        expect(function() {
          Kinvey.init({ appKey: true });
        }).to.Throw('Secret');
      }
    );
    it('should save api host name on arguments: options.apiHostName', function() {
      Kinvey.init({
        apiHostName: config.test.apiHostName,
        appKey: config.test.appKey,
        appSecret: config.test.appSecret
      });
      expect(Kinvey.APIHostName).to.equal(config.test.apiHostName);
    });
    it('should save API host name with Kinvey.API_ENDPOINT', function() {
      Kinvey.API_ENDPOINT = config.test.apiHostName;
      Kinvey.init({
        appKey: config.test.appKey,
        appSecret: config.test.appSecret
      });
      expect(Kinvey.APIHostName).to.equal(config.test.apiHostName);
    });
    it('should save API host name with Kinvey.APIHostName', function() {
      Kinvey.APIHostName = config.test.apiHostName;
      Kinvey.init({
        appKey: config.test.appKey,
        appSecret: config.test.appSecret
      });
      expect(Kinvey.APIHostName).to.equal(config.test.apiHostName);
    });
    it('should save the app credentials.', function() {
      Kinvey.init({ appKey: config.test.appKey, appSecret: config.test.appSecret });
      expect(Kinvey.appKey).to.equal(config.test.appKey);
      expect(Kinvey.appSecret).to.equal(config.test.appSecret);
      expect(Kinvey.masterSecret).to.be['null'];
    });
    it('should save the master credentials.', function() {
      Kinvey.init({
        appKey: config.test.appKey,
        appSecret: config.test.appSecret,
        masterSecret: config.test.masterSecret
      });
      expect(Kinvey.appKey).to.equal(config.test.appKey);
      expect(Kinvey.appSecret).to.equal(config.test.appSecret);
      expect(Kinvey.masterSecret).to.equal(config.test.masterSecret);
    });
    it('should restore the active user.', function() {
      Kinvey.setActiveUser(this.user);
      var _this   = this;
      var promise = Kinvey.init({
        appKey: config.test.appKey,
        appSecret: config.test.appSecret
      }).then(function(user) {
        // User should equal the active user, except for `password`.
        expect(user).to.have.property('_id', _this.user._id);
        expect(user).to.have.deep.property('_kmd.authtoken');
        expect(user).to.have.property('username');
        expect(user).not.to.have.property('password');
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should restore the active user, but not refresh it if not `options.refresh`.', function() {
      Kinvey.setActiveUser(this.user);
      var _this   = this;
      var promise = Kinvey.init({
        appKey    : config.test.appKey,
        appSecret : config.test.appSecret,
        refresh   : false
      }).then(function(user) {
        expect(user).to.have.property('_id', _this.user._id);
        expect(user).to.have.deep.property('_kmd.authtoken');
        expect(user).not.to.have.property('username');
        expect(user).not.to.have.property('password');
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should fail if the active user cannot be restored.', function() {
      Kinvey.setActiveUser(this.mock);
      var promise = Kinvey.init({
        appKey: config.test.appKey,
        appSecret: config.test.appSecret
      });
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.have.property('name', Kinvey.Error.INVALID_CREDENTIALS);
      });
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      options.appKey    = config.test.appKey;
      options.appSecret = config.test.appSecret;
      return Kinvey.init(options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      Kinvey.setActiveUser(this.mock);
      options.appKey    = config.test.appKey;
      options.appSecret = config.test.appSecret;
      return Kinvey.init(options);
    }));
  });

  // Kinvey.ping.
  describe('the ping method', function() {
    // Housekeeping: spy on persistence module to inspect authentication.
    beforeEach(function() {
      sinon.spy(Kinvey.Persistence.Net, 'read');
    });
    afterEach(function() {// Restore original.
      Kinvey.Persistence.Net.read.restore();
    });

    // Test suite.
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.ping(options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      Kinvey.appKey = this.randomID();// Force failure.
      return Kinvey.ping(options);
    }));

    describe('when anonymously', function() {
      // Housekeeping: do not use credentials.
      before(function() {
        Kinvey.appKey = Kinvey.appSecret = null;
      });
      after(function() {// Reset.
        Kinvey.appKey    = config.test.appKey;
        Kinvey.appSecret = config.test.appSecret;
      });

      // Test suite.
      it('should ping the service.', function() {
        var promise = Kinvey.ping().then(function(response) {
          expect(response).to.have.property('kinvey', 'hello');// Top-level.
          expect(response).to.have.property('version');

          // Authentication.
          var spy = Kinvey.Persistence.Net.read;
          expect(spy).to.be.called;
          expect(spy.lastCall, 'no auth').to.have.deep.property('args[0].auth');

          var auth = spy.lastCall.args[0].auth();// The auth promise.
          return expect(auth).to.become(null);
        });
        return expect(promise).to.be.fulfilled;
      });
    });

    describe('when using the Master Secret', function() {
      // Housekeeping: use Master Secret.
      before(function() {
        Kinvey.masterSecret = config.test.masterSecret;
      });
      after(function() {// Reset.
        Kinvey.masterSecret = null;
      });

      // Test suite.
      it('should ping the app.', function() {
        var promise = Kinvey.ping().then(function(response) {
          expect(response).to.have.property('kinvey');
          expect(response.kinvey).to.match(/^hello /);// App-level.
          expect(response).to.have.property('version');

          // Authentication.
          var spy = Kinvey.Persistence.Net.read;
          expect(spy).to.be.called;
          expect(spy.lastCall, 'no auth').to.have.deep.property('args[0].auth');

          var auth = spy.lastCall.args[0].auth();// The auth promise.
          return expect(auth).to.eventually.have.property('password', config.test.masterSecret);
        });
        return expect(promise).to.be.fulfilled;
      });
    });

    describe('when using the App Secret', function() {
      // Test suite.
      it('should ping the app.', function() {
        var promise = Kinvey.ping().then(function(response) {
          expect(response).to.have.property('kinvey');
          expect(response.kinvey).to.match(/^hello /);// App-level.
          expect(response).to.have.property('version');

          // Authentication.
          var spy = Kinvey.Persistence.Net.read;
          expect(spy).to.be.called;
          expect(spy.lastCall, 'no auth').to.have.deep.property('args[0].auth');

          var auth = spy.lastCall.args[0].auth();// The auth promise.
          return expect(auth).to.eventually.have.property('password', config.test.appSecret);
        });
        return expect(promise).to.be.fulfilled;
      });
    });

    describe('when using user credentials', function() {
      // Housekeeping: manage the active user.
      before(function() {
        Kinvey.setActiveUser(this.user);
      });
      after(function() {
        Kinvey.setActiveUser(null);
      });

      // Test suite.
      it('should ping the app.', function() {
        var promise = Kinvey.ping().then(function(response) {
          expect(response).to.have.property('kinvey');
          expect(response.kinvey).to.match(/^hello /);// App-level.
          expect(response).to.have.property('version');

          // Authentication.
          var spy = Kinvey.Persistence.Net.read;
          expect(spy).to.be.called;
          expect(spy.lastCall, 'no auth').to.have.deep.property('args[0].auth');

          var auth = spy.lastCall.args[0].auth();// The auth promise.
          return expect(auth).to.eventually.have.property('scheme', 'Kinvey');
        });
        return expect(promise).to.be.fulfilled;
      });
    });

    // Test suite.
    it('should support the response wrapper.', function() {
      Kinvey.appKey = this.randomID(); // Force failure.
      var promise = Kinvey.ping({ trace: true });
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.have.property('requestId');
      });
    });
  });

  // Kinvey.getActiveUser.
  describe('the getActiveUser method.', function() {
    // Housekeeping: manage the active user.
    beforeEach(function() {
      Kinvey.setActiveUser(this.user);
    });
    afterEach(function() {// Reset.
      Kinvey.setActiveUser(null);
    });

    // Test suite.
    it('should return the active user.', function() {
      expect(Kinvey.getActiveUser()).to.deep.equal(this.user);
    });
    it('should return null if there is no active user.', function() {
      Kinvey.setActiveUser(null);
      expect(Kinvey.getActiveUser()).to.be['null'];
    });
  });

  // Kinvey.setActiveUser.
  describe('the setActiveUser method', function() {
    // Housekeeping: manage the active user.
    beforeEach(function() {
      Kinvey.setActiveUser(this.user);
    });
    afterEach(function() {// Reset.
      Kinvey.setActiveUser(null);
    });

    // Test suite.
    it('should throw on invalid arguments: _kmd.authtoken.', function() {
      expect(function() {
        Kinvey.setActiveUser({});
      }).to.Throw('_kmd.authtoken');
    });
    it('should set the active user.', function() {
      var mock = { _id: this.randomID(), _kmd: { authtoken: this.randomID() } };
      Kinvey.setActiveUser(mock);
      expect(Kinvey.getActiveUser()).to.deep.equal(mock);
    });
    it('should reset the active user.', function() {
      Kinvey.setActiveUser(null);
      expect(Kinvey.getActiveUser()).to.be['null'];
    });
    it('should return the previous active user.', function() {
      expect(Kinvey.setActiveUser(null)).to.deep.equal(this.user);
    });
  });

});
