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

// jQuery “promises” are not really promises as they don’t implement the
// [Promises/A+ spec](http://promises-aplus.github.io/promises-spec/). In
// short; jQuery promises are currently (v2.0) completely broken in regard to
// the error handling semantics. For more information, visit one of the links
// below. This adapter merely serves as a security measure so that developers
// don’t attempt to use jQuery promises as internal defer mechanism.

// http://domenic.me/2012/10/14/youre-missing-the-point-of-promises/
// http://bugs.jquery.com/ticket/11010

// Always throw an error when attempting to use jQuery promises.
if('undefined' !== typeof jQuery.Deferred) {
  Kinvey.Defer.use({
    /**
     * @augments {Kinvey.Defer.deferred}
     * @throws {Kinvey.Error} `Kinvey.Defer` is incompatible with jQuery’s
     *           so-called “promises”.
     */
    deferred: function() {
      throw new Kinvey.Error('Kinvey.Defer is incompatible with jQuery’s so-called “promises”.');
    }
  });
}