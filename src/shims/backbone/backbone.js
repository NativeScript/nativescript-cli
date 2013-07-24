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

/* global _: true */

// Backbone.
// ---------

// All Backbone shim functionality will be appended to `Kinvey.Backbone`.

/**
 * @memberof! <global>
 * @namespace Kinvey.Backbone
 */
Kinvey.Backbone = /** @lends Kinvey.Backbone */{
  /**
   * Returns the active user as `Kinvey.Backbone.User` instance.
   *
   * @returns {?Kinvey.Backbone.User} The user model, or `null` if there is no
   *            active user.
   */
  getActiveUser: function() {
    var user = Kinvey.getActiveUser();
    return null !== user ? new Kinvey.Backbone.User(user) : null;
  }
};