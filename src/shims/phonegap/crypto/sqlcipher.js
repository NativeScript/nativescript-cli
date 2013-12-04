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

// Patch `WebSqlAdapter` to use SQLCipher over WebSQL.
var originalOpen = WebSqlAdapter.open;

/**
 * Opens a database.
 *
 * @returns {Database}
 */
WebSqlAdapter.open = function() {
  // Use original if SQLCipher is not available.
  if('undefined' === typeof root.sqlitePlugin) {
    originalOpen.apply(WebSqlAdapter, arguments);
  }

  // Debug.
  if(KINVEY_DEBUG) {
    log('Enabled encrypted data storage.');
  }

  // Validate preconditions.
  if(null == Kinvey.encryptionKey) {
    throw new Kinvey.Error('Kinvey.encryptionKey must not be null.');
  }

  // Open the database.
  return root.sqlitePlugin.openDatabase({
    name : WebSqlAdapter.dbName(),
    key  : Kinvey.encryptionKey
  });
};