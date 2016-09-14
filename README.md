# Kinvey JavaScript SDK Core [![Build Status](https://travis-ci.org/Kinvey/javascript-sdk-core.svg?branch=develop)](https://travis-ci.org/Kinvey/javascript-sdk-core) [![Test Coverage](https://codeclimate.com/github/Kinvey/javascript-sdk-core/badges/coverage.svg)](https://codeclimate.com/github/Kinvey/javascript-sdk-core/coverage)

The Kinvey JavaScript SDK core is a package that can be used to develop JavaScript applications on the Kinvey platform. The Kinvey JavaScript SDK core is intended used as a way to share common code across different JS SDK builds.

The Kinvey JS SDK core supports several platforms through platform-specific shims. Here is a list of shims we currently support, each as a separate repo -

* [Angular](https://github.com/Kinvey/angular-sdk)
* [Angular 2](https://github.com/Kinvey/angular2-sdk)
* [Backbone](https://github.com/Kinvey/backbone-sdk)
* [HTML5](https://github.com/Kinvey/html5-sdk)
* [Node](https://github.com/Kinvey/kinvey-nodejs)
* [PhoneGap](https://github.com/Kinvey/phonegap-sdk)
* [Titanium](https://github.com/Kinvey/titanium-sdk)

Refer to the Kinvey [DevCenter](http://devcenter.kinvey.com/) for documentation on using Kinvey.

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
5. Run `npm run bundle`.
6. Make sure all changes are committed on the master branch and push.
7. Checkout the develop branch and merge the master branch.
8. Tag the version with git.

### Version Management
Updating the sdk version should follow [Semantic Version 2.0.0](http://semver.org/):

* Major (x.0.0): when making an incompatible API changes.
* Minor (3.x.0): when adding functionality in a backwards-compatible manner.
* Patch (3.0.x): when making backwards-compatible bug fixes or enhancements.

## License
See [LICENSE](LICENSE) for details.

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for details on reporting bugs and making contributions.
