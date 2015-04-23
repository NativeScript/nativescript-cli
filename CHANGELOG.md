# Changelog
### 1.3.1 (2015-04-23)
* BugFix(MLIBZ-194): Returns a rejected promise rather then throwing an error when calling a function and expecting a promise to be returned.
* BugFix(MLIBZ-249): Fixed platform specific issues with MIC.

### 1.3.0 (2015-04-10)
* Enhancement(MLIBZ-213): Added support for Mobile Identity Connect
* BugFix(MLIBZ-207): Fixed bug that prevented a user from being logged out on Angular

## 1.2.1 (2015-03-30)
* BugFix(MLIBZ-208): Fixed bug that would throw incorrect `Content-Type` header errors for file requests.
* BugFix(MLIBZ-236): Fixed bug that would throw incorrect `Content-Type` header errors for requests with a 204 response status code.

## 1.2.0 (2015-03-25)
* Enhancement(MLIBZ-162): Added support for custom request properties.
* Enhancement(MLIBZ-188): Added support for client app version.

## 1.1.14 (2015-03-17)
* BugFix(MLIBZ-198): Fixed bug where all Angular requests would fail to due to headers object being null

## 1.1.13 (2015-03-16)
* Improved error messaging for data-driven exceptions

## 1.1.12 (2015-03-04)
* Deprecated: `Kinvey.API_ENDPOINT`
* Enhancement(MLIBZ-45): Replaced `Kinvey.API_ENDPOINT` with `Kinvey.APIHostName`. Set `Kinvey.APIHostName` with options in `Kinvey.init()`.

## 1.1.11 (2015-02-27)
* Enhancement: Using browser native XHR on Titanium mobile web. The response data type on the Titanium.Blob is now Blob, was UInt8Array.
* Bugfix(MLIBZ-53): Resolved memory leak in Titanium library on iOS when making an HTTP request.
* Bugfix(MLIBZ-56): Titanium library architecture error on iOS with TiPlatformConnect's jsOAuth require.
* Bugfix: Fixed bug where Titanium set Content-Type header on iOS GET requests that caused a GCS signature failure.

## 1.1.10 (2015-01-12)
* Enhancement: Added framework flag to Push for Phonegap so we can change how KCS handles the register/unregister methods.

## 1.1.9 (2014-12-05)
* Bugfix: Clone `options` argument when dealing with references to avoid interference.
* Bugfix: References support nested references within arrays

## 1.1.8 (2014-05-14)
* #2859: add `Kinvey.User.loginWithProvider` and `Kinvey.User.signupWithProvider` methods.
* #3223: use `angular.toJson` instead of `JSON.stringify` so properties starting with `$` are excluded.
* Bugfix: `maxAge` on query-level now overrides the document `maxAge`.
* Enhancement: Adjusted offline storage limit to 5MB as calculated by Safari.

## 1.1.7 (2014-03-05)
* #3165: add support for field selection.

## 1.1.6 (2014-02-11)
* Fixed bug where documents created offline did not sync.

## 1.1.5 (2014-01-29)
* #2985: add TTL support to caching & offline saving.
* #3062: offline sorting now supports sorting by nested properties.
* Enhancement: Updated promiscuous dependency.

## 1.1.4 (2014-01-07)
* #2847: remove support for case-insensitive and unanchored regexp.
* #2911: add Angular.js shim.
* Enhancement: Improved PhoneGap encryption methods.
* Enhancement: Updated promiscuous dependency.

## 1.1.3 (2013-12-02)
* #2765: Clear cache and state when user is locked down.
* #2768: Added PhoneGap encryption to credentials and offline storage.
* Bugfix: `force` flag of `Kinvey.User.logout` did not work with `Kinvey.Error.EMAIL_VERIFICATION_REQUIRED`.

## 1.1.2 (2013-10-08)
* #2464: Added PhoneGap Push support.
* Bugfix: `Kinvey.User.signup`, `login`, and `create` did not trigger error callback on `Kinvey.Error.ALREADY_LOGGED_IN` error.

## 1.1.1 (2013-09-20)
* Enhancement: Added Trigger.io device information.
* Enhancement: Locally generated document IDs now are strings of 24 hex characters.
* Bugfix: `Kinvey.Sync.count` would fail in offline mode.
* Bugfix: `options` were not passed when restoring the active user on `Kinvey.init`.
* Bugfix: Upgrading an offline database would cause deadlock in Internet Explorer 10.

## 1.1.0 (2013-08-29)
* #2602: Removed implicit users.
* Enhancement: Added `refresh` flag to `Kinvey.init` to control refreshing the active user data.

## 1.0.5 (2013-08-22)
* Enhancement: `Kinvey.User.login` now throws if given invalid arguments.
* Enhancement: TLS version (if available) is now forced on Titanium iOS.
* Bugfix: Headers were incorrectly set on Titanium iOS with debug mode enabled.
* Bugfix: Improved offline support for Titanium running on older devices.
* Bugfix: Synchronizing multiple documents concurrently resulted in data corruption.
* Bugfix: Upon failure, social login for Titanium would throw a `TypeError`.
* Bugfix: Using files on Titanium Mobile Web failed due to GCS disallowing the X-Titanium-Id header.

## 1.0.4 (2013-07-25)
* Enhancement: Added compatibility with Google Closure Compiler.
* Enhancement: Querying for nearby locations now uses `$nearSphere` (was: `$near`).
* Bugfix: Android < 4 was not supported properly.
* Bugfix: Popup management for social login did not work in Firefox.

## 1.0.3 (2013-07-15)
* #2415: add RequestID to error object.
* #2467: replace IndexedDBShim by WebSQL adapter.
* Enhancement: `Kinvey.getActiveUser` now throws if the active user is not restored yet.
* Bugfix: Saving a user with references was not possible in offline mode.
* Bugfix: Setting the active user did not take concurrency into account.

## 1.0.2 (2013-07-10)
* Bugfix: IndexedDBShim was broken due to "use strict", downgraded version.
* Bugfix: Network requests on Titanium were instantiated incorrectly.

## 1.0.1 (2013-07-03)
* #2461: add PhoneGap shim.
* #2462: active user details not available in offline mode.

## 1.0.0 (2013-07-01)
* #2259: add Titanium shim.
* #2280: add RPC BL endpoints.
* #2414: active user is broken in offline mode.
* #2416: add GCS file support.
* #2437: improve the device information header.
* Enhancement: Added HTML5 shim.
* Enhancement: RequireJS module name is now kinvey (was: Kinvey).
* Bugfix: Error-handling using callbacks was broken because promises trap exceptions.
* Bugfix: `Kinvey.User.login` arguments were parsed incorrectly.

## 1.0.0-beta (2013-05-17)
* Initial beta release.
