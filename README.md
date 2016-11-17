# Kinvey JS SDK [![Build Status](https://travis-ci.org/Kinvey/javascript-sdk.svg?branch=master)](https://travis-ci.org/Kinvey/javascript-sdk) [![Code Climate](https://codeclimate.com/github/Kinvey/javascript-sdk/badges/gpa.svg)](https://codeclimate.com/github/Kinvey/javascript-sdk) [![codecov](https://codecov.io/gh/Kinvey/js-sdk/branch/master/graph/badge.svg)](https://codecov.io/gh/Kinvey/js-sdk)

[Kinvey](http://www.kinvey.com) (pronounced Kin-vey, like convey) makes it ridiculously easy for developers to setup, use and operate a cloud backend for their mobile apps. They don't have to worry about connecting to various cloud services, setting up servers for their backend, or maintaining and scaling them.

The JS SDK is used as a way to share common code for platform specific SDK shims. Here is a list of the platforms we currently support, each as a separate repo -

* [Angular](https://github.com/Kinvey/angular-sdk)
* [Angular 2](https://github.com/Kinvey/angular2-sdk)
* [Backbone](https://github.com/Kinvey/backbone-sdk)
* [HTML5](https://github.com/Kinvey/html5-sdk)
* [PhoneGap](https://github.com/Kinvey/phonegap-sdk)
* [Titanium](https://github.com/Kinvey/titanium-sdk)

Refer to the Kinvey [DevCenter](http://devcenter.kinvey.com/) for documentation on using Kinvey.

## How to use

#### 1. Sign up for Kinvey
To use the SDK, sign up for Kinvey if you have not already done so. Go to the [sign up](https://console.kinvey.com/#signup) page, and follow the steps provided.

#### 2. Install the SDK
You can install the module using npm:

```bash
npm install kinvey-node-sdk --save
```

#### 3. Configure the SDK
Import the library in your code using `require`.

```javascript
var Kinvey = require('kinvey-node-sdk');
```

Next, use `Kinvey.init` to configure your app. Replace `<appKey>` and `<appSecret>` with your apps app key and secret. You can find these for your app using the [Kinvey Console App](https://console.kinvey.com).

```javascript
Kinvey.init({
  appKey: '<appKey>',
  appSecret: '<appSecret>'
});
```

## What’s next?
You are now ready to start building your awesome apps! Next we recommend diving into the [User guide](http://devcenter.kinvey.com/node/guides/users) or [Data store guide](http://devcenter.kinvey.com/node/guides/datastore) to learn more about our service, or explore the [sample apps](http://devcenter.kinvey.com/node/samples) to go straight to working projects.

## Build
Execute `npm run build` to build the package.

## Release
[TravisCI](https://travis-ci.org/Kinvey/javascript-sdk) will deploy the pacakge to [NPM](https://www.npmjs.com/package/kinvey-javascript-sdk).

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
_Note: Before running any tests you will need to run `npm install` to install any dependencies required._

### Unit Tests
The steps for running the unit tests is as follows:

1. Open a terminal window and execute `npm test`.

## License
See [LICENSE](LICENSE) for details.

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for details on reporting bugs and making contributions.
