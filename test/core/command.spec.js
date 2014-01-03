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

/**
 * Test suite for `Kinvey.execute`.
 */
describe('Kinvey.execute', function() {

  // Housekeeping: manage the active user.
  before(function() {
    Kinvey.setActiveUser(this.user);
  });
  after(function() {// Reset.
    Kinvey.setActiveUser(null);
  });

  // The success endpoint.
  describe('the success endpoint', function() {
    // Housekeeping: set the endpoint.
    before(function() {
      this.endpoint = 'success';
    });
    after(function() {// Cleanup.
      delete this.endpoint;
    });

    // Housekeeping: restore the credentials.
    afterEach(function() {
      Kinvey.appKey = config.test.appKey;
    });

    // Test suite.
    it('should succeed.', function() {
      var promise = Kinvey.execute(this.endpoint);
      return expect(promise).to.be.fulfilled;
    });
    it('should succeed, with data.', function() {
      var data    = { field: this.randomID() };
      var promise = Kinvey.execute(this.endpoint, data);
      return expect(promise).to.become(data);
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.execute(this.endpoint, null, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      Kinvey.appKey = this.randomID();// Force failure.
      return Kinvey.execute(this.endpoint, null, options);
    }));
  });

  // The error endpoint.
  describe('the error endpoint', function() {
    // Housekeeping: set the endpoint.
    before(function() {
      this.endpoint = 'error';
    });
    after(function() {// Cleanup.
      delete this.endpoint;
    });

    // Test suite.
    it('should fail.', function() {
      var promise = Kinvey.execute(this.endpoint);
      return expect(promise).to.be.rejected;
    });
    it('should fail, with data.', function() {
      var data    = { field: this.randomID() };
      var promise = Kinvey.execute(this.endpoint, data);
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.deep.equal(data);
      });
    });
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      return Kinvey.execute(this.endpoint, null, options);
    }));
  });

  // The timeout endpoint.
  describe('the timeout endpoint', function() {
    // Housekeeping: set the endpoint.
    before(function() {
      this.endpoint = 'timeout';
    });
    after(function() {// Cleanup.
      delete this.endpoint;
    });

    // Test suite.
    it('should fail.', function() {
      var promise = Kinvey.execute(this.endpoint);
      return expect(promise).to.be.rejected;
    });
    it('should fail, with error.', function() {
      var data    = { field: this.randomID() };
      var promise = Kinvey.execute(this.endpoint, data);
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.have.property('name');
        expect(error).not.to.deep.equal(data);
      });
    });
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      return Kinvey.execute(this.endpoint, null, options);
    }));
  });

});