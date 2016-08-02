## Changelog
### 3.0.1 (2016-07-29)
* Bugfix (MLIBZ-1051): Fix social login.
* Enhancement (MLIBZ-764): Add support for encryption.

### 3.0.0-beta.30 (2016-07-15)
* Bugfix (MLIBZ-1228): Store results from a pull in the cache.
* Bugfix (MLIBZ-1230): Return server generated `_id` when creating entities.
* Enhancement (MLIBZ-1026): Make file uploads resumable.

### 3.0.0-beta.29 (2016-06-13)
* Bugfix (MLIBZ-1151): Prevent error from always being thrown when using `store.find(query)` on a `CacheStore`.
* Bugfix (MLIBZ-1154): Fix error with `window.openDatabase` not working on user logout.
* Bugfix (MLIBZ-1030): Don't send back an empty array on a successful sync.
* Enhancement (MLIBZ-1155): Use `es6-promise` to polyfill browsers that don't contain native promise support.
* Enhancement (MLIBZ-1159): Refactore `DataStore`

### 3.0.0-beta.28 (2016-06-13)
* Bugfix: Don't use `indexeddbshim` as not all browsers support WebSQL (e.g., Firefox)

### 3.0.0-beta.27 (2016-06-13)
* Bugfix: Add `try/catch` block to MIC to catch errors when trying to access popup urls that are cross domain.

### 3.0.0-beta.26 (2016-06-13)
* Bugfix (MLIBZ-1133): Listen to `loadstart` event on popups to capture redirect when using MIC login for url that results in a 404.
* Bugfix (MLIBZ-1148): Provide a way to change the MIC hostname.
* Bugfix (MLIBZ-1075): Fix issues when downloading files.
* Bugfix (MLIBZ-1146): Make `resetPassword()` on the `User` class a static function.

### 3.0.0-beta.25 (2016-06-06)
* Bugfix (MLIBZ-1100): Improve error message when a sync failure occurs.
* Bugfix (MLIBZ-1082): Check that a query is able to be run loccaly before it is processed.
* Bugfix (MLIBZ-1114): Do not remove entity data when a sync failure occurs.
* Bugfix (MLIBZ-1117): Add `isEmailVerified()` to the `User` class.

### 3.0.0-beta.24 (2016-05-24)
* Bugfix: Fixed query syntax bug for filtering data.
* Bugfix (MLIBZ-897): Added more information to MIC error to help debug.
* Enhancement (MLBIZ-1076): Added the ability to set a global app version.

### 3.0.0-beta.21 (2016-05-20)
* Bugfix: Change main file in package.json to ./es5/kinvey.js.

### 3.0.0-beta.20 (2016-05-20)
* Bugfix (MLIBZ-1052): RAPID is not compatible with DeltaFetch. Turn delta fetch off by default.
* Bugfix (MLBIZ-1075): Fix issues related to the FileStore.
* Bugfix: Fixed race condition when saving an array of entities to the cache.
* Enhancement (MLIBZ-1066): Clear the database after user logout.
* Enhancement: Replace promise pattern with observable patter when fetching data using a data store.
* Enhancement: Reduce data store types to only two types: `DataStoreType.Network` and `DataStoreType.Sync`
* Enhancement: Provide a way to make a data store go online or offline.
* Enhancement: Provide a way to enable or disable the cache for a data store.

### 3.0.0-beta.18 (2016-04-22)
* Enhancement: Add device and popup plugins to core.
* Enhancement: Use ES7 async logic.

### 3.0.0-beta.17 (2016-04-20)
* Bugfix: Fixed bug when notifying sync to add an item that should be synce at a later time.

### 3.0.0-beta.16 (2016-04-19)
* Bugfix: Fixed missing url when opening popup for MIC login.

### 3.0.0-beta.15 (2016-04-19)
* Bugfix (MLIBZ-1029): Fixed a bug in the NetworkStore that would send remove calls as a GET request.
* Bugfix (MLIBZ-1030): Fixed the pull response for a data store to not be undefined.

#### 3.0.0-beta.13 (2016-04-04)
* Enhancement: Optimize delta fetch when no documents exist in cache.
* Bugfix: Fixed typos that caused crashes.

#### 3.0.0-beta.12 (2016-03-29)
* Enhancement: Refactored Popup and Device class to allow adapters.
* Enhancement: Removed platform specific code.

#### 3.0.0-beta.11 (2016-03-25)
* Bugfix: Replaced `global.Titanium` references with `Titanium`.

#### 3.0.0-beta.9 (2016-03-25)
* Bugfix (MLIBZ-946): Automically refresh an expired auth token if possible.
