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

// `Storage` adapter for the [iOS Keychain Plugin](https://github.com/shazron/KeychainPlugin).
if('undefined' !== typeof root.Keychain) {
  // The keychain instance.
  var kc = new root.Keychain();
  var kcServiceName = '<%= pkg.name %>';

  // Use the keychain adapter.
  Storage.use({
    /**
     * @augments {Storage._destroy}
     */
    _destroy: function(key) {
      // Remove the item on our turn.
      storagePromise = storagePromise.then(function() {
        var deferred = Kinvey.Defer();
        kc.removeForKey(deferred.resolve, deferred.reject, key, kcServiceName);
        return deferred.promise;
      });
      return storagePromise;
    },

    /**
     * @augments {Storage._get}
     */
    _get: function(key) {
      // Retrieve the item on our turn.
      storagePromise = storagePromise.then(function() {
        var deferred = Kinvey.Defer();
        kc.getForKey(function(value) {
          deferred.resolve(value ? JSON.parse(value) : null);
        }, deferred.reject, key, kcServiceName);
        return deferred.promise;
      });
      return storagePromise;
    },

    /**
     * @augments {Storage._save}
     */
    _save: function(key, value) {
      // Save the item on our turn.
      storagePromise = storagePromise.then(function() {
        var deferred = Kinvey.Defer();
        kc.setForKey(deferred.resolve, deferred.reject, key, kcServiceName, JSON.stringify(value));
        return deferred.promise;
      });
      return storagePromise;
    }
  });
}