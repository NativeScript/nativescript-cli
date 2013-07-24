/**
 * Copyright 2013 Kinvey, Inc.
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
 * Test suite for `Auth`.
 */
describe('Kinvey.Auth', function() {

  // Kinvey.Auth.Default.
  describe('the Default method', function() {

    // Housekeeping: spy on user save.
    before(function() {
      sinon.spy(Kinvey.User, 'create');
    });
    beforeEach(function() {// Reset.
      Kinvey.User.create.reset();
    });
    after(function() {// Restore.
      Kinvey.User.create.restore();
    });

    // Housekeeping: manage the active user.
    afterEach(function() {// Delete the created implicit user.
      var user = Kinvey.getActiveUser();
      return Kinvey.User.destroy(user._id, { hard: true });
    });

    // Test suite.
    it('should create only one implicit user on concurrent requests.', function() {
      // Fire two non-identical requests.
      var promise = Kinvey.Defer.all([
        Kinvey.DataStore.find(this.collection),
        Kinvey.DataStore.find(this.collection)
      ]);
      return promise.then(function() {
        expect(Kinvey.User.create).to.be.calledOnce;
      });
    });

  });

});