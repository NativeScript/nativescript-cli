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

// Angular.js.
// -----------

// Outside of the Kinvey module, use $q out of scope.
var angularDeferred = angular.injector(['ng']).get('$q');
Kinvey.Defer.use({ deferred: angularDeferred.defer });

// Define the Angular.js Kinvey module.
var module = angular.module('kinvey', []);
