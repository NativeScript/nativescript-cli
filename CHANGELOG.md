## Changelog
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
