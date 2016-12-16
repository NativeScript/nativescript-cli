## Changelog
## [3.3.3](https://github.com/Kinvey/kinvey-nodejs/tree/v3.3.3) (2016-12-16)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.3.2...v3.3.3)<br/>

**Merged pull requests:**
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

## [3.3.2](https://github.com/Kinvey/kinvey-nodejs/tree/v3.3.2) (2016-12-03)

**Bug fixes:**

- Add missing semicolon in aggregation count function.
- Fix how aggregations are process.

**Unit Tests:**

- Add unit tests for aggregations.

## [3.3.1](https://github.com/Kinvey/kinvey-nodejs/tree/v3.3.1) (2016-12-02)

**Bug fixes:**

- Fix aggregations.
- Merge `user._socialIdentity` recuresively when using an identity to login a user.
- Fix typo of `complete` in `NetworkStore`.

## [3.3.0](https://github.com/Kinvey/kinvey-nodejs/tree/v3.3.0) (2016-11-22)

**Enhancements:**

- Expose all the error objects on the `Kinvey` namespace.

**Bug fixes:**

- Fix name property on `Error` objects.
- Merge `user._socialIdentity` when using an identity to login a user.
- Do not disconnect identities on user logout.
- Support private browser mode for Safari and Firefox.

**Deprecated:**

- `Kinvey.initialize` should be used instead of `Kinvey.init`.

## [3.2.2](https://github.com/Kinvey/kinvey-nodejs/tree/v3.2.2) (2016-10-25)

**Bug fixes:**

- Import `UserStore` from the correct path.
- Add missing group function to data stores.

## [3.2.1](https://github.com/Kinvey/kinvey-nodejs/tree/v3.2.1) (2016-10-06)

**Implemented enhancements:**

- Default apiHostname protocol to `https:` if it is not provided.

**Bug fixes:**

- Removed `async`/`await` syntax.
- Prevent delta fetch from loading all entities when they are not needed.

## [3.2.0](https://github.com/Kinvey/kinvey-nodejs/tree/v3.2.0) (2016-09-27)
[Full Changelog](https://github.com/Kinvey/kinvey-nodejs/compare/3.1.0...3.2.0)<br/>

**Implemented enhancements:**

- Removed `Popup`, `Device`, and rack implementations.
- Updated `kinvey-javascript-sdk-core` dependency.
