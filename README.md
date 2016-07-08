# Kinvey JavaScript SDK Core

The Kinvey JavaScript SDK core is a package that can be used to develop JavaScript applications on the Kinvey platform. The Kinvey JavaScript SDK core is intended used as a way to share common code across different Kinvey JavaScript SDK builds.

## Building
The simplest way to build the sdk is by running `gulp`. More advanced tasks are available.

* `gulp bump`: bump the pacakge version
* `gulp build`: build the sdk
* `gulp clean`: remove files created by the build process
* `gulp lint`: lint src files

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
3. Update the [Changelog](CHANGELOG.md).
4. Run `gulp bump --type <type>` replacing `<type>` with major, minor, patch, or prerelease. See [Flags](#Flags) above.
5. Make sure all changes are committed on the master branch and push.
6. Checkout the develop branch and merge the master branch.

### Version Management
Updating the sdk version should follow [Semantic Version 2.0.0](http://semver.org/):

* Major (x.0.0): when making an incompatible API changes.
* Minor (3.x.0): when adding functionality in a backwards-compatible manner.
* Patch (3.0.x): when making backwards-compatible bug fixes or enhancements.

## License

Copyright (c) 2016, Kinvey, Inc. All rights reserved.

This software is licensed to you under the Kinvey terms of service located at
http://www.kinvey.com/terms-of-use. By downloading, accessing and/or using this
software, you hereby accept such terms of service  (and any agreement referenced
therein) and agree that you have read, understand and agree to be bound by such
terms of service and are of legal age to agree to such terms with Kinvey.
This software contains valuable confidential and proprietary information of
KINVEY, INC and is subject to applicable licensing agreements.

Unauthorized reproduction, transmission or distribution of this file and its
contents is a violation of applicable laws.
