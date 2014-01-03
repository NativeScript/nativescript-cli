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
 * Test suite for `Auth`.
 */
describe('Kinvey.Auth', function() {

  // Kinvey.Auth.Default.
  describe('the Default method', function() {

    // Test suite.
    it('should throw when there is no active user.', function() {
      // Fire two non-identical requests.
      var promise = Kinvey.DataStore.find(this.collection);
      return promise.then(function() {
        // We should not reach this code branch.
        expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.have.property('name', Kinvey.Error.NO_ACTIVE_USER);
      });
    });

  });

});