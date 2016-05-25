# Kinvey JavaScript SDK Core

The Kinvey JavaScript SDK core is a package that can be used to develop JavaScript applications on the Kinvey platform. The Kinvey JavaScript SDK core is intended used as a way to share common code across different Kinvey JavaScript SDK builds.

## Building
The simplest way to build the sdk is by running `gulp`. More advanced tasks are available.

* `gulp bump`: bump the pacakge version
* `gulp build`: build the sdk
* `gulp clean`: remove files created by the build process
* `gulp release`: release a new version of the sdk

### Flags
The following flags are available when running `gulp bump`:

* `--type <major|minor|patch|prerelease>`: Bumps the package version using the [Semantic Version 2.0.0](http://semver.org/) spec. Defaults to `patch`.
* `--version <version>`: Sets the package version to the provided version.

## Testing

You can run the tests using `npm test`.

## Releasing
The workflow for releasing a new version of the sdk is as follows:

1. Commit all changes on the develop branch.
2. Checkout the master branch and merge the develop branch.
4. Update the [Changelog](CHANGELOG.md).
5. Run `gulp bump --type <type>` replacing `<type>` with major, minor, patch, or prerelease. See [Flags](#Flags) above.
6. Make sure all changes are committed on the master branch and push.

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
