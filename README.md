# Kinvey NodeJS SDK [![Build Status](https://travis-ci.org/Kinvey/kinvey-nodejs.svg?branch=master)](https://travis-ci.org/Kinvey/kinvey-nodejs) [![Code Climate](https://codeclimate.com/github/Kinvey/kinvey-nodejs/badges/gpa.svg)](https://codeclimate.com/github/Kinvey/kinvey-nodejs) [![codecov](https://codecov.io/gh/Kinvey/kinvey-nodejs/branch/master/graph/badge.svg)](https://codecov.io/gh/Kinvey/kinvey-nodejs)

[Kinvey](http://www.kinvey.com) (pronounced Kin-vey, like convey) makes it ridiculously easy for developers to setup, use and operate a cloud backend for their mobile apps. They don't have to worry about connecting to various cloud services, setting up servers for their backend, or maintaining and scaling them.

This node module makes it very easy to connect your NodeJS app with Kinvey.

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

#### 4. Verify Set Up
You can use the following snippet to verify the app credentials were entered correctly. This function will contact the backend and verify that the SDK can communicate with your app.

```javascript
Kinvey.ping().then(function(response) {
  console.log('Kinvey Ping Success. Kinvey Service is alive, version: ' + response.version + ', response: ' + response.kinvey);
}).catch(function(error) {
  console.log('Kinvey Ping Failed. Response: ' + error.message);
});
```

## What’s next?
You are now ready to start building your awesome apps! Next we recommend diving into the [User guide](http://devcenter.kinvey.com/node-v3.0/guides/users) or [Data store guide](http://devcenter.kinvey.com/node-v3.0/guides/datastore) to learn more about our service, or explore the [sample apps](http://devcenter.kinvey.com/node-v3.0/samples) to go straight to working projects.

## Build
Execute `npm run build` to build the package.

## Release
[TravisCI](https://travis-ci.org/Kinvey/kinvey-nodejs) will deploy the pacakge to [NPM](https://www.npmjs.com/package/kinvey-node-sdk).

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
