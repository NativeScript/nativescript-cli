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

/* global process: true, require: true */
/* exported global, KINVEY_DEBUG, Kinvey */

// External libraries (1).
Titanium.include('lib/sinon.js');// Using `require()` does not work.

// Export variables needed for cross-platform deployment.
var isMobileWeb = 'mobileweb' === Titanium.Platform.getName();
if(!isMobileWeb) {
  var global = this;
  var root   = this;
  root.document  = {};
  root.navigator = {};
  root.window    = this;
  root.document.getElementsByTagName = function() { return { length: 0 }; };
  root.window.location               = root.window.location || {};
}

// Mocha.
require('lib/mocha');
if(!isMobileWeb) {
  var mocha = root.window.mocha;// Export ..
  var Mocha = root.window.Mocha;// .. Mocha.
}
require('lib/mocha-as-promised')(Mocha);// Patch Mocha.

// Setup.
mocha.setup({
  reporter : 'json',
  timeout  : 30000,
  ui       : 'bdd'
});

// Dependencies.
Titanium.include('vendor/dependencies.js');
if('undefined' !== typeof Backbone) {
  require('backbone-associations');
}

// Source files.
var KINVEY_DEBUG = false;
Titanium.include('vendor/config.js');
var Kinvey = require('vendor/kinvey');

// External libraries (2).
var chai = require('lib/chai');
chai.use(require('lib/chai-as-promised'));
chai.use(require('lib/sinon-chai'));

// Spec files.
Titanium.include('spec/spec.js');
Titanium.include('spec/kinvey.spec.js');
Titanium.include('spec/core/acl.spec.js');
Titanium.include('spec/core/auth.spec.js');
Titanium.include('spec/core/aggregation.spec.js');
Titanium.include('spec/core/command.spec.js');
Titanium.include('spec/core/datastore.spec.js');
Titanium.include('spec/core/file.spec.js');
Titanium.include('spec/core/metadata.spec.js');
Titanium.include('spec/core/user.spec.js');
Titanium.include('spec/core/query.spec.js');
Titanium.include('spec/core/reference.spec.js');
Titanium.include('spec/core/persistence.spec.js');
Titanium.include('spec/core/persistence/local.spec.js');
Titanium.include('spec/core/persistence/net.spec.js');
Titanium.include('spec/core/persistence/sync.spec.js');

Titanium.include('spec/internals/defer.spec.js');

Titanium.include('spec/shims/backbone/datastore.spec.js');
Titanium.include('spec/shims/backbone/metadata.spec.js');
Titanium.include('spec/shims/backbone/reference.spec.js');
Titanium.include('spec/shims/backbone/user.spec.js');

// The test reporter.
var failures = [];
var host     = isMobileWeb ? 'localhost' : '10.0.2.2';// Ping Grunt host.
process.stdout.write = function(msg) {
  // Add the error message and stack to each failure.
  var data = JSON.parse(msg);
  data.failures = data.failures.map(function(failure, index) {
    var err = failures[index] ? failures[index].err : { message: '' };
    failure.error = (err.stack || err.message).toString();
    return failure;
  });
  failures = [];// Reset.

  // Ping Grunt.
  var request = Titanium.Network.createHTTPClient({
    onerror: function() {
      Titanium.UI.createAlertDialog({
        title   : 'Could not submit the test report to Grunt.',
        message : 'Are you sure the Grunt process is running?'
      }).show();
    }
  });
  request.open('POST', 'http://' + host + ':9001');
  request.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
  request.send(JSON.stringify(data));
};

// Run.
var runner = mocha.run();
runner.on('fail', function(test) {
  failures.push(test);
});