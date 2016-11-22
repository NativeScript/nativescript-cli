## Changelog
## [v3.3.0](https://github.com/Kinvey/kinvey-nodejs/tree/v3.3.0) (2016-11-22)

**Enhancements:**

- Expose all the error objects on the `Kinvey` namespace.

**Bug fixes:**

- Fix name property on `Error` objects.
- Merge `user._socialIdentity` when using an identity to login a user.
- Do not disconnect identities on user logout.
- Support private browser mode for Safari and Firefox.

**Deprecated:**

- `Kinvey.initialize` should be used instead of `Kinvey.init`.

## [v3.2.2](https://github.com/Kinvey/kinvey-nodejs/tree/v3.2.2) (2016-10-25)

**Bug fixes:**

- Import `UserStore` from the correct path.
- Add missing group function to data stores.

## [v3.2.1](https://github.com/Kinvey/kinvey-nodejs/tree/v3.2.1) (2016-10-06)

**Implemented enhancements:**

- Default apiHostname protocol to `https:` if it is not provided.

**Bug fixes:**

- Removed `async`/`await` syntax.
- Prevent delta fetch from loading all entities when they are not needed.

## [v3.2.0](https://github.com/Kinvey/kinvey-nodejs/tree/v3.2.0) (2016-09-27)
[Full Changelog](https://github.com/Kinvey/kinvey-nodejs/compare/3.1.0...3.2.0)<br/>
[SDK Core Changelog](https://github.com/Kinvey/javascript-sdk-core/blob/master/CHANGELOG.md)

**Implemented enhancements:**

- Removed `Popup`, `Device`, and rack implementations.
- Updated `kinvey-javascript-sdk-core` dependency.
