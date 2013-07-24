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

// Keep all data in memory.
var dataStorage = {};

// `Storage` adapter for [Node.js](http://nodejs.org/).
var MemoryStorage = {
  /**
   * @augments {Storage._destroy}
   */
  _destroy: function(key) {
    delete dataStorage[key];
    return Kinvey.Defer.resolve(null);
  },

  /**
   * @augments {Storage._get}
   */
  _get: function(key) {
    return Kinvey.Defer.resolve(dataStorage[key] || null);
  },

  /**
   * @augments {Storage._save}
   */
  _save: function(key, value) {
    dataStorage[key] = value;
    return Kinvey.Defer.resolve(null);
  }
};

// Use memory adapter.
Storage.use(MemoryStorage);