# Kinvey JavaScript Library

This library is a standalone library designed for JavaScript-based platforms. The library acts as a client for the Kinvey REST API and can be used for building JavaScript-based apps.

This project is currently in development.

## Configuration
See [package.json](package.json) for the project information. Actual project configuration (test apps, build details) is defined in [config.json](config.json).

## Building
The simplest way to build the library is by running `grunt`. This will also perform [testing](#Testing).

More advanced tasks are available. An imcomplete list:

* `grunt sandbox`: build the library without performing any [testing](#Testing).
* `grunt build`: build the library without performing a code audit or [testing](#Testing).
* `grunt watch`: auto-build the library when you modify a file.
* `grunt clean`: remove temporary files created by the build process.

### Flags
The following flags are available when running `grunt`:

* `--build=<backbone|html5|nodejs|titanium>`: tailor to a specific build. Defaults to `html5`.
* `--env=<development|staging|production>`: tailor to specific environment. Defaults to `staging`.
* `--with-debug`: maintaining debug statements when building the library. Defaults to stripping all debug statements.

For a detailed list of tasks and flags, see the [Gruntfile](Gruntfile.js).

## Testing
Testing is part of the [build process](#Building). You can run the tests without (re-)building the library using `grunt test`.

Depending on the platform, however, a test set-up may be required.

### Backbone.js, HTML5
Optional, but recommended: run `grunt client-tests` to spin up instances of Firefox and Google Chrome for automated testing.

### Node.js
The tests will be executed against the current version of Node.js available on the machine. There are npm modules, like [`n`](https://github.com/visionmedia/n), to easily switch between Node.js versions.

### Titanium
The grunt test task will wait for a test report to be submitted to it. To be able to submit a report, the following preconditions must be satisfied:
  1. Make sure you have the `titanium` npm module installed globally (`npm install -g titanium`).
  2. Create a new Titanium project.
  3. Copy `lib/titanium.app.js` to either `Resources/app.js`, or `app/alloy.js` (if using Titanium Alloy).
  4. Create the following symbolic links in the `Resources/`, or `app/lib` (if using Titanium Alloy) directories: `spec` -> `test/spec`, `vendor` -> `dist/intermediate`.
  5. Create a `Resources/lib`, or `app/lib/lib` (if using Titanium Alloy), and add the following files:
      - `chai.js` (copy from `node_modules/chai/chai.js`)
      - `chai-as-promised.js` (copy from `node_modules/chai-as-promised/lib/chai-as-promised.js`)
      - `mocha.js` (copy from `node_modules/mocha/mocha.js`)
      - `mocha-as-promised.js` (copy from `node_modules/mocha-as-promised/mocha-as-promised.js`)
      - `sinon.js` (copy from `node_modules/sinon/pkg/sinon-1.x.x.js`)
      - `sinon-chai.js` (copy from `node_modules/sinon-chai/lib/sinon-chai.js`)
  6. For **mobileweb**:
      - Run `titanium build --platform mobileweb --project-dir <titanium-project-dir>`
      - Start a web server and point your browser to the build.
  7. For **android**: run `titanium build --platform android --project-dir <titanium-project-dir>`. This will spin-up an emulator, which might take a while.
      - If you want to re-run the tests, add the `--build-only` flag to the command above, and re-upload the apk (see next step).
      - Run: `adb install -r <titanium-project-dir>/build/android/bin/app.apk`
      - Open the app: `adb shell am start -a android.intent.action.MAIN -n com.kinvey.titanium/.TitaniumTestActivity`
  8. For **ios**: TBD
  9. Be patient. A test report will be generated and send to grunt when complete.

## Releasing
The workflow for releasing a new version of the library is as follows:

1. Make sure all your changes are committed.
2. Optional, but recommended: run the [tests](#Testing) against staging.
3. Update the [Changelog](CHANGELOG.md).
4. Increment the [package](package.json) version. See [Version Management](#VersionManagement) below.
5. Run `grunt deploy`. This task will build and test all libraries against production.
6. Upload the generated libraries and documentation in `dist/publish` to S3.
7. Update the [DevCenter](https://github.com/Kinvey/devcenter).
8. Update the [Kinvey npm module](https://github.com/Kinvey/kinvey-nodejs).
9. Optional: update [sample apps](https://github.com/KinveyApps).
10. Tag the version in SVN.

### Version Management
Updating the library version should follow [Semantic Version 2.0.0](http://semver.org/):

* Major (x.0.0): when making incompatible API changes.
* Minor (1.x.0): when adding functionality in a backwards-compatible manner.
* Patch (1.0.x): when making backwards-compatible bug fixes or enhancements.

## License
	Copyright (c) 2013 Kinvey, Inc. All rights reserved.

	Licensed to Kinvey, Inc. under one or more contributor
	license agreements.  See the NOTICE file distributed with
	this work for additional information regarding copyright
	ownership.  Kinvey, Inc. licenses this file to you under the
	Apache License, Version 2.0 (the "License"); you may not
	use this file except in compliance with the License.  You
	may obtain a copy of the License at

	        http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing,
	software distributed under the License is distributed on an
	"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
	KIND, either express or implied.  See the License for the
	specific language governing permissions and limitations
	under the License.