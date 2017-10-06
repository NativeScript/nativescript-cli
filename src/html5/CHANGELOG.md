# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [3.8.1](https://github.com/Kinvey/html5-sdk/tree/v3.8.1) (2017-08-25)
[Full Changelog](https://github.com/Kinvey/html5-sdk/compare/v3.8.0...v3.8.1)<br/>

### Added
_None_

### Removed
_None_

### Changed/Fixed
- Resolve `Kinvey.initialize()` with an instance of `Kinvey.User` or `null`.

### Merged Pull Requests
- Fix Initialize [#23](https://github.com/Kinvey/html5-sdk/pull/23)

### Closed Issues
_None_

## [3.8.0](https://github.com/Kinvey/html5-sdk/tree/v3.8.0) (2017-08-23)
[Full Changelog](https://github.com/Kinvey/html5-sdk/compare/v3.5.2...v3.8.0)<br/>

### Added
_None_

### Removed
_None_

### Changed/Fixed
- Throw any errors encountered when trying to load a storage adapter.
- Store the active user using local storage.

### Merged Pull Requests
- Fix Storage API [#18](https://github.com/Kinvey/html5-sdk/pull/18)
- Active User Storage [#20](https://github.com/Kinvey/html5-sdk/pull/20)

### Closed Issues
_None_

## [3.5.2](https://github.com/Kinvey/html5-sdk/tree/v3.5.2) (2017-07-08)
[Full Changelog](https://github.com/Kinvey/html5-sdk/compare/v3.5.1...v3.5.2)<br/>

### Added
_None_

### Removed
_None_

### Changed/Fixed
- Added a `try/catch` around `openDatabase()`. This allows any errors thrown when opening a new database connection to WebSQL be caught and used to reject the pending promise.
- Updated [kinvey-js-sdk](https://github.com/Kinvey/js-sdk) dependency to [3.5.2](https://github.com/Kinvey/js-sdk/tree/v3.5.2)

### Merged Pull Requests
_None_

### Closed Issues
_None_

## [3.5.1](https://github.com/Kinvey/html5-sdk/tree/v3.5.1) (2017-06-30)
[Full Changelog](https://github.com/Kinvey/html5-sdk/compare/v3.5.0...v3.5.1)<br/>

### Added
_None_

### Removed
_None_

### Changed/Fixed
- Updated [kinvey-js-sdk](https://github.com/Kinvey/js-sdk) dependency to [3.5.1](https://github.com/Kinvey/js-sdk/tree/v3.5.1)

### Merged Pull Requests
_None_

### Closed Issues
_None_

## [3.5.0](https://github.com/Kinvey/html5-sdk/tree/v3.5.0) (2017-04-20)
[Full Changelog](https://github.com/Kinvey/html5-sdk/compare/v3.4.5...v3.5.0)<br/>

### Added
_None_

### Removed
_None_

### Changed/Fixed
- Registered `Popup` class using new `usePopupClass()` static function on `User` class. Removed config in `webpack.config` used to replace the `Popup` class when a bundle is generated. This makes it easier for other people to utilize the SDK with their own `Webpack` and `Browserify` bundles.
- Return the count of entities removed for storage adapters remove functions.
- Updated [kinvey-js-sdk](https://github.com/Kinvey/js-sdk) dependency to [3.5.0](https://github.com/Kinvey/js-sdk/tree/v3.5.0).

### Merged Pull Requests
- Update Storage Adapters [#15](https://github.com/Kinvey/html5-sdk/pull/15)
- Register Popup Class [#16](https://github.com/Kinvey/html5-sdk/pull/16)

### Closed Issues
_None_

## [v3.4.5](https://github.com/Kinvey/html5-sdk/tree/v3.4.5) (2016-04-13)
[Full Changelog](https://github.com/Kinvey/html5-sdk/compare/v3.4.4...v3.4.5)<br/>

**Changes**
- Update package dependencies.

## [v3.4.4](https://github.com/Kinvey/html5-sdk/tree/v3.4.4) (2016-03-27)
[Full Changelog](https://github.com/Kinvey/html5-sdk/compare/v3.4.3...v3.4.4)<br/>

**Changes**
- Bumping version to keep the same as other Kinvey SDKs.

## [v3.4.3](https://github.com/Kinvey/html5-sdk/tree/v3.4.3) (2016-03-27)
[Full Changelog](https://github.com/Kinvey/html5-sdk/compare/v3.4.2...v3.4.3)<br/>

**Changes**
- Close IndexedDB connection before deleting database. [#14](https://github.com/Kinvey/html5-sdk/pull/14)
- Update package dependencies.

## [v3.4.2](https://github.com/Kinvey/html5-sdk/tree/v3.4.2) (2016-03-16)
[Full Changelog](https://github.com/Kinvey/html5-sdk/compare/v3.4.1...v3.4.2)<br/>

**Changes**
- Update package dependencies.

## [v3.4.1](https://github.com/Kinvey/html5-sdk/tree/v3.4.1) (2016-02-23)
[Full Changelog](https://github.com/Kinvey/html5-sdk/compare/v3.4.0...v3.4.1)<br/>

**Changes**
- Update package `kinvey-node-sdk` with `kinvey-js-sdk`.
- Update `HttpMiddleware` to include logic to send a network request.

## [v3.4.0](https://github.com/Kinvey/html5-sdk/tree/v3.4.0) (2016-02-09)
[Full Changelog](https://github.com/Kinvey/html5-sdk/compare/v3.3.5...v3.4.0)<br/>

**Changes**
- Used rack API to replace `CacheMiddleware` and `HttpMiddleware`. [#12](https://github.com/Kinvey/html5-sdk/pull/12)

**Updated Dependencies:**
- Updated `kinvey-node-sdk` to `v3.4.0`.

## [v3.3.5](https://github.com/Kinvey/html5-sdk/tree/v3.3.5) (2016-01-25)
[Full Changelog](https://github.com/Kinvey/html5-sdk/compare/v3.3.4...v3.3.5)<br/>

**Updated Dependencies:**
- Updated `kinvey-node-sdk` to `v3.3.5`.

## [v3.3.4](https://github.com/Kinvey/html5-sdk/tree/v3.3.4) (2016-01-12)
[Full Changelog](https://github.com/Kinvey/html5-sdk/compare/v3.3.3...v3.3.4)<br/>

**Changes**
- Prevent popup from being shown to allow an application to store 10mb of data with WebSQL when it hasn't stored more then 5mb of data. [#7](https://github.com/Kinvey/html5-sdk/pull/7)
- Increase the size of a WebSQL database as needed. [#8](https://github.com/Kinvey/html5-sdk/pull/8)

**Updated Dependencies:**
- Updated `kinvey-node-sdk` to `v3.3.4`.

## [v3.3.3](https://github.com/Kinvey/html5-sdk/tree/v3.3.3) (2016-12-16)
[Full Changelog](https://github.com/Kinvey/html5-sdk/compare/v3.3.2...v3.3.3)<br/>

**Changes**
- Added support for aggregations against the local cache. [#6](https://github.com/Kinvey/html5-sdk/pull/6)

**Updated Dependencies:**
- Updated `kinvey-node-sdk` to `v3.3.3`.

## [v3.3.2](https://github.com/Kinvey/html5-sdk/tree/v3.3.2) (2016-12-03)

**Updated Dependencies:**
- Update `kinvey-node-sdk` to `v3.3.2`.


## [v3.3.1](https://github.com/Kinvey/html5-sdk/tree/v3.3.1) (2016-12-02)

**Updated Dependencies:**
- Update `kinvey-node-sdk` to `v3.3.1`.

## [v3.3.0](https://github.com/Kinvey/html5-sdk/tree/v3.3.0) (2016-11-22)

**Updated Dependencies:**
- Update `kinvey-node-sdk` to `v3.3.0`.

## [v3.2.2](https://github.com/Kinvey/html5-sdk/tree/v3.2.2) (2016-10-25)

**Implemented enhancements:**
- Set `deviceClass` to `Device` when the SDK is initialized.

## [v3.2.0](https://github.com/Kinvey/html5-sdk/tree/v3.2.0) (2016-09-23)
[Full Changelog](https://github.com/Kinvey/html5-sdk/compare/3.1.1...3.2.0)<br/>
[SDK Core Changelog](https://github.com/Kinvey/javascript-sdk-core/blob/master/CHANGELOG.md)

**Implemented enhancements:**
- Removed `Popup`, `Device`, and rack implementations.

## [v3.2.1](https://github.com/Kinvey/html5-sdk/tree/v3.2.1) (2016-10-07)

**Implemented enhancements:**
- Add cache middleware.
- Add device class.

## [v3.2.0](https://github.com/Kinvey/html5-sdk/tree/v3.2.0) (2016-09-23)
[Full Changelog](https://github.com/Kinvey/html5-sdk/compare/3.1.1...3.2.0)<br/>
[SDK Core Changelog](https://github.com/Kinvey/javascript-sdk-core/blob/master/CHANGELOG.md)

**Implemented enhancements:**
- Removed `Popup`, `Device`, and rack implementations.

## [v3.1.1](https://github.com/Kinvey/html5-sdk/tree/v3.1.1) (2016-09-21)
[Full Changelog](https://github.com/Kinvey/html5-sdk/compare/3.1.0...3.1.1)
[SDK Core Changelog](https://github.com/Kinvey/javascript-sdk-core/blob/master/CHANGELOG.md)

**Implemented enhancements:**

- Added files to integrate [TravisCI](https://travis-ci.org/Kinvey/html5-sdk), [CodeClimate](https://codeclimate.com/github/Kinvey/html5-sdk), and [CodeCov](https://codecov.io/gh/Kinvey/html5-sdk).
