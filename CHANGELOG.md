# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [3.12.3](https://github.com/Kinvey/js-sdk/tree/v3.12.3) (2018-11-05)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.12.2...v3.12.3)<br/>

#### Bugs
- MLIBZ-2712: Reconnect to Live Service on NativeScript whenever an application resumes or regains a network connection. [#379](https://github.com/Kinvey/js-sdk/pull/379)

## [3.12.2](https://github.com/Kinvey/js-sdk/tree/v3.12.2) (2018-11-02)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.12.1...v3.12.2)<br/>

#### Enhancements
- Allow `loginWithMIC()` to work properly when viewing a NativeScript application with the NativeScript Preview App. [#377](https://github.com/Kinvey/js-sdk/pull/377)
- Add new notification callback handler for NativeScript push notifications. [#378](https://github.com/Kinvey/js-sdk/pull/378)

- MLIBZ-2712: Reconnect to Live Service on NativeScript whenever an application resumes or regains a network connection. [#376](https://github.com/Kinvey/js-sdk/pull/376)
- MLIBZ-2496: Use default `AuthorizationGrant` if `null` is provded to `loginWithMIC()`. [#372](https://github.com/Kinvey/js-sdk/pull/372)
- MLIBZ-2656 and MLIBZ-2690: Merge `_socialIdentity` properly with response from `/me` endpoint. [#374](https://github.com/Kinvey/js-sdk/pull/374) [#375](https://github.com/Kinvey/js-sdk/pull/375)
- MLIBZ-2497: Return the correct error message if `Files.findById()` is called without a file id. [#373](https://github.com/Kinvey/js-sdk/pull/373)
- MLIBZ-2712: Reconnect to Live Service on NativeScript whenever an application resumes or regains a network connection. [#376](https://github.com/Kinvey/js-sdk/pull/376)

## [3.12.1](https://github.com/Kinvey/js-sdk/tree/v3.12.1) (2018-10-04)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.12.0...v3.12.1)<br/>

#### Bugs
- MLIBZ-2695: Updated `webpack.config.ios.js` and `webpack.config.android.js` to treat any  `tns-core-module` imported by the SDK as an external import to prevent the bundle from including the `tns-core-module` package. [#363](https://github.com/Kinvey/js-sdk/pull/363)
- MLIBZ-2671: Fixed MIC on Microsoft Edge and IE browsers. [#364](https://github.com/Kinvey/js-sdk/pull/364)
- Removed the use of `tns-core-modules/connectivity`. [#365](https://github.com/Kinvey/js-sdk/pull/365)

## [3.12.0](https://github.com/Kinvey/js-sdk/tree/v3.12.0) (2018-10-03)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.11.7...v3.12.0)<br/>

#### Enhancements
- MLIBZ-2366: Update MIC for NativeScript to use `SFSafariViewController` on iOS and `Chrome Custom Tabs` on Android. Register the custom scheme used by the app as the `redirectUri` for MIC in the `AndroidManifest.xml` on Android and the `Info.plist` on iOS.  [#305](https://github.com/Kinvey/js-sdk/pull/360) [#362](https://github.com/Kinvey/js-sdk/pull/362)

#### Bugs
- MLIBZ-2665: Send custom properties to the backend using the `x-kinvey-custom-request-properties` header when creating an entity. [#360](https://github.com/Kinvey/js-sdk/pull/360)
- MLIBZ-2660: Fix TypeScript definitions for `Push.unregister()` on NativeScript to allow the passing of options. Fix the boolean logic in `Push.register()` to allow interactive settings for push notifications to be registered for iOS on NativeScript. [#359](https://github.com/Kinvey/js-sdk/pull/359)
- MLIBZ-2543: Fix encoding issue when downloading files via the NativeScript SDK. [#361](https://github.com/Kinvey/js-sdk/pull/359)

## [3.11.7](https://github.com/Kinvey/js-sdk/tree/v3.11.7) (2018-09-20)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.11.6...v3.11.7)<br/>

#### Enhancements
- MLIBZ-2466: Add new defice info header information. [#343](https://github.com/Kinvey/js-sdk/pull/343)
- MLIBZ-649: Add encryption for NativeScript. [#351](https://github.com/Kinvey/js-sdk/pull/351)

#### Bugs
- MLIBZ-2684: Fix NativeScript TypeScript definitions for Push. [#352](https://github.com/Kinvey/js-sdk/pull/352)
- MLIBZ-2502: Update [rxjs](https://github.com/ReactiveX/rxjs) to 6.x. [#353](https://github.com/Kinvey/js-sdk/pull/353)

## [3.11.6](https://github.com/Kinvey/js-sdk/tree/v3.11.6) (2018-08-02)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.11.5...v3.11.6)<br/>

## [3.11.5](https://github.com/Kinvey/js-sdk/tree/v3.11.5) (2018-07-25)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.11.4...v3.11.5)<br/>

#### Bugs
- MLIBZ-2532: Add `instanceId?: string` to `ClientConfig` TypeScript definition. [#341](https://github.com/Kinvey/js-sdk/pull/341)
- MLIBZ-2630: Return response from backend when calling `datastore.find()`. [#342](https://github.com/Kinvey/js-sdk/pull/342)

#### Enhancements
- MLIBZ-2502: Updated [rxjs](https://github.com/ReactiveX/rxjs) to 6.x. [#340](https://github.com/Kinvey/js-sdk/pull/340)

## [3.11.4](https://github.com/Kinvey/js-sdk/tree/v3.11.4) (2018-07-09)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.11.3...v3.11.4)<br/>

#### Bugs
- MLIBZ-2580: Use correct Authorization header value when sending a request to refresh a MIC access token. [#315](https://github.com/Kinvey/js-sdk/pull/315)
- MLIBZ-2585: Queue network requests while in the middle of refreshing a MIC access token. [#321](https://github.com/Kinvey/js-sdk/pull/321)
- MLIBZ-2586: Use PubNub fork to fix Live Service on Android for NativeScript. [#326](https://github.com/Kinvey/js-sdk/pull/326)

## [3.11.3](https://github.com/Kinvey/js-sdk/tree/v3.11.3) (2018-06-29)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.11.2...v3.11.3)<br/>

#### Enhancements
- MLIBZ-2575: Validate file size before uploading. MLIBZ-2443 and MLIBZ-2444 are related. [#313](https://github.com/Kinvey/js-sdk/pull/313)

#### Bugs
- MLIBZ-2552: Don't try to access undefined. [#312](https://github.com/Kinvey/js-sdk/pull/312)
- MLIBZ-2450: Prevent the active user from being removed when clearing the DataStore cache and local storage is used as the storage adapter. [#311](https://github.com/Kinvey/js-sdk/pull/311)
- MLIBZ-2526: Remove `_kmd.local` property before sending entity to the backend. [#310](https://github.com/Kinvey/js-sdk/pull/310)

## [3.11.2](https://github.com/Kinvey/js-sdk/tree/v3.11.2) (2018-06-15)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.11.1...v3.11.2)<br/>

#### Enhancements
- MLIBZ-2528: Handle MIC OAuth errors in redirect uri responses [#307](https://github.com/Kinvey/js-sdk/pull/307)

#### Tests
- Fixed file tests [#304](https://github.com/Kinvey/js-sdk/pull/304)

## [3.11.1](https://github.com/Kinvey/js-sdk/tree/v3.11.1) (2018-06-01)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.11.0...v3.11.1)<br/>

#### Bugs
- MLIBZ-2303: `User.me()` does not delete empty fields [#299](https://github.com/Kinvey/js-sdk/pull/299)
- MLIBZ-2455: Fix incorrect TypeScript definition for `User.lookup()` [#301](https://github.com/Kinvey/js-sdk/pull/301)
- MLIBZ-2452: NativeScript Android File Uploads throw an Error [#300](https://github.com/Kinvey/js-sdk/pull/300)
- MLIBZ-2323: Don't swallow error when using observable [#302](https://github.com/Kinvey/js-sdk/pull/302)

#### Tests
- Add back execution of integration file tests for NativeScript [#303](https://github.com/Kinvey/js-sdk/pull/303)

## [3.11.0](https://github.com/Kinvey/js-sdk/tree/v3.11.0) (2018-05-23)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.10.3...v3.11.0)<br/>

- QA-196: Add integration tests for files. [#293](https://github.com/Kinvey/js-sdk/pull/293)
- Add push bundle for iOS and Android to files property in `package.json` for the Kinvey NativeScript SDK. [#296](https://github.com/Kinvey/js-sdk/pull/296)
- MLIBZ-2316: Server Side Delta Set [#270](https://github.com/Kinvey/js-sdk/pull/270)
- MLIBZ-2517: Delete mutiple entities properply with Server Side Delta Set [#297](https://github.com/Kinvey/js-sdk/pull/297)
- MLIBZ-2520: Delete entities properly with Auto Pagination [#298](https://github.com/Kinvey/js-sdk/pull/298)

## [3.10.3](https://github.com/Kinvey/js-sdk/tree/v3.10.3) (2018-05-08)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.10.2...v3.10.3)<br/>

- MLIBZ-2422: Add validation that checks if a `redirectUri` provided to `mic.login()` is a string. If the `redirectUri` is not a string then an `Error` will be thrown. [#283](https://github.com/Kinvey/js-sdk/pull/283)
- Conforms the use of the iOS keychain to use the same settings as our [Swift SDK](https://github.com/Kinvey/swift-sdk). [#257](https://github.com/Kinvey/js-sdk/pull/257)
- MLIBZ-2429: Don't include the `Push` module by default in the SDK bundle. [#282](https://github.com/Kinvey/js-sdk/pull/282)
- Update the `Push` module to use the latest version of the [NativeScript Push Plugin](https://github.com/NativeScript/push-plugin). `onMessageReceived()` callback for Android was deprecated and added some new config options for iOS.  [#285](https://github.com/Kinvey/js-sdk/pull/285)
- MLIBZ-2307: Use the correct config options to unregister push on iOS and Android. [#284](https://github.com/Kinvey/js-sdk/pull/284)
- MLIBZ=2446: Add support for `kinveyFileTTL` and `kinveyFileTLS` query parameters for KinveyFile references on a DataStore collection. [#289](https://github.com/Kinvey/js-sdk/pull/289)

```javascript
var dataStore = Kinvey.DataStore.collection('pets');
dataStore.findById('3f583e9f-d064-4a25-a953-6cf0a3dc2ff1', { kinveyFileTTL: 3600, kinveyFileTLS: true })
  .subscribe(function(pet) {
    /*
      {
        "_id": "3f583e9f-d064-4a25-a953-6cf0a3dc2ff1",
        "_acl": {...},
        "dogName": "Bob",
        "furColor": "brown with black spots",
        "pawPrintPicture": {
          "_type": "KinveyFile",
          "_id": "325620e4-93dd-4a26-9f84-8a5e62c0db11",
          "_filename": "bobsPawPrint.png",
          "_acl": { ... },
          "_downloadURL": <Google Cloud Storage download URL>,
          "_expiresAt": "2018-06-18T23:07:23.394Z"
        }
      }
    */
  }, function(error) {
    // ...
  });
```

## [3.10.2](https://github.com/Kinvey/js-sdk/tree/v3.10.2) (2018-03-29)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.10.1...v3.10.2)<br/>

### Enhancements
- MLIBZ-2399: Use the long form Mobile Identity Connect `clientID` in the auth header for KAS endpoints. [#263](https://github.com/Kinvey/js-sdk/pull/263)
- MLIBZ-2131: Remove implicit `push()` calls from datastore. [#276](https://github.com/Kinvey/js-sdk/pull/276)
- MLIBZ-2332: Add support for `instanceId` config option. [#278](https://github.com/Kinvey/js-sdk/pull/278)
- Add default entitlements plist file to NativeScript SDK. [#281](https://github.com/Kinvey/js-sdk/pull/281)

### Bug Fixes
- Check that value is an object before calling `Object.keys` in `Query.isSupportedOffline()`. [#245](https://github.com/Kinvey/js-sdk/pull/245)
- MLIBZ-2133: Use `es6-promise` for promises in live service related files instead of the native promise. [#272](https://github.com/Kinvey/js-sdk/pull/272)
- MLIBZ-2393: Fix NativeScript Files [#280](https://github.com/Kinvey/js-sdk/pull/280)

### Maintenance
- MLIBZ-2410: Expose data access classes from core SDK. [#274](https://github.com/Kinvey/js-sdk/pull/274)
- Refactor IndexedDB and WebSQL persisters. [#277](https://github.com/Kinvey/js-sdk/pull/277)

### Tests
- QA-176: Add integration tests for Mobile Identity Connect [#279](https://github.com/Kinvey/js-sdk/pull/279)


## [3.10.0](https://github.com/Kinvey/js-sdk/tree/v3.10.0) (2018-02-26)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.9.10...v3.10.0)<br/>

### Enhancements
- DataStore Redesign [#251](https://github.com/Kinvey/js-sdk/pull/251)

### Bug Fixes
- MLIBZ-2350: Revert removal of caching db connections in WebSQL. [#241](https://github.com/Kinvey/js-sdk/pull/241)
- Added polyfill for `Number.isNaN()`. [#243](https://github.com/Kinvey/js-sdk/pull/243)
- MLIBZ-2314: Update typescript definitions to allow anonymouse user signup. [#242](https://github.com/Kinvey/js-sdk/pull/242)
- Export `LiveServiceFacade` instead of `LiveService`. [#254](https://github.com/Kinvey/js-sdk/pull/254)

### Tests
- Fix live service unit tests [#255](https://github.com/Kinvey/js-sdk/pull/255)
- Added PhoneGap Android execution in Travis [#253](https://github.com/Kinvey/js-sdk/pull/253)

### Maintenance
- Update the package-lock.json to use the new test runner. [#240](https://github.com/Kinvey/js-sdk/pull/240)

## [3.9.10](https://github.com/Kinvey/js-sdk/tree/v3.9.10) (2018-02-09)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.9.9...v3.9.10)<br/>

### Bug Fixes
- Use correct config property for setting storage providers [#228](https://github.com/Kinvey/js-sdk/pull/228)
- MLIBZ-2159: Add missing `version` property to `RequestOptions` in the TypeScript definition file [#235](https://github.com/Kinvey/js-sdk/pull/235)
- MLIBZ-2159: `_id` field not returned when specifying fields for a query [#233](https://github.com/Kinvey/js-sdk/pull/233)
- MLIBZ-2351: Use `WebView` events to capture redirect on NativeScript [#237](https://github.com/Kinvey/js-sdk/pull/237)

### Maintenance
- Added integration tests in travis.yml [#230](https://github.com/Kinvey/js-sdk/pull/230)

## [3.9.9](https://github.com/Kinvey/js-sdk/tree/v3.9.9) (2018-01-26)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.9.6...v3.9.9)<br/>

### Enhancements
- MLIBZ-2162: Allow multiple independent datastores on a single collection [#220](https://github.com/Kinvey/js-sdk/pull/220)
- MLIBZ-2120: Add support for specifying a storage adapter [#213](https://github.com/Kinvey/js-sdk/pull/220)

### Bug Fixes
- MLIBZ-2313 and MLIBZ-2315: Export the `Client` class. Don't export the `Properties` class twice. [#221](https://github.com/Kinvey/js-sdk/pull/221)
- MLIBZ-2156: Correctly sort fields that have a `null` or `undefined` value. [#205](https://github.com/Kinvey/js-sdk/pull/205)
- MLIBZ-2296: Add polyfill for `Object.prototype.assign()`. [#225](https://github.com/Kinvey/js-sdk/pull/225)

### Maintenance
- MLIBZ-2232: Validate Deploys [#206](https://github.com/Kinvey/js-sdk/pull/206)
- Fix `files` to include correct filenames for kinvey-angular2-sdk package. [Commit](https://github.com/Kinvey/js-sdk/commit/faa741c4a972bb8d7227090d2c537f67159639f0)
- Fix `webpack.config.js` for the kinvey-html5-sdk package. [Commit](https://github.com/Kinvey/js-sdk/commit/9244b655d5a3806fbeb5ccb81cc797c920f21868)
- Use seperate `webpack.config.js` files for building the iOS and Android vesions for the kinvey-nativescript-sdk package. [Commit](https://github.com/Kinvey/js-sdk/commit/03aa385b909f1dd18c9b48be72f5ee812d8c4d9f)

## [3.9.6](https://github.com/Kinvey/js-sdk/tree/v3.9.6) (2018-01-12)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.9.3...v3.9.6)<br/>

### Merge Pull Requests
- MLIBZ-2213: Subscribe for messages sent to user's personal collections channel [#172](https://github.com/Kinvey/js-sdk/pull/172)
- MLIBZ-2157: Add filter for a `$ne` query properly [#201](https://github.com/Kinvey/js-sdk/pull/201)
- MLIBZ-2154: Remove fileds when processing query after sorting data [#202](https://github.com/Kinvey/js-sdk/pull/202)

## [3.9.3](https://github.com/Kinvey/js-sdk/tree/v3.9.3) (2017-12-14)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.9.2...v3.9.3)<br/>

We have moved all the code from our JavaScript SDKs spread across mutiple repositories into this repository. We have adopted the [Mono Repo](https://danluu.com/monorepo/) approach.

### Added
_None_

### Removed
_None_

### Fixed
- Cannot find module `kinvey-nativescript-sdk/push` [#28](https://github.com/Kinvey/nativescript-sdk/issues/28)

### Merge Pull Requests
- MLIBZ-2247: Add `rxjs` as a dependency to use in the TypeScript definitions file [#197](https://github.com/Kinvey/js-sdk/pull/197)
- MLIBZ-2150: Fix setting active user in NativeScript SDK [#196](https://github.com/Kinvey/js-sdk/pull/196)
- Update `webpack.config.js` for each SDK package [#195](https://github.com/Kinvey/js-sdk/pull/195)
- Remove `nativescript-push-notifications` as a dependency of `kinvey-nativescript-sdk` [#194](https://github.com/Kinvey/js-sdk/pull/194)
- Use updated PubNub version that supports NativeScript [#193](https://github.com/Kinvey/js-sdk/pull/193)
- MLIBZ-2234: Export the Kinvey namespace as a module for new bundles created from Mono repo [#185](https://github.com/Kinvey/js-sdk/pull/185)
- MLIBZ-2225: `datastore.findById()` should throw a `NotFoundError` if the id does not exist [#184](https://github.com/Kinvey/js-sdk/pull/184)
- MLIBZ-2129: TypeScript definitions update [#183](https://github.com/Kinvey/js-sdk/pull/183)
- QA-120: Mono Repo [#181](https://github.com/Kinvey/js-sdk/pull/181)
- MLIBZ-2150: Fix return value of ActiveUserStorage.set() for NativeScript [#173](https://github.com/Kinvey/js-sdk/pull/173)
- Mono Repo [#171](https://github.com/Kinvey/js-sdk/pull/171)

## [3.8.1](https://github.com/Kinvey/js-sdk/tree/v3.8.1) (2017-08-25)
[Full Changelog](https://github.com/Kinvey/js-sdk/compare/v3.8.0...v3.8.1)<br/>

### Added
_None_

### Removed
_None_

### Fixed
- Resolve `Kinvey.initialize()` with an instance of `Kinvey.User` or `null`.

### Merged Pull Requests
- Fix Initialize [#148](https://github.com/Kinvey/js-sdk/pull/148)

### Closed Issues
_None_

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
