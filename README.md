# Kinvey JavaScript Core SDK

This sdk is a standalone sdk designed for JavaScript-based platforms. The sdk acts as a client for the Kinvey REST API and can be used for building JavaScript-based apps.

## Building
The simplest way to build the sdk is by running `gulp`. This will also perform [testing](#Testing).
More advanced tasks are available.

* `gulp sandbox`: build the sdk without performing any [testing](#Testing).
* `gulp build`: build the sdk without performing a code audit or [testing](#Testing).
* `gulp watch`: auto-build the sdk when you modify a file.
* `gulp clean`: remove temporary files created by the build process.

### Flags
The following flags are available when running `gulp`::

* `--platform=<angular|html5|node|phonegap>`: tailor to a specific platform. Defaults to `html5`.

## Testing
Testing is part of the [build process](#Building). You can run the tests without (re-)building the sdk using `gulp test`.

Depending on the platform, however, a test set-up may be required.

### HTML5
Optional, but recommended: run `grunt client-tests` to spin up instances of Firefox and Google Chrome for automated testing.

### Node.js
The tests will be executed against the current version of Node.js available on the machine. There node version managers, like [`nvm`](https://github.com/creationix/nvm), to easily switch between Node.js versions.

## Releasing
The workflow for releasing a new version of the sdk is as follows:

1. Commit all changes.
2. Increment the [package](package.json) version. See [Version Management](#VersionManagement) below.
3. Update the [Changelog](CHANGELOG.md).
4. Run `gulp release --platform=<platform>` replacing `<platform>` with angular, html5, node, or phonegap. See [Flags](#Flags) above.
5. Update the [DevCenter](https://github.com/Kinvey/devcenter).
6. Optional: update [sample apps](https://github.com/KinveyApps).

### Version Management
Updating the sdk version should follow [Semantic Version 2.0.0](http://semver.org/):

* Major (x.0.0): when making incompatible API changes.
* Minor (3.x.0): when adding functionality in a backwards-compatible manner.
* Patch (3.0.x): when making backwards-compatible bug fixes or enhancements.

## License

    Copyright 2016 Kinvey, Inc.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
