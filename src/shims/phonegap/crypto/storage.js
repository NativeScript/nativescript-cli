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

// The keychain instance.
var kc = null;
var kcServiceName = '<%= pkg.name %>';

/**
 * @augments {Storage._destroy}
 */
var originalLocalStorageDestroy = localStorageAdapter._destroy;
localStorageAdapter._destroy = function(key) {
  // Use original if Keychain is not available.
  if('undefined' === typeof root.Keychain ||
   'ios' !== root.device.platform.toLowerCase()) {
    return originalLocalStorageDestroy.apply(localStorageAdapter, arguments);
  }

  // Initialize the keychain.
  if(null == kc) {
    kc = new root.Keychain();
  }

  // Remove the item on our turn.
  storagePromise = storagePromise.then(function() {
    var deferred = Kinvey.Defer.deferred();
    kc.removeForKey(deferred.resolve, deferred.reject, key, kcServiceName);
    return deferred.promise;
  });
  return storagePromise;
};

/**
 * @augments {Storage._get}
 */
var localStorageAdapterGet = localStorageAdapter._get;
localStorageAdapter._get = function(key) {
  // Use original if Keychain is not available.
  if('undefined' === typeof root.Keychain ||
   'ios' !== root.device.platform.toLowerCase()) {
    return localStorageAdapterGet.apply(localStorageAdapter, arguments);
  }

  // Initialize the keychain.
  if(null == kc) {
    kc = new root.Keychain();
  }

  // Retrieve the item on our turn.
  storagePromise = storagePromise.then(function() {
    var deferred = Kinvey.Defer.deferred();
    kc.getForKey(function(value) {
      deferred.resolve(value ? JSON.parse(value) : null);
    }, function() {// Plugin fails on `null`-values, workaround here.
      deferred.resolve(null);
    }, key, kcServiceName);
    return deferred.promise;
  });
  return storagePromise;
};

/**
 * @augments {Storage._save}
 */
var localStorageAdapterSave = localStorageAdapter._save;
localStorageAdapter._save = function(key, value) {
  // Use original if Keychain is not available.
  if('undefined' === typeof root.Keychain ||
   'ios' !== root.device.platform.toLowerCase()) {
    return localStorageAdapterSave.apply(localStorageAdapter, arguments);
  }

  // Initialize the keychain.
  if(null == kc) {
    kc = new root.Keychain();
  }

  // Save the item on our turn.
  storagePromise = storagePromise.then(function() {
    // Escape stringified value.
    value = JSON.stringify(value);
    value = value.replace(/[\\]/g, '\\\\')
                 .replace(/[\"]/g, '\\\"')
                 .replace(/[\/]/g, '\\/')
                 .replace(/[\b]/g, '\\b')
                 .replace(/[\f]/g, '\\f')
                 .replace(/[\n]/g, '\\n')
                 .replace(/[\r]/g, '\\r')
                 .replace(/[\t]/g, '\\t');

      var deferred = Kinvey.Defer.deferred();
      kc.setForKey(deferred.resolve, deferred.reject, key, kcServiceName, value);
      return deferred.promise;
    });
    return storagePromise;
};