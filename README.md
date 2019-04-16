[![Build Status](https://travis-ci.org/Kinvey/js-sdk.svg?branch=refactor%2FMLIBZ-2587_Improve_SDK)](https://travis-ci.org/Kinvey/js-sdk)

# Overview

[Kinvey](http://www.kinvey.com) (pronounced Kin-vey, like convey) makes it ridiculously easy for developers to setup, use and operate a cloud backend for their mobile apps. They don't have to worry about connecting to various cloud services, setting up servers for their backend, or maintaining and scaling them.

The JS SDK is used as a way to share common code for platform specific SDK shims. Here is a list of the platforms we currently support.

* [Angular](packages/angular-sdk)
* [HTML5](packages/html5-sdk)
* [NativeScript](packages/nativescript-sdk)
* [NativeScript Angular](packages/nativescript-angular-sdk)
* [NodeJS](packages/node-sdk)

## Thanks
Thanks to [BrowserStack](http://browserstack.com) for providing us with a free account.
<p align="left">
  <a href="http://browserstack.com" style="display: inline-block;">
    <img src="logo-browserstack.png">
  </a>
</p>

## License
See [LICENSE](LICENSE) for details.

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for details on reporting bugs and making contributions.

# Development

Fork the repo on GitHub and clone your fork to your local machine. You can then submit PRs to the main repo from your fork for changes that you make.

## Setup

Run `npm install` from the command line at the root of the project.

## Build

Run `npm run build` from the command line at the root of the project.

## Test

The project is setup with unit and integration tests.

### Integration Tests

Run `npm run test` from the command line at the root of the project to run the same tests against each of the SDKs. You can also run the tests against each individual SDK like this:

- HTML5 SDK - `npm run test:html5`
- NativeScript SDK on iOS - `npm run test:nativescript:ios`
- NativeScript SDK on Android - `npm run test:nativescript:android`
- NodeJS SDK - `npm run test:node`
