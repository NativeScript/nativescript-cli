# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [3.8.0](https://github.com/Kinvey/js-sdk/tree/v3.8.0) (2017-08-23)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.5.2...v3.8.0)<br/>

### Added
- Log requests made by the SDK
- Allow a `micId` to be added to the `client_id` value sent for a Mobile Identity Connect request. See [#140](https://github.com/Kinvey/js-sdk/pull/140).
- Replace native node modules with npm packages. This allows us to support platforms that do not run in a Node or Web environment such as NativeScript and React Native.

### Removed/Deprecated
- Deprecated `Kinvey.initialize()`. Please use `Kinvey.init()` instead. If you use `Kinvey.init()` you might not have an active user even though you had already logged in. To fix this, use `Kinvey.initialize()` to move the active user to the correct storage. From then on you will be able to use `Kinvey.init()` and retrieve your active user. `Kinvey.init()` does not return a promise and is synchronous.

```javascript
// Will return the shared client instance
Kinvey.init({
  appKey: '<appKey>',
  appSecret: '<appSecret>'
});
```

### Fixed
- SDK shims can now override the way an active user is stored. This allows the SDK shim to use the preferred storage for that platform.
- Default to removing a user with `hard` equal to `false`.
- SDK shims can now override file uploads.
- Queries will properly be encoding.

### Merged Pull Requests
- NativeScript [#132](https://github.com/Kinvey/js-sdk/pull/132)
- SDK on Windows OS [#137](https://github.com/Kinvey/js-sdk/pull/137)
- Fix Storage API [#139](https://github.com/Kinvey/js-sdk/pull/139)
- Add micId to client_id used for MIC [#140](https://github.com/Kinvey/js-sdk/pull/140)
- Changes to handle active user storage as a sync or async operation [#143](https://github.com/Kinvey/js-sdk/pull/143)
- Fix for URL / query encoding issues [#145](https://github.com/Kinvey/js-sdk/pull/145)

### Closed Issues
_None_

## [3.5.2](https://github.com/Kinvey/js-sdk/tree/v3.5.2) (2017-07-07)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.5.1...v3.5.2)<br/>

### Added
_None_

### Removed
_None_

### Fixed
- Allow special characters `['.', '$', '~', '>', '<', '!', '@']` to be used in an `_id` for an entity.
- Import `es6-promise` to fix errors caused by environments that do not provide a promise implementation natively.
- Fix error inheritance to correctly display error message in `console.log` statements.


### Merged Pull Requests
- Fix URL formation on Windows and URL symbols in custom ID breaking cache storage [#134](https://github.com/Kinvey/js-sdk/pull/134)
- Fix Promise Undefined Bug [#135](https://github.com/Kinvey/js-sdk/pull/135)
- Fix Error Inheritance [#136](https://github.com/Kinvey/js-sdk/pull/136)

### Closed Issues
_None_

## [3.5.1](https://github.com/Kinvey/js-sdk/tree/v3.5.1) (2017-06-30)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.5.0...v3.5.1)<br/>

### Added
_None_

### Removed
_None_

### Fixed
- `https:` will automatically be used when a custom hostname is missing a protocol.
- Prevent the active user from being `null` for a short period of time when setting the active user.

### Merged Pull Requests
- Active User Bug [#128](https://github.com/Kinvey/js-sdk/pull/128)
- Add missing protocol to custom hostnames [#129](https://github.com/Kinvey/js-sdk/pull/129)

### Closed Issues
_None_

## [3.5.0](https://github.com/Kinvey/js-sdk/tree/v3.5.0) (2017-04-20)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.4.5...v3.5.0)<br/>

### Added
- `usePopupClass()` as a static function to the `User` class for registering a popup class to be used for MIC authentication.
- Tests to increase code coverage to 90%.

### Removed
- `init()` static function on `Kinvey` namespace. This was deprecated with [v3.3.3](https://github.com/Kinvey/js-sdk/v3.3.3).
- `baseUrl`, `protocol`, and `host` properties on a `client` instance. These were deprecated with [v3.0.0](https://github.com/Kinvey/js-sdk/v3.0.0).
- `syncCount()` and `purge()` on `CacheStore` and `SyncStore` instances. These were deprecated with [v3.2.0](https://github.com/Kinvey/js-sdk/v3.2.0).

### Fixed
- `restore()` static function from the `User` class to throw an error whenever it is called. This function required an end user to supply their master secret for their application. We strongly advise not to do this in your application.
- All `toJSON()` functions have now been replaced by `toPlainObject()`. The returned result is the exact same.
- `save()`, `create()`, and `update()` on datastore instances no longer accepts an array of entities. This is to help with reporting errors that may occur when saving an entity.
- `remove()` and `removeById()` on datastore instances now returns the count of entities removed and not the actual entity removed.
- Results returned when pushing sync items to the backend contain a new property called `operation`. This property will either be `Kinvey.SyncOperation.Create`, `Kinvey.SyncOperation.Update`, or `Kinvey.SyncOperation.Delete`.

### Merged Pull Requests
- Increase Test Coverage [#122](https://github.com/Kinvey/js-sdk/pull/122)
- Add a function to overwrite Popup class [#124](https://github.com/Kinvey/js-sdk/pull/124)
- Cleanup [#125](https://github.com/Kinvey/js-sdk/pull/125)

### Closed Issues
_None_

## [3.4.5](https://github.com/Kinvey/js-sdk/tree/v3.4.5) (2017-04-13)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.4.4...v3.4.5)<br/>

**Changes**
- Share authentication information for active user with 1.x SDK.
- Use query to push a subset of sync entities to the backend. [#120](https://github.com/Kinvey/js-sdk/pull/120)
- Add more tests for query. [#121](https://github.com/Kinvey/js-sdk/pull/121)
- Allow multiple sync push operations to be in progress at the same time for difference collections.. Only one sync push operation is allowed to be in progress for the same collection. This fixes an issue caused with [#117](https://github.com/Kinvey/js-sdk/pull/117) that only allowed one sync push operation to be in progress regardless of the collection. [#123](https://github.com/Kinvey/js-sdk/pull/123)

## [3.4.4](https://github.com/Kinvey/js-sdk/tree/v3.4.4) (2017-03-27)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.4.3...v3.4.4)<br/>

**Changes**
- Don't perform a sync push operation while one is already in progress. [#117](https://github.com/Kinvey/js-sdk/pull/117)
- Use `tls: true` by default when fetching files. [#118](https://github.com/Kinvey/js-sdk/pull/118)
- Catch a `NotFoundError` thrown when trying to store an active user in the cache. [#119](https://github.com/Kinvey/js-sdk/pull/119)

## [3.4.3](https://github.com/Kinvey/js-sdk/tree/v3.4.3) (2017-03-16)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.4.2...v3.4.3)<br/>

**Changes**
- Clone body of `CacheRequest`. [#112](https://github.com/Kinvey/js-sdk/pull/112)
- Add back `es6-promise`. [#113](https://github.com/Kinvey/js-sdk/pull/113)
- Add method to remove user by id. [#114](https://github.com/Kinvey/js-sdk/pull/114)
- Update package dependencies.

## [3.4.2](https://github.com/Kinvey/js-sdk/tree/v3.4.2) (2017-02-23)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.4.1...v3.4.2)<br/>

**Changes**
- Move mocked classes to the test directory. Fixes a bug that would cause the package to not work when installed from NPM.

## [3.4.1](https://github.com/Kinvey/js-sdk/tree/v3.4.1) (2017-02-23)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.4.0...v3.4.1)<br/>

**Changes**
- Correctly refresh MIC sessions. [#104](https://github.com/Kinvey/js-sdk/pull/104)
- Add missing error objects. [#105](https://github.com/Kinvey/js-sdk/pull/105)
- Fix bug that prevented files from being uploaded to GCS. [#106](https://github.com/Kinvey/js-sdk/pull/106)
- Remove es6-promise dependency. [#107](https://github.com/Kinvey/js-sdk/pull/107)
- Remove core http middleware. [#109](https://github.com/Kinvey/js-sdk/pull/109)
- Add more unit tests for user logout. [#110](https://github.com/Kinvey/js-sdk/pull/110)
- Rename package name and update README. [#111](https://github.com/Kinvey/js-sdk/pull/111)

## [3.4.0](https://github.com/Kinvey/js-sdk/tree/v3.4.0) (2017-02-08)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.3.5...v3.4.0)<br/>

**Changes**
- Refactor source to export all modules, expose Rack API, and to clean up code. [#94](https://github.com/Kinvey/js-sdk/pull/94)
- Remove password hash from stored user object. [#102](https://github.com/Kinvey/js-sdk/pull/102)
- Fix errors with using `Kinvey.ACL` on an entity that does not contain an `_acl` property. [#103](https://github.com/Kinvey/js-sdk/pull/103)

## [3.3.5](https://github.com/Kinvey/js-sdk/tree/v3.3.5) (2017-01-25)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.3.4...v3.3.5)<br/>

**Changes**
- Add `User.lookup()` API to be able to perform [user discovery](http://devcenter.kinvey.com/nodejs/guides/users#lookup). [#96](https://github.com/Kinvey/js-sdk/pull/96)
- Fix a bug that causes any requests sent to the backend after updating a user to respond with a `401` status code. [#101](https://github.com/Kinvey/js-sdk/pull/101)

## [3.3.4](https://github.com/Kinvey/js-sdk/tree/v3.3.4) (2017-01-12)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.3.3...v3.3.4)<br/>

**Changes**
- Improved test coverage. [#92](https://github.com/Kinvey/js-sdk/pull/92)
- Fixed a bug that would produce a `TypeError` for a failed login or any network request that resulted in an `InvalidCredentialsError` [#95](https://github.com/Kinvey/js-sdk/pull/95)

## [3.3.3](https://github.com/Kinvey/js-sdk/tree/v3.3.3) (2016-12-16)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.3.2...v3.3.3)<br/>

**Changes**
- Added `error.kinveyRequestId` as a property to error objects. This property is set to the `X-Kinvey-Request-Id` header value of a Kinvey API response. It is `undefined` by default. [#84](https://github.com/Kinvey/js-sdk/pull/84)
- Added a global get/set default timeout property on the client. The library sets the default timeout to a value of 60 seconds. You can change this value by passing a default timeout when you initialize the SDK. [#85](https://github.com/Kinvey/js-sdk/pull/85)

```
Kinvey.initialize({
  appKey: '<appKey>',
  appSecret: '<appSecret>',
  defaultTimeout: 30000 // 30 seconds in ms
});
```

- Delta fetch requests now works with queries. [#83](https://github.com/Kinvey/js-sdk/pull/83)
- Fixed a check with `instanceof` in Mobile Identity Connect that caused a `TypeError` to be thrown. [#87](https://github.com/Kinvey/js-sdk/pull/87)
- Entities will now be persisted when calling `store.sync` on a data store instance. [#88](https://github.com/Kinvey/js-sdk/pull/88)
- Fixed issues that caused inconsistencies with Error objects. [#89](https://github.com/Kinvey/js-sdk/pull/89)
- Sort, limit, and skip now work correctly when querying the local cache. [#90](https://github.com/Kinvey/js-sdk/pull/90)

## [3.3.2](https://github.com/Kinvey/js-sdk/tree/v3.3.2) (2016-12-03)

**Bug fixes:**

- Add missing semicolon in aggregation count function.
- Fix how aggregations are process.

**Unit Tests:**

- Add unit tests for aggregations.

## [3.3.1](https://github.com/Kinvey/js-sdk/tree/v3.3.1) (2016-12-02)

**Bug fixes:**

- Fix aggregations.
- Merge `user._socialIdentity` recuresively when using an identity to login a user.
- Fix typo of `complete` in `NetworkStore`.

## [3.3.0](https://github.com/Kinvey/js-sdk/tree/v3.3.0) (2016-11-22)

**Enhancements:**

- Expose all the error objects on the `Kinvey` namespace.

**Bug fixes:**

- Fix name property on `Error` objects.
- Merge `user._socialIdentity` when using an identity to login a user.
- Do not disconnect identities on user logout.
- Support private browser mode for Safari and Firefox.

**Deprecated:**

- `Kinvey.initialize` should be used instead of `Kinvey.init`.

## [3.2.2](https://github.com/Kinvey/js-sdk/tree/v3.2.2) (2016-10-25)

**Bug fixes:**

- Import `UserStore` from the correct path.
- Add missing group function to data stores.

## [3.2.1](https://github.com/Kinvey/js-sdk/tree/v3.2.1) (2016-10-06)

**Implemented enhancements:**

- Default apiHostname protocol to `https:` if it is not provided.

**Bug fixes:**

- Removed `async`/`await` syntax.
- Prevent delta fetch from loading all entities when they are not needed.

## [3.2.0](https://github.com/Kinvey/js-sdk/tree/tree/v3.2.0) (2016-09-27)
[Full Changelog](https://github.com/Kinvey/kinvey-nodejs/compare/3.1.0...3.2.0)<br/>

**Implemented enhancements:**

- Removed `Popup`, `Device`, and rack implementations.
- Updated `kinvey-javascript-sdk-core` dependency.
