# Kinvey JavaScript SDK Core [![Build Status](https://travis-ci.org/Kinvey/javascript-sdk-core.svg?branch=master)](https://travis-ci.org/Kinvey/javascript-sdk-core) [![Code Climate](https://codeclimate.com/github/Kinvey/javascript-sdk-core/badges/gpa.svg)](https://codeclimate.com/github/Kinvey/javascript-sdk-core) [![codecov](https://codecov.io/gh/Kinvey/javascript-sdk-core/branch/master/graph/badge.svg)](https://codecov.io/gh/Kinvey/javascript-sdk-core)

The Kinvey JavaScript SDK Core is a package that can be used to develop JavaScript applications on the Kinvey platform. The Kinvey JavaScript SDK Core is intended to be used as a way to share common code across different JavaScript SDK shims.

The Kinvey JavaScript SDK Core supports several platforms through platform-specific shims. Here is a list of shims we currently support, each as a separate repo -

* [Angular](https://github.com/Kinvey/angular-sdk)
* [Angular 2](https://github.com/Kinvey/angular2-sdk)
* [Backbone](https://github.com/Kinvey/backbone-sdk)
* [HTML5](https://github.com/Kinvey/html5-sdk)
* [Node](https://github.com/Kinvey/kinvey-nodejs)
* [PhoneGap](https://github.com/Kinvey/phonegap-sdk)
* [Titanium](https://github.com/Kinvey/titanium-sdk)

Refer to the Kinvey [DevCenter](http://devcenter.kinvey.com/) for documentation on using Kinvey.

## Build
Execute `npm run build` to build the package.

## Release
[TravisCI](https://travis-ci.org/Kinvey/javascript-sdk-core) will deploy the pacakge to [NPM](https://www.npmjs.com/package/kinvey-javascript-sdk-core).

1. Checkout the master branch.
2. Update the CHANGELOG.md.
3. Execute `npm version [<newversion> | major | minor | patch | premajor | preminor | prepatch | prerelease | from-git]`. See [Version Management](#version-management) for more info on incrementing the version.
4. Done.

### Version Management
Updating the package version should follow [Semantic Version 2.0.0](http://semver.org/):

* Major (x.0.0): when making an incompatible API changes.
* Minor (3.x.0): when adding functionality in a backwards-compatible manner.
* Patch (3.0.x): when making backwards-compatible bug fixes or enhancements.

## Test
Execute `npm test` to run the unit tests for the package.

## License
See [LICENSE](LICENSE) for details.

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for details on reporting bugs and making contributions.
