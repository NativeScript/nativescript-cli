# Changelog

## 1.0.4
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
* Bugfix: Kinvey.User.login arguments were parsed incorrectly.

## 1.0.0-beta (2013-05-17)
* Initial beta release.