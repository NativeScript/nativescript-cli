## [6.7.8](https://github.com/NativeScript/nativescript-cli/compare/v6.7.7...v6.7.8) (2020-06-27)


### Bug Fixes

* **react:** tns options ([1ad7bda](https://github.com/NativeScript/nativescript-cli/commit/1ad7bdad9cf1de588293288d18aa6b88c4f6ef94))



## [6.7.7](https://github.com/NativeScript/nativescript-cli/compare/v6.7.6...v6.7.7) (2020-06-27)


### Features

* **react:** official quick create for --react app ([#5336](https://github.com/NativeScript/nativescript-cli/issues/5336)) ([5d3f3a4](https://github.com/NativeScript/nativescript-cli/commit/5d3f3a4336e6aeb6b2fc78b19ace1c9eea51ae20))



## [6.7.5](https://github.com/NativeScript/nativescript-cli/compare/v6.7.4...v6.7.5) (2020-06-25)


### Features

* **android:** doctor support for android 30 ([#5332](https://github.com/NativeScript/nativescript-cli/issues/5332)) ([c5930e4](https://github.com/NativeScript/nativescript-cli/commit/c5930e41562d49d004edc28a88c6d192c59288c9))



## [6.7.4](https://github.com/NativeScript/nativescript-cli/compare/v6.7.0...v6.7.4) (2020-05-30)


### Bug Fixes

* **chrome:** new debug url with chrome ([#5319](https://github.com/NativeScript/nativescript-cli/issues/5319)) ([788ac88](https://github.com/NativeScript/nativescript-cli/commit/788ac8895981eb8a60d117effa73e4dd8e115a16))
* **node:** full node 14 support ([4c005ca](https://github.com/NativeScript/nativescript-cli/commit/4c005caf2731d1ba489aa6a854bca3d3d5d7e154))



# [6.7.0](https://github.com/NativeScript/nativescript-cli/compare/v6.5.1...v6.7.0) (2020-05-30)


### Features

* **android:** allow modifying gradlew args in hooks ([#5301](https://github.com/NativeScript/nativescript-cli/issues/5301)) ([6684a3e](https://github.com/NativeScript/nativescript-cli/commit/6684a3e80d56cf6bb89a0250b5c28ae790e860f4))
* **node:** version 14 support ([#5316](https://github.com/NativeScript/nativescript-cli/issues/5316)) ([5414b77](https://github.com/NativeScript/nativescript-cli/commit/5414b77b7981bbf109d521a2c9ae7573fe69ab12))



NativeScript CLI Changelog
================

6.4.1 (2020, February 21)
===

### New

* [Implemented #5255](https://github.com/NativeScript/nativescript-cli/issues/5255): Warn if the CLI might print sensitive data to the output

### Fixed

* [Fixed #5236](https://github.com/NativeScript/nativescript-cli/issues/5236): File paths from device logs are not clickable
* [Fixed #5251](https://github.com/NativeScript/nativescript-cli/issues/5251): External files are not livesynced
* [Fixed #5252](https://github.com/NativeScript/nativescript-cli/issues/5252): Logs from platform specific files point to incorrect file
* [Fixed #5259](https://github.com/NativeScript/nativescript-cli/issues/5259): Unable to use pnpm on macOS and Linux
* [Fixed #5260](https://github.com/NativeScript/nativescript-cli/issues/5260): `tns package-manager set invalid_value` does not say pnpm is supported
* [Fixed #5261](https://github.com/NativeScript/nativescript-cli/issues/5261): `tns package-manager set <valid value>` does not give any output
* [Fixed #5262](https://github.com/NativeScript/nativescript-cli/issues/5262): `tns package-manager` fails with error
* [Fixed #5263](https://github.com/NativeScript/nativescript-cli/issues/5263): `tns package-manager` docs does not list pnpm as supported value
* [Fixed #5264](https://github.com/NativeScript/nativescript-cli/issues/5264): `tns package-manager --help` fails with error


6.4.0 (2020, February 11)
===

### New

* [Implemented #4654](https://github.com/NativeScript/nativescript-cli/issues/4654): Add support for pkg manager `pnpm`
* [Implemented #5214](https://github.com/NativeScript/nativescript-cli/issues/5214): Same dependencies installed multiple times in `node_modules` cause build failure
* [Implemented #5218](https://github.com/NativeScript/nativescript-cli/issues/5218): Allow configuring path/name to webpack.config.js
* [Implemented #5220](https://github.com/NativeScript/nativescript-cli/issues/5220): Native metadata filtering for iOS and Android
* [Implemented #5230](https://github.com/NativeScript/nativescript-cli/issues/5230): Obsolete support for Xcode 10
* [Implemented #5233](https://github.com/NativeScript/nativescript-cli/issues/5233): Support command level hooks

### Fixed

* [Fixed #5187](https://github.com/NativeScript/nativescript-cli/issues/5187): Inaccessible native source code without modulemap
* [Fixed #5239](https://github.com/NativeScript/nativescript-cli/issues/5239): Temporary files created by CLI are not deleted in some cases
* [Fixed #5242](https://github.com/NativeScript/nativescript-cli/issues/5242): Java 13 is not supported, but doctor does not detect it


6.3.3 (2020, January 13)
===

### New

* [Implemented #5205](https://github.com/NativeScript/nativescript-cli/issues/5205): Support build hooks
* [Implemented #5210](https://github.com/NativeScript/nativescript-cli/issues/5210): Support environment check hooks

### Fixed

* [Fixed #3818](https://github.com/NativeScript/nativescript-cli/issues/3818): Cannot set property 'socket' of null
* [Fixed #5072](https://github.com/NativeScript/nativescript-cli/issues/5072):`tns update next` doesn't work with CLI 6+


6.3.2 (2020, January 9)
===

### Fixed

* [Fixed #5200](https://github.com/NativeScript/nativescript-cli/issues/5200): api29 emulator is not recognized as latest


6.3.1 (2020, January 7)
===

### Fixed

* [Fixed #5192](https://github.com/NativeScript/nativescript-cli/issues/5192): `tns info` command does not work with @nativescript/core


6.3.0 (2019, December 17)
===

### New

* [Implemented #5128](https://github.com/NativeScript/nativescript-cli/issues/5128): Support for node v13
* [Implemented #5155](https://github.com/NativeScript/nativescript-cli/issues/5155): Improve transition from tns preview to tns run
* [Implemented #5180](https://github.com/NativeScript/nativescript-cli/issues/5180): Cache the result of environment checks

### Fixed

* [Fixed #4982](https://github.com/NativeScript/nativescript-cli/issues/4982): `tns deploy` does not verify if the project should be migrated
* [Fixed #5069](https://github.com/NativeScript/nativescript-cli/issues/5069): Android API 29 emulator error
* [Fixed #5113](https://github.com/NativeScript/nativescript-cli/issues/5113): tns test init page does not list frameworks properly.
* [Fixed #5115](https://github.com/NativeScript/nativescript-cli/issues/5115): tns update command doesn't work in some plugins' demo apps
* [Fixed #5149](https://github.com/NativeScript/nativescript-cli/issues/5149): `tns update` should handle scoped packages
* [Fixed #5159](https://github.com/NativeScript/nativescript-cli/issues/5159): applyPluginsCocoaPods fails on case sensitive volumes
* [Fixed #5173](https://github.com/NativeScript/nativescript-cli/issues/5173): `--justlaunch` flag enables HMR

6.2.2 (2019, November 22)
==

### Fixed
* [Fixed #5126](https://github.com/NativeScript/nativescript-cli/issues/5126): CLI does not generate all icons

6.2.1 (2019, November 18)
==

### Fixed
* [Fixed #5120](https://github.com/NativeScript/nativescript-cli/issues/5120): Android resource directories are not prepared correctly
* [Fixed #5105](https://github.com/NativeScript/nativescript-cli/issues/5105): App restarts when changing platform specific scss

6.2.0 (2019, November 1)
==

### New
* [Implemented #5038](https://github.com/NativeScript/nativescript-cli/issues/5038): Deprecate support for markingMode:full
* [Implemented #5049](https://github.com/NativeScript/nativescript-cli/issues/5049): Android App Bundle Improvements
* [Implemented #5060](https://github.com/NativeScript/nativescript-cli/issues/5060): Kotlin usage tracking in android builds
* [Implemented #5096](https://github.com/NativeScript/nativescript-cli/issues/5096): Reduce the npm requests when checking if the project should be migrated
* [Implemented #5104](https://github.com/NativeScript/nativescript-cli/pull/5104): Allow tag and range versions in the preview app plugin versions validation
* [Implemented #5107](https://github.com/NativeScript/nativescript-cli/issues/5107): Support V8 Snapshots on Windows

### Fixed
* [Fixed #3785](https://github.com/NativeScript/nativescript-cli/issues/3785): NativeScript CLI doesn't pause on webpack compilation errors
* [Fixed #4681](https://github.com/NativeScript/nativescript-cli/issues/4681): `tns update ios` is not working
* [Fixed #4963](https://github.com/NativeScript/nativescript-cli/issues/4963): Difference in hookArgs.prepareData.platform on prepare and run command
* [Fixed #4995](https://github.com/NativeScript/nativescript-cli/issues/4995): Building plugin and running demo app fails if plugins has a surrounding gradle build
* [Fixed #5005](https://github.com/NativeScript/nativescript-cli/issues/5005): Apple Watch extension with space in the name of `.entitlements` file is not working
* [Fixed #5020](https://github.com/NativeScript/nativescript-cli/issues/5020): Stuck at "Restarting application on device" on Windows 10, iPad mini 2, compiled with NativeScript Sidekick cloud service.
* [Fixed #5030](https://github.com/NativeScript/nativescript-cli/issues/5030): The `tns devices` command lists appletv as iOS platform
* [Fixed #5034](https://github.com/NativeScript/nativescript-cli/issues/5034): Broken build when passing --i-cloud-container-environment
* [Fixed #5056](https://github.com/NativeScript/nativescript-cli/issues/5056): Unable to process native iOS files and frameworks from scoped packages
* [Fixed #5061](https://github.com/NativeScript/nativescript-cli/issues/5061): Unable to resolve cocoapods version conflicts
* [Fixed #5063](https://github.com/NativeScript/nativescript-cli/issues/5063): Splash Screen asset generation fails for iOS
* [Fixed #5070](https://github.com/NativeScript/nativescript-cli/issues/5070): The `tns test` command cannot work if the source code is not in `src` or `app` folder
* [Fixed #5077](https://github.com/NativeScript/nativescript-cli/pull/5077): Pass allowProvisioningUpdates to xcodebuild only when building for device
* [Fixed #5094](https://github.com/NativeScript/nativescript-cli/issues/5094): Add Theme v2 name to non-extenal modules when starting webpack

6.1.2 (2019, September 18)
==

### Fixed
* [Fixed #5018](https://github.com/NativeScript/nativescript-cli/issues/5018): Track runtime versions on add and on build, run, deploy


6.1.1 (2019, September 17)
==

### Fixed

* [Fixed #5015](https://github.com/NativeScript/nativescript-cli/pull/5015): CLI passes `--preserve-symlinks` to the webpack itself, not to the Node.js
* [Fixed #4893](https://github.com/NativeScript/nativescript-cli/issues/4893): `tns preview` crashes when scanning on devices with different platforms
* [Fixed #4939](https://github.com/NativeScript/nativescript-cli/issues/4939): Xcode 11 warning: `CFBundleIdentifier value must be the same as PRODUCT_BUNDLE_IDENTIFIER`

6.1.0 (2019, September 04)
==

### New

* [Implemented #4229](https://github.com/NativeScript/nativescript-cli/issues/4229): Do not display command usage help after execution is started
* [Implemented #4909](https://github.com/NativeScript/nativescript-cli/issues/4909): Support for Xcode 11 and iOS 13
* [Implemented #4926](https://github.com/NativeScript/nativescript-cli/issues/4926): Android SDK 29 support
* [Implemented #4947](https://github.com/NativeScript/nativescript-cli/issues/4947): Add tracking for both React NativeScript and Svelte Native projects
* [Implemented #4966](https://github.com/NativeScript/nativescript-cli/issues/4966): Support LiveSync to iOS Wi-Fi devices
* [Implemented #4974](https://github.com/NativeScript/nativescript-cli/issues/4974): Ask the users why they've uninstalled NativeScript CLI
* [Implemented #4976](https://github.com/NativeScript/nativescript-cli/issues/4976): Handle changes in iOS and Android Runtime 6.1.0 logging
* [Implemented #4980](https://github.com/NativeScript/nativescript-cli/issues/4980): Update message for subscribing to NativeScript newsletter
* [Implemented #4992](https://github.com/NativeScript/nativescript-cli/pull/4992): Allow tns to be able to use npm configuration properly

### Fixed

* [Fixed #4936](https://github.com/NativeScript/nativescript-cli/issues/4936): HMR not recovering after exception in Angular lazy routes
* [Fixed #4958](https://github.com/NativeScript/nativescript-cli/issues/4958): `tns doctor` fails when setup is not correct and user selects to fix it manually
* [Fixed #4971](https://github.com/NativeScript/nativescript-cli/issues/4971): Not needed checks are executed on `pod install`

6.0.3 (2019, August 05)
==
* [Fixed #4914](https://github.com/NativeScript/nativescript-cli/issues/4914): livesync not working with command tns test android
* [Fixed #4746](https://github.com/NativeScript/nativescript-cli/issues/4746): Unable to work with `karma-webpack@4.0.2` on test command
* [Fixed #4586](https://github.com/NativeScript/nativescript-cli/issues/4586): publish ios fails because of hsa2

6.0.2 (2019, July 22)
==
* [Fixed #4885](https://github.com/NativeScript/nativescript-cli/issues/4885): `migrate` and `update` commands are failing where everything is up-to-date
* [Fixed #4887](https://github.com/NativeScript/nativescript-cli/pull/4887): Include forgotten Angular dependency from the code-sharing apps
* [Fixed #4888](https://github.com/NativeScript/nativescript-cli/pull/4888): Sidekick: multiple errors in Sidekick

6.0.1 (2019, July 18)
==
* [Fixed #4814](https://github.com/NativeScript/nativescript-cli/issues/4814): Missing `yargs-parser` dependency
* [Fixed #4846](https://github.com/NativeScript/nativescript-cli/issues/4846): Xcode running on devices crashes with error `Unable to create file *.hot-update.json`
* [Fixed #4871](https://github.com/NativeScript/nativescript-cli/pull/4871): Issues when stopping the LiveSync process
* [Fixed #4872](https://github.com/NativeScript/nativescript-cli/pull/4872): Sidekick: debug operation fails on iOS when Developer Disk Image is not installed on device
* [Fixed #4873](https://github.com/NativeScript/nativescript-cli/issues/4873): `tns migrate` should update `nativescript-vue-template-compiler`
* [Fixed #4874](https://github.com/NativeScript/nativescript-cli/issues/4874): After `tns migrate` preview/build/run commands fail with `ERROR in The Angular Compiler requires TypeScript >=3.1.1 and <3.3.0 but 3.4.5 was found instead.`
* [Fixed #4876](https://github.com/NativeScript/nativescript-cli/issues/4876):`tns migrate` does not update @ngtools/webpack
* [Fixed #4878](https://github.com/NativeScript/nativescript-cli/issues/4878): `tns migrate` does not update @angular/animations
* [Fixed #4879](https://github.com/NativeScript/nativescript-cli/issues/4879): `--platform-template` option is still shown in CLI's help

6.0.0 (2019, July 17)
==

### Breaking changes

* Applications can be build only with bundle workflow - in previous versions there were two ways to build your application - `bundle` and `legacy` workflow. With this release CLI allows building your app only in case you are using the bundle workflow. More information is available [in this blopost](https://www.nativescript.org/blog/the-future-of-building-nativescript-apps)
* With older CLI versions you were able to run `tns debug android` and continue debugging after the command exits. In this release, when CLI exits, it clears all used resources, so you will not be able to continue the debug session. More information is available in [this issue](https://github.com/NativeScript/nativescript-cli/issues/4219) for more information.
* `--syncAllFiles` option is not supported anymore - this option was added to force CLI to watch all files in `node_modules`. In 6.0 this is the default and only behavior - webpack watches all required files and CLI watches the `platforms` directories and `package.json` files of the plugins added as dependencies of the application.
* Drop support for Xcode versions below 10 - new features for iOS require the latest Xcode versions, so we decided to require at least Xcode 10 for building the applications
* Drop support for Node.js below 8 - Node.js 8 does not support [these version anymore](https://github.com/nodejs/Release) and so does our CLI. In case you are using such Node.js version, CLI will not allow you to execute any command, so you should upgrade to latest LTS version.
* `--platformTemplate` option has been deleted. More information can be found in [this issue](https://github.com/NativeScript/nativescript-cli/issues/4867).
* `tns init` command has been deleted
* `tns clean app` command has been deleted
* Improved plugin development workflow may require changes in your daily work when creating plugins. More information can be found in [this issue](https://github.com/NativeScript/nativescript-cli/issues/4865)
* When you pass `--release`, CLI will switch webpack in production mode. More information can be found in [this issue](https://github.com/NativeScript/nativescript-cli/issues/4497)
* CLI now forces sourceMap generation by default when building in debug mode. You can disable them by passing `--env.sourceMap false`. souceMaps are disabled by default in release builds, you can enable them by passing `--env.sourceMap`.

### New
* [Implemented #2368](https://github.com/NativeScript/nativescript-cli/issues/2368): Compiling in other path (dist), no in same path (src/app)
* [Implemented #2417](https://github.com/NativeScript/nativescript-cli/issues/2417): Show TypeScript line numbers in stack traces
* [Implemented #2776](https://github.com/NativeScript/nativescript-cli/issues/2776): Add ability to ignore files from final package when build in release
* [Implemented #3378](https://github.com/NativeScript/nativescript-cli/issues/3378): Running app with locally installed plugin should transpile the plugin's TypeScript files
* [Implemented #4497](https://github.com/NativeScript/nativescript-cli/issues/4497): Ability to detect within webpack if app is being built for release
* [Implemented #4604](https://github.com/NativeScript/nativescript-cli/issues/4604): Logs and errors from devices always point to bundle/vendor files
* [Implemented #4646](https://github.com/NativeScript/nativescript-cli/issues/4646): Introduce command (`tns migrate`) to migrate old project to 6.0.0 requirements
* [Implemented #4648](https://github.com/NativeScript/nativescript-cli/issues/4648): Drop support for Node.js < 8
* [Implemented #4649](https://github.com/NativeScript/nativescript-cli/issues/4649): Deprecate support for Node.js < 10
* [Implemented #4650](https://github.com/NativeScript/nativescript-cli/issues/4650): Add official support for Node.js 12
* [Implemented #4651](https://github.com/NativeScript/nativescript-cli/issues/4651): Add drawer navigation prompt when vue flavor is selected on `tns create`
* [Implemented #4667](https://github.com/NativeScript/nativescript-cli/issues/4667): Support yarn hoisted packages in a workspace context
* [Implemented #4692](https://github.com/NativeScript/nativescript-cli/issues/4692): CLI should watch package.json files in the application
* [Implemented #4731](https://github.com/NativeScript/nativescript-cli/issues/4731): Drop support for Xcode < 10
* [Implemented #4863](https://github.com/NativeScript/nativescript-cli/issues/4863): Delete `tns init` command
* [Implemented #4863](https://github.com/NativeScript/nativescript-cli/issues/4863): Delete `tns clean app` command
* [Implemented #4865](https://github.com/NativeScript/nativescript-cli/issues/4865): Improve plugin development workflow
* [Implemented #4867](https://github.com/NativeScript/nativescript-cli/issues/4867): Delete `--platformTemplate` option

### Fixed
* [Fixed #2739](https://github.com/NativeScript/nativescript-cli/issues/2739): Unit test runner do not work in --watch mode
* [Fixed #2963](https://github.com/NativeScript/nativescript-cli/issues/2963): Confusing messages on preparing plugin
* [Fixed #3028](https://github.com/NativeScript/nativescript-cli/issues/3028): Local dependency brakes build
* [Fixed #3146](https://github.com/NativeScript/nativescript-cli/issues/3146): `tns run ios` shows "No reachable hosts" after running unit tests
* [Fixed #3351](https://github.com/NativeScript/nativescript-cli/issues/3351): If you delete the whole css data or the css file itself the changes are not going to be applied to the app
* [Fixed #3546](https://github.com/NativeScript/nativescript-cli/issues/3546): Your project have installed babel-traverse version null but Android platform requires version ^6.4.5
* [Fixed #3568](https://github.com/NativeScript/nativescript-cli/issues/3568): EXPORT FAILED fse.node has conflicting provisioning settings
* [Fixed #3630](https://github.com/NativeScript/nativescript-cli/issues/3630): cp: copyFileSync: could not write to dest file (code=EPERM)
* [Fixed #3767](https://github.com/NativeScript/nativescript-cli/issues/3767): Exception when delete a file from `<plugin>/platforms/android`
* [Fixed #3849](https://github.com/NativeScript/nativescript-cli/issues/3849): The livesync check if a file has modifications doesn't work as expected
* [Fixed #4219](https://github.com/NativeScript/nativescript-cli/issues/4219): Android debugging is leaking the debug session
* [Fixed #4239](https://github.com/NativeScript/nativescript-cli/issues/4239): Copy `App_Resources` directly to `platforms/.../res` (Android) or `platforms/.../Resources` (iOS) instead of copying them with Webpack
* [Fixed #4264 ](https://github.com/NativeScript/nativescript-cli/issues/4264 ): When using `--syncAllFiles` on Android frequently crashes with error
* [Fixed #4480](https://github.com/NativeScript/nativescript-cli/issues/4480): [TypeScript & Vue project] When using `--bundle` changes made to a platform specific file in `node_modules` does not start a new build process
* [Fixed #4500](https://github.com/NativeScript/nativescript-cli/issues/4500): Changes to `.js` files located in `node_modules` causes the `livesync` to take upto 30 sec
* [Fixed #4513](https://github.com/NativeScript/nativescript-cli/issues/4513): Error when building for Android and using `bcryptjs`
* [Fixed #4607](https://github.com/NativeScript/nativescript-cli/issues/4607): Image replacement is not respected during tns run with hmr
* [Fixed #4647](https://github.com/NativeScript/nativescript-cli/issues/4647): CLI's checkForChanges method should not check all `node_modules`
* [Fixed #4658](https://github.com/NativeScript/nativescript-cli/issues/4658): [iOS] tns preview is including tns-core-modules in vendor.js
* [Fixed #4770](https://github.com/NativeScript/nativescript-cli/issues/4770): Incorrect execution of hooks where there is unresolved injected dependency


5.4.2 (2019, June 19)
==

### Fixed
* [Fixed #4732](https://github.com/NativeScript/nativescript-cli/pull/4732): HMR does not work with `tns cloud run ios ...` on Windows


5.4.1 (2019, June 17)
==

### Fixed
* [Fixed #4226](https://github.com/NativeScript/nativescript-cli/issues/4226): Slowly attaching to debugger on real iOS device with bundle
* [Fixed #4584](https://github.com/NativeScript/nativescript-cli/issues/4584): Invalid App Store Icon Error, while uploading an iOS app with CLI generated icons
* [Fixed #4608](https://github.com/NativeScript/nativescript-cli/issues/4608): Misleading message for min runtime version
* [Fixed #4664](https://github.com/NativeScript/nativescript-cli/pull/4664): `tns cloud run...` command does not respect useLegacyWorkflow flag
* [Fixed #4665](https://github.com/NativeScript/nativescript-cli/issues/4665): Incorrect error is shown when unsupported Node.js version is used
* [Fixed #4664](https://github.com/NativeScript/nativescript-cli/pull/4679): `$logger` fails to print null objects
* [Fixed #4665](https://github.com/NativeScript/nativescript-cli/issues/4701): Deprecate support for `tns init` command


5.4.0 (2019, May 15)
==

### Implemented
* [Implemented #3993](https://github.com/NativeScript/nativescript-cli/issues/3993): Improve `ctrl + c` handling.
* [Implemented #4374](https://github.com/NativeScript/nativescript-cli/issues/4374): Add `iCloudContainerEnvironment` build option.
* [Implemented #4394](https://github.com/NativeScript/nativescript-cli/issues/4394): Enable Using Hot Module Replacement by Default for New Projects
* [Implemented #4518](https://github.com/NativeScript/nativescript-cli/issues/4518): Show deprecation messages for things that will be dropped for 6.0.0 release
* [Implemented #4541](https://github.com/NativeScript/nativescript-cli/issues/4541): [Beta] Allow integration of Apple Watch application in NativeScript app
* [Implemented #4548](https://github.com/NativeScript/nativescript-cli/issues/4548): Deprecate support for the Legacy Workflow
* [Implemented #4602](https://github.com/NativeScript/nativescript-cli/issues/4602): Streamline CLI's logger


### Fixed
* [Fixed #4280](https://github.com/NativeScript/nativescript-cli/issues/4280): Incorrect message if you delete app's folder and run command with `--path` in it
* [Fixed #4512](https://github.com/NativeScript/nativescript-cli/issues/4512): App's Podfile should be applied last
* [Fixed #4573](https://github.com/NativeScript/nativescript-cli/pull/4573): logcat process is not restarted in some cases
* [Fixed #4593](https://github.com/NativeScript/nativescript-cli/issues/4593): Node.js processes not killed after `tns create` on macOS when analytics are enabled
* [Fixed #4598](https://github.com/NativeScript/nativescript-cli/issues/4598): app.css changes don't apply when debugging with --debug-brk
* [Fixed #4606](https://github.com/NativeScript/nativescript-cli/issues/4606): Unable to build application for iOS with nativescript-bottombar
* [Fixed #4616](https://github.com/NativeScript/nativescript-cli/issues/4616): `tns plugin create` command hangs

5.3.4 (2019, April 24)
==

### Fixed
* [Fixed #4561](https://github.com/NativeScript/nativescript-cli/issues/4561): CLI merges xcconfig files only for specified build configuration

5.3.3 (2019, April 23)
==

### Fixed
* [Fixed #4527](https://github.com/NativeScript/nativescript-cli/issues/4527): Unable to upload applications to App Store

5.3.2 (2019, April 12)
==

### Fixed
* [Fixed #1798](https://github.com/NativeScript/nativescript-cli/issues/1798): Test init command doesn't add a sample test in TypeScript for TypeScript/Angular projects
* [Fixed #4498](https://github.com/NativeScript/nativescript-cli/pull/4498): API: Change the AppStore ids for kinvey scanner and preview app
* [Fixed #4504](https://github.com/NativeScript/nativescript-cli/issues/4504): Custom tagged versions of android runtime are not supported
* [Fixed #4510](https://github.com/NativeScript/nativescript-cli/pull/4510): Handle HTTP 304 response status code

5.3.1 (2019, April 03)
==

### Implemented
* [Implemented #4492](https://github.com/NativeScript/nativescript-cli/pull/4492): API(kinvey): provide correct data to preview-sdk based on the schema

### Fixed
* [Fixed #4370](https://github.com/NativeScript/nativescript-cli/issues/4370): NativeScript CLI installation fails on linux
* [Fixed #4451](https://github.com/NativeScript/nativescript-cli/issues/4451): Error while trying to start application on Android emulator with API level Q
* [Fixed #4483](https://github.com/NativeScript/nativescript-cli/pull/4483): Detection fixes for emulator/device

5.3.0 (2019, March 27)
==

### Implemented
* [Implemented #3965](https://github.com/NativeScript/nativescript-cli/issues/3965): [Beta] Support for iOS app extensions
* [Implemented #4389](https://github.com/NativeScript/nativescript-cli/issues/4389): Provide a way to use Hot Module Replacement (`--hmr`) by default for a project
* [Implemented #4392](https://github.com/NativeScript/nativescript-cli/issues/4392): Ability to run unit tests with `--bundle`
* [Implemented #4456](https://github.com/NativeScript/nativescript-cli/issues/4456): Official support for Hot Module Replacement (`--hmr`)

### Fixed
* [Fixed #4403](https://github.com/NativeScript/nativescript-cli/issues/4403): Exception in iOS app entry point not shown in terminal
* [Fixed #4440](https://github.com/NativeScript/nativescript-cli/issues/4440): `NativeScript can only run in Xcode version 6.0 or greater` error is shown on every iOS command
* [Fixed #4441](https://github.com/NativeScript/nativescript-cli/issues/4441): Nothing happens with app on device if you delete a file with bundle
* [Fixed #4458](https://github.com/NativeScript/nativescript-cli/issues/4458): Warnings for short imports are shown for browser code
* [Fixed #4459](https://github.com/NativeScript/nativescript-cli/pull/4459): API: Raise `debuggerAttached` only if app is restarted during debug


5.2.3 (2019, March 12)
==

### Fixed
* [Fixed #4426](https://github.com/NativeScript/nativescript-cli/pull/4426): Some http requests may stuck and instead of hanging, we should retry them


5.2.2 (2019, March 08)
==

### Fixed
* [Fixed #4390](https://github.com/NativeScript/nativescript-cli/issues/4390): Update and synchronise the unit testing dependencies


5.2.1 (2019, March 05)
==
### Implemented
* [Implemented #4375](https://github.com/NativeScript/nativescript-cli/issues/4375): Show warning for deprecated short imports/require used in application

### Fixed
* [Fixed #3604](https://github.com/NativeScript/nativescript-cli/issues/3604): iOS build breaks with multiple plugins with Podfile
* [Fixed #4301](https://github.com/NativeScript/nativescript-cli/issues/4301): Disconnect previous iOS chrome debuggers when opening a new one
* [Fixed #4354](https://github.com/NativeScript/nativescript-cli/issues/4354): Unable to apply a change when application is not running on device
* [Fixed #4373](https://github.com/NativeScript/nativescript-cli/issues/4373): `tns test` throws an error in newly created apps
* [Fixed #4383](https://github.com/NativeScript/nativescript-cli/issues/4383): `tns doctor` command does not report any information on CircleCI and Travis virtual machines


5.2.0 (2018, February 13)
==

### Implemented
* [Implemented #3807](https://github.com/NativeScript/nativescript-cli/issues/3807): Enable app Podfile
* [Implemented #4243](https://github.com/NativeScript/nativescript-cli/issues/4243): CLI command steps profiling and performance analytics
* [Implemented #4305](https://github.com/NativeScript/nativescript-cli/issues/4305): Add official support for Node.js 11
* [Implemented #4313](https://github.com/NativeScript/nativescript-cli/issues/4313): Track how many users used {N} CLI and Playground
* [Implemented #4323](https://github.com/NativeScript/nativescript-cli/issues/4323): Skip CLI's postinstall in case it is not installed globally
* [Implemented #4325](https://github.com/NativeScript/nativescript-cli/issues/4325): Angular apps should work with HMR out of the box
* [Implemented #4343](https://github.com/NativeScript/nativescript-cli/issues/4343): Support Objective-C code in App Resources for iOS applications

### Fixed
* [Fixed #3122](https://github.com/NativeScript/nativescript-cli/issues/3122): `tns debug ios --debug-brk` fails the majority of the time
* [Fixed #3161](https://github.com/NativeScript/nativescript-cli/issues/3161): `tns test` command fails to find a running iOS simulator
* [Fixed #4232](https://github.com/NativeScript/nativescript-cli/issues/4232): Unit testing for freshly created angular project is broken on Android emulator
* [Fixed #4253](https://github.com/NativeScript/nativescript-cli/issues/4253): LiveSync stops working in Preview app when make change in scss file
* [Fixed #4255](https://github.com/NativeScript/nativescript-cli/issues/4255): Uninstalling NativeScript should also remove its extensions
* [Fixed #4283](https://github.com/NativeScript/nativescript-cli/issues/4283): `tns run android` fails with private npm registry
* [Fixed #4300](https://github.com/NativeScript/nativescript-cli/issues/4300): Strange logs after project built for Android
* [Fixed #4311](https://github.com/NativeScript/nativescript-cli/issues/4311): [iOS] Build with nativescript-plugin-firebase requires legacy build system
* [Fixed #4324](https://github.com/NativeScript/nativescript-cli/issues/4324): High CPU utilization during `tns run`
* [Fixed #4327](https://github.com/NativeScript/nativescript-cli/issues/4327): `tns devices --availableDevices` prompts to install Xcode command line tools
* [Fixed #4347](https://github.com/NativeScript/nativescript-cli/issues/4347): `tns resources generate splashes <path to image>` fails for newly created project


5.1.1 (2019, January 17)
==

### Fixed
* [Fixed #4024](https://github.com/NativeScript/nativescript-cli/issues/4024): LiveSync is not working in Preview app when Angular's lazy loading is used
* [Fixed #4197](https://github.com/NativeScript/nativescript-cli/issues/4197): Not able to change IPHONEOS_DEPLOYMENT_TARGET due to CLI overwriting ARCHS and VALID_ARCHS
* [Fixed #4222](https://github.com/NativeScript/nativescript-cli/issues/4222): Sidekick restarts DevTools during debug when change in .xml/.css/.html file is applied
* [Fixed #4218](https://github.com/NativeScript/nativescript-cli/issues/4218): Cannot run app after debug-brk fail
* [Fixed #4228](https://github.com/NativeScript/nativescript-cli/issues/4228): `tns update` command doesn't work with yarn
* [Fixed #4230](https://github.com/NativeScript/nativescript-cli/issues/4230): Debugging with HMR is not working for iOS
* [Fixed #4234](https://github.com/NativeScript/nativescript-cli/issues/4234): Creating project hangs on Windows when yarn is set as package manager
* [Fixed #4236](https://github.com/NativeScript/nativescript-cli/issues/4236): Chrome DevTools(iOS): Debugger does not attach after reloading the page
* [Fixed #4238](https://github.com/NativeScript/nativescript-cli/issues/4238): Fresh project build error on ios
* [Fixed #4251](https://github.com/NativeScript/nativescript-cli/pull/4251): Unhandled promise rejection error from sidekick when livesync to preview app with bundle
* [Fixed #4260](https://github.com/NativeScript/nativescript-cli/issues/4260): CLI crashes when attaching to a non running iOS app
* [Fixed #4261](https://github.com/NativeScript/nativescript-cli/issues/4261): The CLI requires developer disk image not only in debug
* [Fixed #4272](https://github.com/NativeScript/nativescript-cli/issues/4272): Generation of splash screen fails for new templates
* [Fixed #4273](https://github.com/NativeScript/nativescript-cli/issues/4273): `tns debug ios --hmr` If you have two open tabs and close one, breakpoints stop working
* [Fixed #4291](https://github.com/NativeScript/nativescript-cli/issues/4291): Error during debug on iOS: WebSocket is not open: readyState 2 (CLOSING)
* [Fixed #4292](https://github.com/NativeScript/nativescript-cli/issues/4292): Error during debug on iOS: RangeError: Index out of range
* [Fixed #4293](https://github.com/NativeScript/nativescript-cli/issues/4293): Error during debug on iOS: RangeError [ERR_BUFFER_OUT_OF_BOUNDS]


5.1.0 (2018, December 11)
==

### Implemented
* [Implemented #2737](https://github.com/NativeScript/nativescript-cli/issues/2737): Make it possible `tns` to use Yarn as the package manager
* [Implemented #2992](https://github.com/NativeScript/nativescript-cli/issues/2992): Do not restart application when changing `.xml`, `.html` or `.css` file when debugging
* [Implemented #4068](https://github.com/NativeScript/nativescript-cli/issues/4068): Android application bundle initial support (build .aab files)
* [Implemented #4152](https://github.com/NativeScript/nativescript-cli/issues/4152): Analytics: Get information for what has been tracked in Google Analytics
* [Implemented #4200](https://github.com/NativeScript/nativescript-cli/issues/4200): Analytics: Add analytics for code-sharing projects usage
* [Implemented #4201](https://github.com/NativeScript/nativescript-cli/issues/4201): Analytics: Track project property on every analytics hit
* [Implemented #4211](https://github.com/NativeScript/nativescript-cli/issues/4211): Analytics: Track command options in analytics

### Fixed
* [Fixed #4075](https://github.com/NativeScript/nativescript-cli/issues/4075): `tns preview` - app is refreshed on ios devices when changing android specific files
* [Fixed #4141](https://github.com/NativeScript/nativescript-cli/issues/4141): Don't prepare the project on `tns preview` command
* [Fixed #4178](https://github.com/NativeScript/nativescript-cli/issues/4178): Broken files pattern in karma config
* [Fixed #4198](https://github.com/NativeScript/nativescript-cli/issues/4198): The NativeScript Inspector is not closed on `Ctrl + C`
* [Fixed #4049](https://github.com/NativeScript/nativescript-cli/issues/4049): `tns` commands Removing Newline Added by `npm` from `package.json`


5.0.3 (2018, December 4)
==
### Fixed
* [Fixed #4186](https://github.com/NativeScript/nativescript-cli/issues/4186): Fix stuck http requests/responses
* [Fixed #4189](https://github.com/NativeScript/nativescript-cli/pull/4189): API: Fix "Cannot read property 'removeListener' of undefined" error on second stop of livesync to preview app


5.0.2 (2018, November 29)
==
### Implemented
* [Implemented #4167](https://github.com/NativeScript/nativescript-cli/pull/4167): API: Expose previewAppLiveSyncError event when some error is thrown while livesyncing to preview app

### Fixed
* [Fixed #3962](https://github.com/NativeScript/nativescript-cli/issues/3962): If command 'tns plugin create .. ' failed , directory with plugin repository name must be deleted
* [Fixed #4053](https://github.com/NativeScript/nativescript-cli/issues/4053): Update Nativescript cli setup scripts to use android sdk 28
* [Fixed #4077](https://github.com/NativeScript/nativescript-cli/issues/4077): Platform add with framework path and custom version breaks run with "--bundle"
* [Fixed #4129](https://github.com/NativeScript/nativescript-cli/issues/4129): tns preview doesn't sync changes when download 2 Playground projects
* [Fixed #4135](https://github.com/NativeScript/nativescript-cli/issues/4135): Too many TypeScript "Watching for file changes" messages in console during build
* [Fixed #4158](https://github.com/NativeScript/nativescript-cli/pull/4158): API: reset devices list when stopLiveSync method is called
* [Fixed #4161](https://github.com/NativeScript/nativescript-cli/pull/4161): API: raise deviceLost event after timeout of 5 seconds


5.0.1 (2018, November 14)
==
### Implemented
* [Implemented #4083](https://github.com/NativeScript/nativescript-cli/pull/4083): API: Add public API for deviceFound and deviceLost for preview devices
* [Implemented #4087](https://github.com/NativeScript/nativescript-cli/pull/4087): API: Expose public method for getting the qr code of playground app
* [Implemented #4093](https://github.com/NativeScript/nativescript-cli/pull/4093): API: Expose public api for starting the livesync operation to preview app

### Fixed
* [Fixed #2670](https://github.com/NativeScript/nativescript-cli/issues/2670): Command line `tns run android --clean` rebuilds
* [Fixed #4043](https://github.com/NativeScript/nativescript-cli/issues/4043): `tns preview` fails when local plugin is referenced with tag in `package.json`
* [Fixed #4046](https://github.com/NativeScript/nativescript-cli/issues/4046):`tns debug ios` does not work with bigger projects on slower devices
* [Fixed #4055](https://github.com/NativeScript/nativescript-cli/pull/4055): API: Remove persisted emulator's data on deviceLost event
* [Fixed #4056](https://github.com/NativeScript/nativescript-cli/pull/4056): API: `TypeError: Invalid Version: null` is thrown when emulator is stopped immediately after start
* [Fixed #4071](https://github.com/NativeScript/nativescript-cli/issues/4071): Unable to run `tns test <platform>`
* [Fixed #4073](https://github.com/NativeScript/nativescript-cli/pull/4073): Error is thrown when Node.js 11 is used
* [Fixed #4076](https://github.com/NativeScript/nativescript-cli/issues/4076): Cannot connect to device socket when run debug with justlaunch
* [Fixed #4079](https://github.com/NativeScript/nativescript-cli/pull/4079): API: Reset errors when fallback to list avds from director
* [Fixed #4090](https://github.com/NativeScript/nativescript-cli/issues/4090): `tns preview` and `tns platform add ...` issue
* [Fixed #4096](https://github.com/NativeScript/nativescript-cli/issues/4096): NativeScript v4 is not using the v4 of the app templates during project creation
* [Fixed #4100](https://github.com/NativeScript/nativescript-cli/issues/4100): Apply `before-plugins.gradle` file in the plugin `build.gradle`


5.0.0 (2018, November 1)
==

### Breaking

* Existing applications that are using older Android runtime (not 5.0.0 one), but are built with CLI 5.0.0, may experience some changes - until now CLI was always passing parameter to gradle `-PsupportVersion=26.0.0-alpha1`. As CLI no longer passes this version, the default one from build.gradle will be used (for example 27.0.1). Check [this issue](https://github.com/NativeScript/nativescript-cli/pull/3923) for more information. In case you want to use the old version in your application, add the following in your `app.gradle`:
```
project.ext.supportVersion = "26.0.0-alpha1"
```

* CLI will not allow building for iOS with Xcode 8 or below. Check [this issue](https://github.com/NativeScript/nativescript-cli/issues/3887) for more information.
* CLI no longer support macOS Sierra and below. In case you are using such OS, CLI will print error message on each command. It will not stop you, but certain features will not work and we will not investigate them. `tns debug ios --inspector` will not work on macOS Sierra and below.
* You will not be able to build applications for Android without installing Android SDK 28. You can install Android SDK 28 and build tools 28 by executing the following commands:
```
$ANDROID_HOME/tools/bin/sdkmanager "build-tools;28.0.1"
$ANDROID_HOME/tools/bin/sdkmanager "platforms;android-28"
```
* `tns create` command is interactive now. In case you are using it in CI environment where the shell is marked as TTY (Travis for example), the CI will hang as it will wait for selection. You can get back the old behavior by passing `--js`:  `tns create <name> --js`. In case the terminal is not interactive, CLI will use the old behavior. More information is available in [this issue](https://github.com/NativeScript/nativescript-cli/issues/3829).

### New
* [Implemented #1945](https://github.com/NativeScript/nativescript-cli/issues/1945): Add `tns plugin create` command.
* [Implemented #3040](https://github.com/NativeScript/nativescript-cli/issues/3040): Ability to have different app identifiers for iOS and Android.
* [Implemented #3813](https://github.com/NativeScript/nativescript-cli/issues/3813): Ability to preview NativeScript apps without any local setup - `tns preview` command.
* [Implemented #3829](https://github.com/NativeScript/nativescript-cli/issues/3829): Interactive `tns create`.
* [Implemented #3843](https://github.com/NativeScript/nativescript-cli/issues/3843): Make new Android livesync reuse socket connection.
* [Implemented #3866](https://github.com/NativeScript/nativescript-cli/issues/3866): Read registry from npm config instead of hard-wiring to registry.npmjs.org.
* [Implemented #3875](https://github.com/NativeScript/nativescript-cli/issues/3875): Add hot module replacement option (`--hmr`) for `tns run [<platform>]` command  - it will not to restart the app on js/ts changes.
* [Implemented #3886](https://github.com/NativeScript/nativescript-cli/issues/3886): Drop support for macOS Sierra and below.
* [Implemented #3887](https://github.com/NativeScript/nativescript-cli/issues/3887): CLI should not allow execution of iOS commands with Xcode 8 and below.
* [Implemented #3923](https://github.com/NativeScript/nativescript-cli/pull/3923): Remove requirement for Android Support Repository local installation.
* [Implemented #3991](https://github.com/NativeScript/nativescript-cli/issues/3991): Require Android SDK 28 for compilation.
* [Implemented #4036](https://github.com/NativeScript/nativescript-cli/issues/4036): Ability to run with bundle option on multiple platforms - `tns run --bundle` command.

### Fixed
* [Fixed #3549](https://github.com/NativeScript/nativescript-cli/issues/3549): Podfile generation broken on livesync
* [Fixed #3686](https://github.com/NativeScript/nativescript-cli/issues/3686): Pod install fails with non-error message for fresh installations
* [Fixed #3878](https://github.com/NativeScript/nativescript-cli/pull/3878): Prompter for mail on postinstall is very obligatory
* [Fixed #3910](https://github.com/NativeScript/nativescript-cli/pull/3910): `tns platform add ios` should not be executed on non-macOS
* [Fixed #3912](https://github.com/NativeScript/nativescript-cli/issues/3912): Build fails with Xcode 10 with error could not find included file `../plugins-debug.xcconfig` in search paths
* [Fixed #3920](https://github.com/NativeScript/nativescript-cli/issues/3920): iOS apps will not start with Xcode 10
* [Fixed #3932](https://github.com/NativeScript/nativescript-cli/issues/3932): Plugins' platforms directory should not exist in tns_modules
* [Fixed #3934](https://github.com/NativeScript/nativescript-cli/issues/3934): Unable to create project from scoped package
* [Fixed #3937](https://github.com/NativeScript/nativescript-cli/issues/3937): The app cannot be recovered with livesync after an unhandled exception on iOS
* [Fixed #3957](https://github.com/NativeScript/nativescript-cli/issues/3957): Always have to run plugin tests twice on iOS - Failed to load Info.plist from bundle at path
* [Fixed #3984](https://github.com/NativeScript/nativescript-cli/issues/3984): Files are not deleted from platforms folder on `tns run` command
* [Fixed #3986](https://github.com/NativeScript/nativescript-cli/pull/3986): `tns debug ios` command fails in some cases on iOS Simulator
* [Fixed #4007](https://github.com/NativeScript/nativescript-cli/issues/4007): Application built in release has TypeScript files
* [Fixed #4010](https://github.com/NativeScript/nativescript-cli/issues/4010): `node_modules` are prepared twice on initial run


4.2.4 (2018, September 19)
==

### Fixed
* [Fixed #3832](https://github.com/NativeScript/nativescript-cli/issues/3832): Unable to work with devices with numeric identifiers
* [Fixed #3881](https://github.com/NativeScript/nativescript-cli/pull/3881): Replace forum references with stack overflow.
* [Fixed #3883](https://github.com/NativeScript/nativescript-cli/issues/3883): CLI installs the app on every change
* [Fixed #3893](https://github.com/NativeScript/nativescript-cli/pull/3893): [API] Errors are raised when emulator lost/found event is raised.
* [Fixed #3893](https://github.com/NativeScript/nativescript-cli/pull/3893): [API] Android emulator image display names are not correct.
* [Fixed #3894](https://github.com/NativeScript/nativescript-cli/issues/3894): `Socket Error: Error: write ECONNABORTED` is raised when trying to run on Android


4.2.3 (2018, August 27)
==

### Fixed
* [Fixed #3840](https://github.com/NativeScript/nativescript-cli/issues/3840): Unable to reconnect to iOS Simulator when debugging
* [Fixed #3824](https://github.com/NativeScript/nativescript-cli/issues/3824): `tns create` command not using proxy set with `tns proxy set`


4.2.2 (2018, August 17)
==

### Fixed
* [Fixed #3818](https://github.com/NativeScript/nativescript-cli/issues/3818): Unable to start application on Android device with a custom activity containing capital letters
* [Fixed #3820](https://github.com/NativeScript/nativescript-cli/issues/3820): A command help is shown on native build error
* [Fixed #3821](https://github.com/NativeScript/nativescript-cli/issues/3821): [Sporadic] Unable to start iOS debugger from VSCode extension


4.2.1 (2018, August 10)
==

### Fixed
* [Fixed #3763](https://github.com/NativeScript/nativescript-cli/issues/3763): Duplicated entries in `tns run` log while livesyncing
* [Fixed #3802](https://github.com/NativeScript/nativescript-cli/issues/3802): Unable to use templates without `App_Resources`
* [Fixed #3803](https://github.com/NativeScript/nativescript-cli/issues/3803): `tns run ios` command fails if tns-ios version is a tag
* [Fixed #3805](https://github.com/NativeScript/nativescript-cli/issues/3805): `tns run android` fails in case you do not have Android emulator images


4.2.0 (2018, August 7)
==

### New
* [Implemented #3023](https://github.com/NativeScript/nativescript-cli/issues/3023): `tns device --available-devices` to list all emulator images
* [Implemented #3717](https://github.com/NativeScript/nativescript-cli/pull/3717): Speed up device detection
* [Implemented #3718](https://github.com/NativeScript/nativescript-cli/issues/3718): Install the Android project dependencies only when needed
* [Implemented #3719](https://github.com/NativeScript/nativescript-cli/issues/3719): Build plugins with the same gradle versions as the runtime
* [Implemented #3735](https://github.com/NativeScript/nativescript-cli/pull/3735): Speed up adding native platform
* [Implemented #3750](https://github.com/NativeScript/nativescript-cli/pull/3750): Add hook for `checkForChanges`
* [Implemented #3733](https://github.com/NativeScript/nativescript-cli/issues/3733): [API] Expose API for listing and starting emulators and simulators when using CLI as library.
* [Implemented #3797](https://github.com/NativeScript/nativescript-cli/issues/3797): Use sockets to LiveSync changes on Android
* [Implemented #3798](https://github.com/NativeScript/nativescript-cli/issues/3798): Allow templates to be full application - full support

### Fixed
* [Fixed #2485](https://github.com/NativeScript/nativescript-cli/issues/2485): EACCES (Permission denied) when livesync Angular projects on Samsung devices
* [Fixed #2547](https://github.com/NativeScript/nativescript-cli/issues/2547): `tns-android` remains inside dependencies when `tns build/run android` fails
* [Fixed #3132](https://github.com/NativeScript/nativescript-cli/issues/3132): Xcode 9: Requires Provisioning Profile Error
* [Fixed #3602](https://github.com/NativeScript/nativescript-cli/issues/3602): Livesync does not work on Android P
* [Fixed #3610](https://github.com/NativeScript/nativescript-cli/issues/3610): Livesync ignores aar file changes inside a plugin
* [Fixed #3672](https://github.com/NativeScript/nativescript-cli/issues/3672): `tns run/debug ios --syncAllFiles` with cocoapods has issues
* [Fixed #3707](https://github.com/NativeScript/nativescript-cli/issues/3707): CLI generates aar files on changes in `app/` (livesync with webpack)
* [Fixed #3710](https://github.com/NativeScript/nativescript-cli/issues/3710): CLI regenerates ALL aar files on changes in `node_modules`
* [Fixed #3723](https://github.com/NativeScript/nativescript-cli/issues/3723): iOS build for device fails with Xcode 10 beta versions
* [Fixed #3729](https://github.com/NativeScript/nativescript-cli/pull/3729): File references inside .pbxproject are incorrect when there's space in project path
* [Fixed #3741](https://github.com/NativeScript/nativescript-cli/issues/3741): Platforms folder need to be removed after a bitcode error
* [Fixed #3744](https://github.com/NativeScript/nativescript-cli/pull/3744): During all gradle operations "Gradle build" message is printed
* [Fixed #3751](https://github.com/NativeScript/nativescript-cli/issues/3751): Problem building nativescript-google-maps-sdk on Android
* [Fixed #3752](https://github.com/NativeScript/nativescript-cli/issues/3752): Increase the default timeout for debug command from 5 to 10 seconds
* [Fixed #3768](https://github.com/NativeScript/nativescript-cli/pull/3768): Skip preparation of plugins native files in case they are not changed
* [Fixed #3794](https://github.com/NativeScript/nativescript-cli/pull/3794): Update lodash to fix a security vulnerability.


4.1.2 (2018, June 26)
==

### Fixed

* [Fixed #2283](https://github.com/NativeScript/nativescript-cli/issues/2283): On adding test frameworks their peerDependencies are not installed
* [Fixed #3689](https://github.com/NativeScript/nativescript-cli/issues/3689): `tns test <platform>` throws exception


4.1.1 (2018, June 19)
==

### Fixed

* [Fixed #3625](https://github.com/NativeScript/nativescript-cli/issues/3625): `tns run ios --device fakeId` start random emulator
* [Fixed #3633](https://github.com/NativeScript/nativescript-cli/pull/3633): iOS Debugging: Close frontend socket unconditionally
* [Fixed #3644](https://github.com/NativeScript/nativescript-cli/issues/3644): `tns run ios --justlaunch` do not exit on real iOS devices
* [Fixed #3658](https://github.com/NativeScript/nativescript-cli/issues/3658): Don't rebuild application for android when something is changed in App_Resources/iOS
* [Fixed #3660](https://github.com/NativeScript/nativescript-cli/issues/3660): A deprecation warning is shown when `tns debug ios` command is executed with node v10
* [Fixed #3662](https://github.com/NativeScript/nativescript-cli/pull/3662): Fix project creation when template v2 is used
* [Fixed #3666](https://github.com/NativeScript/nativescript-cli/issues/3666): Unable to generate icons when the Contents.json is not generated by Xcode
* [Fixed #3675](https://github.com/NativeScript/nativescript-cli/pull/3675): File connections to iOS device work for a single app only
* [Fixed #3677](https://github.com/NativeScript/nativescript-cli/issues/3677): docs: Add alias to plugin add/install
* [Fixed #3682](https://github.com/NativeScript/nativescript-cli/pull/3682): Use google as default repo when building plugins


4.1.0 (2018, May 31)
==

### New
* [Implemented #3321](https://github.com/NativeScript/nativescript-cli/issues/3321): Work simultaneously with multiple iOS Simulators
* [Implemented #3404](https://github.com/NativeScript/nativescript-cli/issues/3404): Start LiveSync watcher earlier during run
* [Implemented #3570](https://github.com/NativeScript/nativescript-cli/issues/3570): Add deprecation message for macOS versions under High Sierra
* [Implemented #3581](https://github.com/NativeScript/nativescript-cli/issues/3581): Drop support for Node.js 4.x.x
* [Implemented #3582](https://github.com/NativeScript/nativescript-cli/issues/3582): Deprecate support for Node.js 6.x.x
* [Implemented #3605](https://github.com/NativeScript/nativescript-cli/issues/3605): Support Java 10
* [Implemented #3636](https://github.com/NativeScript/nativescript-cli/issues/3636): Allow templates to be full applications - BETA support
* [Implemented #3650](https://github.com/NativeScript/nativescript-cli/issues/3650): Enable using source code in iOS part of plugins

### Fixed
* [Fixed #1398](https://github.com/NativeScript/nativescript-cli/issues/1398): CLI detects iOS devices connected over Wi-fi and fails to work with them
* [Fixed #2831](https://github.com/NativeScript/nativescript-cli/issues/2831): `tns debug android --start` releases the terminal session
* [Fixed #3580](https://github.com/NativeScript/nativescript-cli/pull/3580): API: isValidNativeScriptProject returns incorrect result
* [Fixed #3593](https://github.com/NativeScript/nativescript-cli/issues/3593): Tracking for used Debug tools is not correct
* [Fixed #3629](https://github.com/NativeScript/nativescript-cli/issues/3629): `tns debug android --start` does not print application console.logs


4.0.2 (2018, May 18)
==

### Fixed
* [Fixed #3595](https://github.com/NativeScript/nativescript-cli/issues/3595): Do not track local paths in Analytics
* [Fixed #3597](https://github.com/NativeScript/nativescript-cli/issues/3597): Users who subscribe to Progess Newsletter are not informed for the privacy policy

4.0.1 (2018, May 11)
==

### New
* [Implemented #3535](https://github.com/NativeScript/nativescript-cli/pull/3535) API: Expose androidProcessService - getAppProcessId method

### Fixed
* [Fixed #1548](https://github.com/NativeScript/nativescript-cli/issues/1548): `--sdk` flag not working properly when starting emulators in iOS
* [Fixed #2131](https://github.com/NativeScript/nativescript-cli/issues/2131): Simulators with `(` in name are not started after `tns run ios --device <device_name>`
* [Fixed #2727](https://github.com/NativeScript/nativescript-cli/issues/2727): Passing more than one parameter on `tns create` returns unappropriate error message
* [Fixed #3529](https://github.com/NativeScript/nativescript-cli/issues/3529): iOS logging does not work on multiple simulators
* [Fixed #3536](https://github.com/NativeScript/nativescript-cli/issues/3536): Message for tracking in Google Analytics is always printed
* [Fixed #3554](https://github.com/NativeScript/nativescript-cli/issues/3554): NativeScript is not compatible with Node.js 10.x.x
* [Fixed #3557](https://github.com/NativeScript/nativescript-cli/pull/3557): Asset generation should not fail in case some App_Resources are missing.
* [Fixed #3560](https://github.com/NativeScript/nativescript-cli/issues/3560): Android build fails when path to app has space and plugin should be build


4.0.0 (2018, April 10)
==

### New
* [Implemented #2632](https://github.com/NativeScript/nativescript-cli/issues/2632) Guidance for new CLI users
* [Implemented #3243](https://github.com/NativeScript/nativescript-cli/issues/3243) 'Scss' file changes trigger app refresh instead reloading the view and apply generated 'css'
* [Implemented #3248](https://github.com/NativeScript/nativescript-cli/issues/3248) Support JDK_HOME and JAVA_HOME
* [Implemented #3257](https://github.com/NativeScript/nativescript-cli/issues/3257) Make {N} project structure configurable
* [Implemented #3317](https://github.com/NativeScript/nativescript-cli/issues/3317) Support livesync with webpack
* [Implemented #3449](https://github.com/NativeScript/nativescript-cli/pull/3449) Track Vue.js project type
* [Implemented #3496](https://github.com/NativeScript/nativescript-cli/issues/3496) Generate assets for the mobile application
* [Implemented #3497](https://github.com/NativeScript/nativescript-cli/issues/3497) Command to migrate Android resources to 4.0.0 structure
* [Implemented #3516](https://github.com/NativeScript/nativescript-cli/issues/3516) Improve Getting Started Experience

### Fixed
* [Fixed #3151](https://github.com/NativeScript/nativescript-cli/issues/3151): Install fails if user setting file is not valid json
* [Fixed #3324](https://github.com/NativeScript/nativescript-cli/issues/3324): Error when iOS simulator's window is closed
* [Fixed #3442](https://github.com/NativeScript/nativescript-cli/issues/3442): Unnecessary second build upon `tns run android`
* [Fixed #3451](https://github.com/NativeScript/nativescript-cli/issues/3451): `tns plugin remove` fails with : Cannot convert undefined or null to object
* [Fixed #3470](https://github.com/NativeScript/nativescript-cli/issues/3470): Error when we are publishing to AppStore
* [Fixed #3481](https://github.com/NativeScript/nativescript-cli/issues/3481): Cannot log in users on iOS simulator with kinvey-nativescript-sdk
* [Fixed #3514](https://github.com/NativeScript/nativescript-cli/pull/3514): Incorrect error is shown when xcrun simctl is not configured

3.4.3 (2018, March 02)
==

### New
* [Implemented #3407](https://github.com/NativeScript/nativescript-cli/issues/3407) Allow templates to predefine plugin configurations in `package.json`
* [Implemented #3408](https://github.com/NativeScript/nativescript-cli/issues/3408) Add additional tracking for users who have exported projects from Playground


3.4.2 (2018, February 01)
==

### New
* [Implemented #2127](https://github.com/NativeScript/nativescript-cli/issues/2127): Feature Request: Ability to disable spinner during install process

### Fixed
* [Fixed #3337](https://github.com/NativeScript/nativescript-cli/issues/3337): Empty Chrome DevTools when using tns debug ios for iOS Simulator
* [Fixed #3338](https://github.com/NativeScript/nativescript-cli/issues/3338): `tns debug ios --chrome` can not stop on first line


3.4.1 (2018, January 11)
==

### New
* [Implemented #3313](https://github.com/NativeScript/nativescript-cli/pull/3313): Allow using Android SDK 27

### Fixed
* [Fixed #3280](https://github.com/NativeScript/nativescript-cli/issues/3280): App_Resources are duplicated on consecutive builds with --bundle
* [Fixed #3183](https://github.com/NativeScript/nativescript-cli/issues/3183): `tns debug ios --chrome` keeps changing port on every livesync update
* [Fixed #3148](https://github.com/NativeScript/nativescript-cli/issues/3148): Fix detection of Javac version
* [Fixed #3302](https://github.com/NativeScript/nativescript-cli/pull/3302): fix(ios-inspector): Update cached inspector package to latest compatible version
* [Fixed #3311](https://github.com/NativeScript/nativescript-cli/pull/3311): Allow setting authenthicated proxy on Windows when Visual C++ redistributable is not installed


3.4.0 (2017, December 20)
==

### New
* [Implemented #3171](https://github.com/NativeScript/nativescript-cli/issues/3171): Make --chrome the default for tns debug ios

### Fixed
* [Fixed #3268](https://github.com/NativeScript/nativescript-cli/issues/3268): tns run android - EMFILE: too many open files
* [Fixed #3202](https://github.com/NativeScript/nativescript-cli/issues/3202): `tns update <version>` does not work
* [Fixed #3187](https://github.com/NativeScript/nativescript-cli/issues/3187): Android tns debug, crashing when there is a response from server

3.3.1 (2017, November 17)
==

### Fixed
* [Fixed #3164](https://github.com/NativeScript/nativescript-cli/issues/3164): `npm run build-*-bundle` gets stuck at nativescript-unit-test-runner hook.
* [Fixed #3182](https://github.com/NativeScript/nativescript-cli/issues/3182): CLI fails when unable to start Analytics Broker process.

3.3.0 (2017, October 26)
==

### New

* [Implemented #3076](https://github.com/NativeScript/nativescript-cli/issues/3076): NativeScript setup scripts should have silent installer mode.

### Fixed
* [Fixed #3141](https://github.com/NativeScript/nativescript-cli/issues/3141): No console.log output Xcode 9 iOS 11.
* [Fixed #3016](https://github.com/NativeScript/nativescript-cli/issues/3016): tns_modules randomly appears in app folder and breaks build.
* [Fixed #2967](https://github.com/NativeScript/nativescript-cli/issues/2967): Create plugin by static static libraries error.

3.2.0 (2017, September 7)
==

### Fixed
* [Fixed #3073](https://github.com/NativeScript/nativescript-cli/issues/3073): Saving two platform-specific files during LiveSync causes an exception
* [Fixed #3054](https://github.com/NativeScript/nativescript-cli/issues/3054): `tns prepare <platform>` fails with Unhandled promise rejection
* [Fixed #3048](https://github.com/NativeScript/nativescript-cli/issues/3048): Fixed setup script for Windows
* [Fixed #3046](https://github.com/NativeScript/nativescript-cli/issues/3046): Export fails for Xcode 9 beta 5
* [Fixed #3026](https://github.com/NativeScript/nativescript-cli/issues/3026): Fixed scripts for local installation of NativeScript on macOS
* [Fixed #3021](https://github.com/NativeScript/nativescript-cli/issues/3021): If multiple devices from the same platform are connected `tns debug <platform> --start` should ask you which of them to use
* [Fixed #3020](https://github.com/NativeScript/nativescript-cli/issues/3020): iOS Archive Export unexpected behavior when using AdHoc or AppStore provisioning
* [Fixed #3007](https://github.com/NativeScript/nativescript-cli/issues/3007): Application hangs on iOS during LiveSync
* [Fixed #3006](https://github.com/NativeScript/nativescript-cli/issues/3006): Add help for --provision option
* [Fixed #2952](https://github.com/NativeScript/nativescript-cli/issues/2952): Do not select automatically on which Android device to start debugging
* [Fixed #2946](https://github.com/NativeScript/nativescript-cli/issues/2946): Can't run iOS app on case-sensitive filesystem on macOS
* [Fixed #2934](https://github.com/NativeScript/nativescript-cli/issues/2934): Running `tns build android --release ...` uses *.debug.* files in build output
* [Fixed #2888](https://github.com/NativeScript/nativescript-cli/issues/2888): Build in release mode for iOS doesn't seem to set the production mode for APN
* [Fixed #2825](https://github.com/NativeScript/nativescript-cli/issues/2825): LiveSync won't work if appId doesn't match - no warning/error
* [Fixed #2818](https://github.com/NativeScript/nativescript-cli/issues/2818): Exception and stack trace is not shown in terminal for Android
* [Fixed #2810](https://github.com/NativeScript/nativescript-cli/issues/2810): Cannot read property 'match' of null error when installing nativescript cli
* [Fixed #2728](https://github.com/NativeScript/nativescript-cli/issues/2728): `tns run ios --device fakeID` starts iOS Simulator
* [Fixed #2716](https://github.com/NativeScript/nativescript-cli/issues/2716): Webpack issues when build in release mode
* [Fixed #2657](https://github.com/NativeScript/nativescript-cli/issues/2657): `tns run android/ios` does not remove folders correctly
* [Fixed #2515](https://github.com/NativeScript/nativescript-cli/issues/2515): CLI captures logs from Chrome and Cordova apps
* [Fixed #2501](https://github.com/NativeScript/nativescript-cli/issues/2501): Manual signing with distribution provisioning profile fails with NS 2.5

3.1.3 (2017, July 25)
==

### New

* [Implemented #2470](https://github.com/NativeScript/nativescript-cli/issues/2470): Establish a recommended workflow for simultaneous Android & iOS development - use `tns run` command.
* [Implemented #2873](https://github.com/NativeScript/nativescript-cli/issues/2873): Add official support for Node 8.
* [Implemented #2894](https://github.com/NativeScript/nativescript-cli/issues/2894): Support for Android 8 (API-26) and Android Build Tools 26.0.0.

### Fixed
* [Fixed #2361](https://github.com/NativeScript/nativescript-cli/issues/2361): 'iTunes is not installed...' on Windows when using `tns run android`.
* [Fixed #2870](https://github.com/NativeScript/nativescript-cli/issues/2870): CLI can not create projects with custom templates when npm 5 is used	.
* [Fixed #2871](https://github.com/NativeScript/nativescript-cli/issues/2871): CLI can not add platform from local tgz package when npm 5 is used	.
* [Fixed #2889](https://github.com/NativeScript/nativescript-cli/issues/2889): `tns prepare ios --provision` starts simulator.
* [Fixed #2936](https://github.com/NativeScript/nativescript-cli/issues/2936): CFBundleURLTypes cannot be overridden from a plugin.
* [Fixed #2941](https://github.com/NativeScript/nativescript-cli/issues/2941): Duplicate console logs with LiveSync in 3.1.
* [Fixed #2965](https://github.com/NativeScript/nativescript-cli/issues/2965): Unmet peerDependencies break adding of platform.
* [Fixed #2966](https://github.com/NativeScript/nativescript-cli/issues/2966): Improve selection of device/emulator for debugging.
* [Fixed #2975](https://github.com/NativeScript/nativescript-cli/issues/2975): CLI Process hangs on native build failure.
* [Fixed #2986](https://github.com/NativeScript/nativescript-cli/issues/2986): Preparing a project for a platform causes changes for the other platform.
* [Fixed #2988](https://github.com/NativeScript/nativescript-cli/issues/2988): CLI fails with EPIPE during `$ tns run ios`.

3.1.2 (2017, July 06)
==

### Fixed
* [Fixed #2950](https://github.com/NativeScript/nativescript-cli/issues/2950): Unable to provide user input on postinstall of plugin

3.1.1 (2017, June 28)
==

### Fixed
* [Fixed #2879](https://github.com/NativeScript/nativescript-cli/issues/2879): Livesync does not apply changes in CSS files on physical iOS devices
* [Fixed #2892](https://github.com/NativeScript/nativescript-cli/issues/2892): Not copying the CFBundleURLTypes from the plist file to the project
* [Fixed #2916](https://github.com/NativeScript/nativescript-cli/issues/2916): If no device or emulator is attached `tns debug android` kills the commandline process and doesn't start an emulator
* [Fixed #2923](https://github.com/NativeScript/nativescript-cli/issues/2923): Fix asking for user email on postinstall
* [Fixed #2929](https://github.com/NativeScript/nativescript-cli/issues/2929): Android release builds with webpack disregards plugin's gradle dependencies.


3.1.0 (2017, June 22)
==

### Fixed

* [Fixed #2905](https://github.com/NativeScript/nativescript-cli/issues/2905): Doctor command fails when ANDROID_HOME is not set
* [Fixed #2874](https://github.com/NativeScript/nativescript-cli/issues/2874): Unable to build and deploy app to iTunes: Unable to connect to iTunes Connect
* [Fixed #2856](https://github.com/NativeScript/nativescript-cli/issues/2856): DevDependencies' dependencies are added to native project
* [Fixed #2860](https://github.com/NativeScript/nativescript-cli/issues/2860): `tns run ios` fails on iOS devices after rebuilding application in the process
* [Fixed #2850](https://github.com/NativeScript/nativescript-cli/issues/2850): Document properly the "Emulate Options"
* [Fixed #2757](https://github.com/NativeScript/nativescript-cli/issues/2757): `tns build ios --forDevice --path TestApp` start simulator
* [Fixed #2720](https://github.com/NativeScript/nativescript-cli/issues/2720): Livesync error with webstorm temporary files
* [Fixed #2716](https://github.com/NativeScript/nativescript-cli/issues/2716): Web pack issues when build in release mode
* [Fixed #2501](https://github.com/NativeScript/nativescript-cli/issues/2501): Manual signing with distribution provisioning profile fails with NS 2.5
* [Fixed #2446](https://github.com/NativeScript/nativescript-cli/issues/2446): tns run--device NonexistentName retunrs different messages for ios and android
* [Fixed #1358](https://github.com/NativeScript/nativescript-cli/issues/1358): Webstorm Ubuntu .bash_profile
* [Fixed #521](https://github.com/NativeScript/nativescript-cli/issues/521): EPERM error with .local/share directory after installing CLI

### Deprecated

* [Implemented #2329](https://github.com/NativeScript/nativescript-cli/issues/2329): Remove the emulate command

3.0.3 (2017, June 1)
==

### Fixed

* [Fix #2855](https://github.com/NativeScript/nativescript-cli/issues/2855): iOS inspector not installed with npm 5

3.0.2 (2017, May 30)
==

### Fixed

* Removed restart of the App if HTML/CSS file was modified. The issue is fixed in the Modules **3.0.1** and we can again just refresh the app on change.
* [Fix #2852](https://github.com/NativeScript/nativescript-cli/pull/2852): Fix prepare for android when building with webpack

3.0.1 (2017, May 11)
==

### Fixed

* [Fix #2732](https://github.com/NativeScript/nativescript-cli/issues/2732): Livesync crashes app every OTHER time on iOS with 3.0.0-rc.2
* [Fix #2764](https://github.com/NativeScript/nativescript-cli/issues/2764): Error when executing "tns run ios" with 3.0 on a project that is located in a directory path with "spaces"

2.5.5 (2017, May 11)
==

### Fixed

* [Fix #2782](https://github.com/NativeScript/nativescript-cli/issues/2782): [2.5.*] tns run always add latest platform

3.0.0 (2017, May 3)
==

### Fixed

* [Fixed #2500](https://github.com/NativeScript/nativescript-cli/issues/2500): Debug on device does not sync file changes
* [Fixed #2639](https://github.com/NativeScript/nativescript-cli/issues/2639): Build continues after gradle build fails
* [Fixed #1882](https://github.com/NativeScript/nativescript-cli/issues/1882): Run/debug commands should not try to deploy on connected but not paired devices
* [Fixed #2673](https://github.com/NativeScript/nativescript-cli/issues/2673): `tns device ios` does not list real devices if simulator is running.
* [Fixed #2685](https://github.com/NativeScript/nativescript-cli/issues/2685): `tns run ios` starts iOS Simulator even if physical iOS device is attached
* [Fixed #2661](https://github.com/NativeScript/nativescript-cli/issues/2661): Adding new files during livesync doesn't succeed on iOS Devices
* [Fixed #2650](https://github.com/NativeScript/nativescript-cli/issues/2650): Release Build Android error: gradlew.bat failed with exit code 1 When Path contains Space
* [Fixed #2125](https://github.com/NativeScript/nativescript-cli/issues/2125): NativeScript setup script fails on Mac
* [Fixed #2697](https://github.com/NativeScript/nativescript-cli/issues/2697): App_Resources being copied into app RAW

3.0.0-RC.1 (2017, March 29)
==

### New

* [Implemented #2170](https://github.com/NativeScript/nativescript-cli/issues/2170): CLI should report adb install errors
* [Implemented #2204](https://github.com/NativeScript/nativescript-cli/issues/2204): Remove fibers from CLI and use async/await
* [Implemented #2349](https://github.com/NativeScript/nativescript-cli/issues/2349): Command "emulate" and options "--emulator/--device/--avd" are a bit confusing to use
* [Implemented #2513](https://github.com/NativeScript/nativescript-cli/issues/2513): Allow templates to omit App_Resources
* [Implemented #2633](https://github.com/NativeScript/nativescript-cli/issues/2633): Deprecate `tns livesync` command

### Fixed

* [Fixed #2225](https://github.com/NativeScript/nativescript-cli/issues/2225): The tns debug ios command hangs on launch screen
* [Fixed #2357](https://github.com/NativeScript/nativescript-cli/issues/2357): --copy-to option is broken
* [Fixed #2446](https://github.com/NativeScript/nativescript-cli/issues/2446): tns emulate --device NonexistentName retunrs different messages for ios and android
* [Fixed #2486](https://github.com/NativeScript/nativescript-cli/issues/2486): tns run android (without started emulator/connected device) fails to start app
* [Fixed #2487](https://github.com/NativeScript/nativescript-cli/issues/2487): Exception: The plugin tns-android@2.5.0 is already installed
* [Fixed #2496](https://github.com/NativeScript/nativescript-cli/issues/2496): `tns platform clean android` does not maintain the same version of the runtimes
* [Fixed #2511](https://github.com/NativeScript/nativescript-cli/issues/2511): Second run of `tns run android --release` does not respect changes in application code
* [Fixed #2557](https://github.com/NativeScript/nativescript-cli/issues/2557): 2.5.1 iOS incremental build generates inconsistent binary
* [Fixed #2559](https://github.com/NativeScript/nativescript-cli/issues/2559): `tns init` fails, `ins init --force` produce invalid app
* [Fixed #2560](https://github.com/NativeScript/nativescript-cli/issues/2560): `tns run` should do full prepare/rebuild if something in App_Resources is changes
* [Fixed #2561](https://github.com/NativeScript/nativescript-cli/issues/2561): Fix prepare process terminates if passing too many arguments to a new node process
* [Fixed #2641](https://github.com/NativeScript/nativescript-cli/issues/2641): Removed files are not sync correctly on android
* [Fixed #2642](https://github.com/NativeScript/nativescript-cli/issues/2642): `tns run ios/android` sync hidden files
* [Fixed #2653](https://github.com/NativeScript/nativescript-cli/issues/2653): Copy folder with files inside app breaks live sync

2.5.3 (2017, March 20)
==

### New

* [Implemented #2583](https://github.com/NativeScript/nativescript-cli/issues/2583): Add support for Android SDK Tools 25.2.3

2.5.2 (2017, February 24)
==

### Fixed

* [Fixed #2564](https://github.com/NativeScript/nativescript-cli/issues/2564): Add support for Node.js 7.6.0

2.5.1 (2017, February 17)
==

### Fixed

* [Fixed #2476](https://github.com/NativeScript/nativescript-cli/issues/2476): `tns run ios` unable to sync files on iOS Simulator
* [Fixed #2491](https://github.com/NativeScript/nativescript-cli/issues/2491): "ERROR Error: Could not find module" after 2.5 upgrade
* [Fixed #2472](https://github.com/NativeScript/nativescript-cli/issues/2472): Livesync watches .DS_Store files
* [Fixed #2469](https://github.com/NativeScript/nativescript-cli/issues/2469): `tns run` can get stuck in a loop since 2.5
* [Fixed #2512](https://github.com/NativeScript/nativescript-cli/issues/2512): Run should not watch hidden files
* [Fixed #2521](https://github.com/NativeScript/nativescript-cli/issues/2521): Enable requesting user input during plugin installation

2.5.0 (2017, February 1)
==
### New
* [Implemented #2330](https://github.com/NativeScript/nativescript-cli/issues/2330) and [#1366](https://github.com/NativeScript/nativescript-cli/issues/1366): Run command syncs and watches for changes
* [Implemented #2277](https://github.com/NativeScript/nativescript-cli/issues/2277): Fast livesync of images
* [Implemented #2276](https://github.com/NativeScript/nativescript-cli/issues/2276): Support plugin development when using the watch option
* [Implemented #2260]( https://github.com/NativeScript/nativescript-cli/issues/2260): Deprecate support for Node.js 4.x feature
* [Implemented #2112]( https://github.com/NativeScript/nativescript-cli/issues/2112): Update webpack plugin to run as a npm script feature
* [Implemented #1906]( https://github.com/NativeScript/nativescript-cli/issues/1906): TNS Doctor Android tools detection feature
* [Implemented #1845](https://github.com/NativeScript/nativescript-cli/issues/1845): Remove NPM as a dependency, use the NPM installed on users' machine feature

### Fixed

**Install and setup issues**

* [Fixed #2302](https://github.com/NativeScript/nativescript-cli/issues/2302): App runs in Xcode and CLI but not on test flight
* [Fixed #1922](https://github.com/NativeScript/nativescript-cli/issues/1922): TNS doctor does not detect if JDK is not installed and throws an error
* [Fixed #2312](https://github.com/NativeScript/nativescript-cli/issues/2312): Creating app w/ nativescript@next is not deploying App_Resources folder
* [Fixed #2308](https://github.com/NativeScript/nativescript-cli/issues/2308): Using nativescript@next brings multiple libraries into node_modules
* [Fixed #2301](https://github.com/NativeScript/nativescript-cli/issues/2301): Rework logic of handling 2 package.json files after tns create
* [Fixed #2299](https://github.com/NativeScript/nativescript-cli/issues/2299): tns create TestApp --ng (or --tsc) takes too long
* [Fixed #2257](https://github.com/NativeScript/nativescript-cli/issues/2257): {N} doesn't include @namespace node_modules

**Build, Prepare, Run issues**

* [Fixed #2213](https://github.com/NativeScript/nativescript-cli/issues/2213): When switching build configurations plugin platform files are copied into assets
* [Fixed #2177](https://github.com/NativeScript/nativescript-cli/issues/2177): Prepare does not flatten scoped dependencies
* [Fixed #2150](https://github.com/NativeScript/nativescript-cli/issues/2150): TNS run command broken with using --watch
* [Fixed #1740](https://github.com/NativeScript/nativescript-cli/issues/1740): Dev Dependencies (like Gulp, etc) getting built and build is failing because of which Gulp * [Fixed #](): integration is not working currently.
* [Fixed #2270](https://github.com/NativeScript/nativescript-cli/issues/2270): App is not rebuilt after removing plugin with native dependencies bug
* [Fixed #2253](https://github.com/NativeScript/nativescript-cli/issues/2253): Prepare command with bundle option doesn't copy files

**Livesync issues**

* [Fixed #2341](https://github.com/NativeScript/nativescript-cli/issues/2341): LiveSync after {N} update uses old app on the device
* [Fixed #2325](https://github.com/NativeScript/nativescript-cli/issues/2325): tns livesync ios --watch --emulator doesn't watch html or sass changes, only ts
* [Fixed #2221](https://github.com/NativeScript/nativescript-cli/issues/2221): Provision to watch files in symlinked directories for livesync command
* [Fixed #2267](https://github.com/NativeScript/nativescript-cli/issues/2267): Cannot run livesync with ios simulator

**Emulate/ Device issues**

* [Fixed #1522](https://github.com/NativeScript/nativescript-cli/issues/1522): Cannot specify emulator device while debugging
* [Fixed #2345](https://github.com/NativeScript/nativescript-cli/issues/2345): Option --device {DeviceName} not working for emulate/run/debug/deploy bug
* [Fixed #2344](https://github.com/NativeScript/nativescript-cli/issues/2344): Emulate command not working for iOS

**Debug issues**

* [Fixed #2315](https://github.com/NativeScript/nativescript-cli/issues/2315): tns debug ios --watch fails on newly created app if there is already deployed app with the same app id
* [Fixed #2292](https://github.com/NativeScript/nativescript-cli/issues/2292): "tns debug {platform} --watch" inconvenient behavior

**Console logging issues**

* [Fixed #2385](https://github.com/NativeScript/nativescript-cli/issues/2385): console line breaks in terminal are non existent Android bug
* [Fixed #2266](https://github.com/NativeScript/nativescript-cli/issues/2266): CLI crashes/stops responding after ~80 console.logs

**Other issues**
* [Fixed #1594](https://github.com/NativeScript/nativescript-cli/issues/1594): CLI does not respect shelljs errors
* [Fixed #2395](https://github.com/NativeScript/nativescript-cli/issues/2395): Error occurs when --justlaunch option used
* [Fixed #2379](https://github.com/NativeScript/nativescript-cli/issues/2379): Next release will be not backward compatbile with old proejcts.
* [Fixed #2370](https://github.com/NativeScript/nativescript-cli/issues/2370): Error: ENOENT: no such file or directory, chmod 'C:\Users\NSBUIL~1\AppData\Local\Temp\nsbuilduser\KillSwitches\cli'
* [Fixed #2240](https://github.com/NativeScript/nativescript-cli/issues/2240): Hooks inside app folder for template-hello-world-ng on tns create
* [Fixed #2228](https://github.com/NativeScript/nativescript-cli/issues/2228): Homebrew as root is no longer supported
* [Fixed #2227]( https://github.com/NativeScript/nativescript-cli/issues/2227): Remove use of lib/iOS folder for native plugins
* [Fixed #282]( https://github.com/NativeScript/nativescript-cli/issues/282): "tns platform add android --path TNSApp --symlink" does not work on Windows
* [Fixed #1802](https://github.com/NativeScript/nativescript-cli/issues/1802): semver copied to platforms/android even though it's a dev dependency

2.4.2 (2016, December 8)
==
### Fixed
* [Fixed #2332](https://github.com/NativeScript/nativescript-cli/pull/2332): Fixed email registration process

2.4.1 (2016, December 4)
==
### Fixed
* [Fixed #2200](https://github.com/NativeScript/nativescript-cli/pull/2200): TypeScript files don't show in {N} debugger.
* [Fixed #2273](https://github.com/NativeScript/nativescript-cli/pull/2273): Livesync should continue to work after app crash

2.4.0 (2016, November 16)
==
### New
* [Implemented #2071](https://github.com/NativeScript/nativescript-cli/issues/2071): Add device alias command
* [Implemented #1968](https://github.com/NativeScript/nativescript-cli/issues/1968): Add `tns devices` as synonym for `tns device`
* [Implemented #2067](https://github.com/NativeScript/nativescript-cli/issues/2067): Build, run, and livesync commands should support the teamid option
* [Implemented #2111](https://github.com/NativeScript/nativescript-cli/issues/2111): Prevent app folder updates when --bundle option used
* [Implemented #2129](https://github.com/NativeScript/nativescript-cli/issues/2129): Show typescript file row:column in CLI log when possible
* [Implemented #2128](https://github.com/NativeScript/nativescript-cli/issues/2128): Add option to subscribe to NativeScript email lists when installing CLI
* [Implemented #2027](https://github.com/NativeScript/nativescript-cli/issues/2027): Create tns update command
* [Implemented #2157](https://github.com/NativeScript/nativescript-cli/issues/2157): Add support for Node 7
* [Implemented #2151](https://github.com/NativeScript/nativescript-cli/issues/2151): Add snapshot plugin to project package.json
* [Implemented #2164](https://github.com/NativeScript/nativescript-cli/issues/2164): Deprecate support for Node 0.12
* [Implemented #2149](https://github.com/NativeScript/nativescript-cli/issues/2149): Implement incremental prepare

### Fixed
* [Fixed #2061](https://github.com/NativeScript/nativescript-cli/issues/2061): "Tns debug ios --watch" increase node processes after every change
* [Fixed #2081](https://github.com/NativeScript/nativescript-cli/issues/2081): List of all iOS devices produces an error
* [Fixed #2081](https://github.com/NativeScript/nativescript-cli/issues/2081): Check for iOS simulator and get full iOS logs on Mac
* [Fixed #2086](https://github.com/NativeScript/nativescript-cli/issues/2086): Stop calling npm install on each prepare of NG projects
* [Fixed #2087](https://github.com/NativeScript/nativescript-cli/issues/2087): Do not stop process when EPEERINVALID error is raised
* [Fixed #2088](https://github.com/NativeScript/nativescript-cli/issues/2088): Show helpful information when sync over WiFi error is detected
* [Fixed #2093](https://github.com/NativeScript/nativescript-cli/issues/2093): Fix getting iOS simulator device logs
* [Fixed #2094](https://github.com/NativeScript/nativescript-cli/issues/2094): "--framework-path" with no argument fails with "input.replace is not a function" message
* [Fixed #2056](https://github.com/NativeScript/nativescript-cli/issues/2056): Please let `tns` continue if it encounters a "does not satisfy its siblings' peerDependencies requirements!
* [Fixed #1980](https://github.com/NativeScript/nativescript-cli/issues/1980): Prepare does not work properly when plugin has only Android native implementaion
* [Fixed #1974](https://github.com/NativeScript/nativescript-cli/issues/1974): The plugin remove command fails with ENOENT
* [Fixed #2110](https://github.com/NativeScript/nativescript-cli/issues/2110): Prepare plugins without node_modules
* [Fixed #2072](https://github.com/NativeScript/nativescript-cli/issues/2072): First-time livesync fails on device
* [Fixed #2070](https://github.com/NativeScript/nativescript-cli/issues/2070): Tns debug Android --watch cannot be stopped with Ctrl + C command after a few changes in the code
* [Fixed #2152](https://github.com/NativeScript/nativescript-cli/issues/2152): Copy node_modules to platform on prepare (fix Node6/npm 3.x bug)
* [Fixed #2154](https://github.com/NativeScript/nativescript-cli/issues/2154): "tns device log" throws exception on real iOS devices
* [Fixed #2168](https://github.com/NativeScript/nativescript-cli/issues/2168): CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory
* [Fixed #2178](https://github.com/NativeScript/nativescript-cli/issues/2178): Running `tsc` after runing tests causes test execution to fail
* [Fixed #1398](https://github.com/NativeScript/nativescript-cli/issues/1398): CLI( tns ) Only can deploy first time to real iPhone device
* [Fixed #2155](https://github.com/NativeScript/nativescript-cli/issues/2155): CLI does not work with Node7
* [Fixed #1989](https://github.com/NativeScript/nativescript-cli/issues/1989): TNS and dependencies vs devdependencies

2.3.0 (2016, September 15)
==

### Fixed
* [Fixed #2034](https://github.com/NativeScript/nativescript-cli/issues/2034): Fixed: Cannot read property "targetNum" of undefined
* [Fixed #2028](https://github.com/NativeScript/nativescript-cli/issues/2028):Fixed: Android Custom Activities and TNS incompatibility
* [Fixed #2025](https://github.com/NativeScript/nativescript-cli/issues/2025):Fixed: Add support for Node.js 6.5
* [Fixed #2022](https://github.com/NativeScript/nativescript-cli/issues/2022):Fixed: LiveEdit restarts typescript projects
* [Fixed #1636](https://github.com/NativeScript/nativescript-cli/issues/1636):Fixed: The test android command fails to run tests

2.2.1 (2016, August 15)
==

### Fixed
* [Fixed #1985](https://github.com/NativeScript/nativescript-cli/issues/1985): Fixed: Livesync + debug on Android not working when there are changes in tns-core-modules.
* [Fixed #1993](https://github.com/NativeScript/nativescript-cli/issues/1993): Fixed: VisualStudio Code hangs when executing sync on iOS action.
* [Fixed #1994](https://github.com/NativeScript/nativescript-cli/issues/1985): Fixed: Livesync + debug syncs wrong files on Android.

2.2.0 (2016, August 10)
==

### New
* [Implemented #1959](https://github.com/NativeScript/nativescript-cli/issues/1959): XCode8/iOS10 support
* [Implemented #1948](https://github.com/NativeScript/nativescript-cli/issues/1948): npm WARN deprecated minimatch@0.2.14: Please update to minimatch 3.0.2 or higher to avoid a RegExp DoS issue
* [Implemented #1944](https://github.com/NativeScript/nativescript-cli/issues/1944): Enhancement: tns plugin INSTALL alias
* [Implemented #1565](https://github.com/NativeScript/nativescript-cli/issues/1565): Livesync debugging support
* [Implemented #526](https://github.com/NativeScript/nativescript-cli/issues/526): Update plugin command

### Fixed
* [Fixed #1958](https://github.com/NativeScript/nativescript-cli/issues/1958): CSS is not automatically livesynced in angular apps.
* [Fixed #1955](https://github.com/NativeScript/nativescript-cli/issues/1955): Livesync does not inform the user if no platforms are added but kills the process.
* [Fixed #1955](https://github.com/NativeScript/nativescript-cli/issues/1955): Livesync does not inform the user if no platforms are added but kills the process.
* [Fixed #1920](https://github.com/NativeScript/nativescript-cli/issues/1920): "tns debug ios" does not work.
* [Fixed #1912](https://github.com/NativeScript/nativescript-cli/issues/1912): "tns device run <bundle> --device <device>" noes no work.
* [Fixed #1909](https://github.com/NativeScript/nativescript-cli/issues/1909): "tns run android --emulator" deploy to device.
* [Fixed #1904](https://github.com/NativeScript/nativescript-cli/issues/1904): ERROR Provide a valid path to the desired application bundle.(with Device and Simulator running).
* [Fixed #1900](https://github.com/NativeScript/nativescript-cli/issues/1900): livesync EISDIR error when changing ".ts" file.
* [Fixed #1872](https://github.com/NativeScript/nativescript-cli/issues/1872): "tns livesync android" not updating application consistently.
* [Fixed #1508](https://github.com/NativeScript/nativescript-cli/issues/1508): Project with plugin variables does not build.
* [Fixed #1354](https://github.com/NativeScript/nativescript-cli/issues/1354): Livesync both Android and iOS at the same time, only android updates.

2.1.0 (2016, June 30)
==

### New
* [Implemented #1773](https://github.com/NativeScript/nativescript-cli/issues/1773): Show warning when livesync cannot reflect a change.
* [Implemented #1733](https://github.com/NativeScript/nativescript-cli/issues/1733): [node.js 6.x support] Native module sources is not supported.
* [Implemented #1731](https://github.com/NativeScript/nativescript-cli/issues/1731): Have the quick setup scripts create an AVD emulator.
* [Implemented #1650](https://github.com/NativeScript/nativescript-cli/issues/1650): Implement a shorthand --tsc option of the create command.
* [Implemented #1580](https://github.com/NativeScript/nativescript-cli/issues/1580): Add clean commands to tns.
* [Implemented #1517](https://github.com/NativeScript/nativescript-cli/issues/1517): Allow for apps to disable page reload livesyncs.

### Fixed
* [Fixed #1883](https://github.com/NativeScript/nativescript-cli/issues/1883): Live sync recompiles the app every time in iOS when run first time.
* [Fixed #1853](https://github.com/NativeScript/nativescript-cli/issues/1853): Flag when Android devices are out of storage.
* [Fixed #1826](https://github.com/NativeScript/nativescript-cli/issues/1826): Replace Local Maven repository for Support Libraries with Android Support Repository.
* [Fixed #1810](https://github.com/NativeScript/nativescript-cli/issues/1810): tns livesync android --emulator --watch fails when create new folder.
* [Fixed #1790](https://github.com/NativeScript/nativescript-cli/issues/1790): tns publish ios fails with cocoapods.
* [Fixed #1777](https://github.com/NativeScript/nativescript-cli/issues/1777): Invalid XML kills livesync.
* [Fixed #1776](https://github.com/NativeScript/nativescript-cli/issues/1776): UnitTest app is packed within the published application which increases the size of the application.
* [Fixed #1770](https://github.com/NativeScript/nativescript-cli/issues/1770): "tns livesync ios --watch" doesn't sync changes if pacakgeId and folder name does not match.
* [Fixed #1752](https://github.com/NativeScript/nativescript-cli/issues/1752): Use spaces instead of tabs in package.json for consistency with npm.
* [Fixed #1746](https://github.com/NativeScript/nativescript-cli/issues/1746): Remove node_modules after preparing plugins.
* [Fixed #1739](https://github.com/NativeScript/nativescript-cli/issues/1739): NativeScript 2.0 warning needs to reference how to install updated cocoapods when xcode 7.3 supported version of pods is released.
* [Fixed #1734](https://github.com/NativeScript/nativescript-cli/issues/1734): ios builds with 2.0.0: Processing node_modules failed. TypeError: Cannot read property 'split' of null.
* [Fixed #1732](https://github.com/NativeScript/nativescript-cli/issues/1732): TNS 2.00 & Macintosh without Java/Android configured.
* [Fixed #1727](https://github.com/NativeScript/nativescript-cli/issues/1727): [Angular] Improve livesync performance for iOS.
* [Fixed #1725](https://github.com/NativeScript/nativescript-cli/issues/1725): Ctrl + C shortcut does not stop the livesync ios --watch command.
* [Fixed #1652](https://github.com/NativeScript/nativescript-cli/issues/1652): Analytics for OS X version.
* [Fixed #1620](https://github.com/NativeScript/nativescript-cli/issues/1620): Unable to debug on iOS using the --device option.
* [Fixed #1571](https://github.com/NativeScript/nativescript-cli/issues/1571): Livesync ios is not working when dependency has executable.
* [Fixed #1481](https://github.com/NativeScript/nativescript-cli/issues/1481): LiveSync doesn't show any changes to a modal page.
* [Fixed #1376](https://github.com/NativeScript/nativescript-cli/issues/1376): Consider removing --debug-brk parameter.
* [Fixed #1296](https://github.com/NativeScript/nativescript-cli/issues/1296): tns build breaks permanately if you have drawable-invalid name.
* [Fixed #485](https://github.com/NativeScript/nativescript-cli/issues/485): Platform specific prepare breaks source map paths.

2.0.1 (2016, May 18)
==
### Fixed
* [Fixed #1746](https://github.com/NativeScript/nativescript-cli/issues/1746): Remove node_modules after preparing plugins.
* [Fixed #1741](https://github.com/NativeScript/nativescript-cli/issues/1741): Cocoapods problem in tns doctor.

2.0.0 (2016, April 28)
==

### New
* [Implemented #1262](https://github.com/NativeScript/nativescript-cli/issues/1262): LiveSync with console.log support for iOS simulators.
* [Implemented #1431](https://github.com/NativeScript/nativescript-cli/issues/1431): `tns doctor` should warn about new versions of NativeScript components.
* [Implemented #1595](https://github.com/NativeScript/nativescript-cli/issues/1595): Provide a shorthand for starting Angular 2 apps (`--ng`).
* [Implemented #1665](https://github.com/NativeScript/nativescript-cli/issues/1665): Add command for searching nativescript plugins.

### Fixed
* [Fixed #1203](https://github.com/NativeScript/nativescript-cli/issues/1203): Forbid creating projects with names starting with number.
* [Fixed #1419](https://github.com/NativeScript/nativescript-cli/issues/1419): Cannot find module `colors` during uninstall.
* [Fixed #1504](https://github.com/NativeScript/nativescript-cli/issues/1504): Avoid NPM warnings on the create command .
* [Fixed #1526](https://github.com/NativeScript/nativescript-cli/issues/1526): Executing `tns platform add <platform>` prints command help when platform is already added.
* [Fixed #1532](https://github.com/NativeScript/nativescript-cli/issues/1532): `tns livesync ios --watch` doesn't sync js changes if pacakgeId and folder name does not match.
* [Fixed #1611](https://github.com/NativeScript/nativescript-cli/issues/1611): Unable to build a project with CocoaPods version: `1.0.0.beta.x`.
* [Fixed #1639](https://github.com/NativeScript/nativescript-cli/issues/1639): Fix compatibility with XCode 7.3
* [Fixed #1674](https://github.com/NativeScript/nativescript-cli/issues/1674): Can't build ios project is cocoapods is not installed.
* [Fixed #1689](https://github.com/NativeScript/nativescript-cli/issues/1689): Executing `tns run android` fails to deploy app on new Android emulator.

1.7.1 (2016, March 30)
==

### New
* [Implemented #1634](https://github.com/NativeScript/nativescript-cli/issues/1634): Replace plugin variables in all .xml files of android's plugin code.

### Fixed
* [Fixed #1610](https://github.com/NativeScript/nativescript-cli/issues/1610): `tns plugin add <plugin>` has issues with postinstall scripts.
* [Fixed #1610](https://github.com/NativeScript/nativescript-cli/issues/1612): Unable to execute unit tests on iOS Simulator in some cases.
* [Fixed #1619](https://github.com/NativeScript/nativescript-cli/issues/1619): Wrong error message on installation (or `tns doctor` command).
* [Fixed #1625](https://github.com/NativeScript/nativescript-cli/issues/1625): Double navigation when showing unit test results.

1.7.0 (2016, March 16)
==

### Breaking
* Minimum required Android Build-tools version is set to 23.0.0 due to some changes in Android SDK. CLI will not allow building your application for Android in case you do not have at least this version installed.
* Minimum required Windows version is now Windows 7 SP1.

### New
* [Implemented #1172](https://github.com/NativeScript/nativescript-cli/issues/1172): Add `tns publish ios` command.
* [Implemented #1514](https://github.com/NativeScript/nativescript-cli/issues/1514): Use custom native project templates.
* [Implemented #1563](https://github.com/NativeScript/nativescript-cli/issues/1563): Install runtime by npm tagname.

### Fixed
* [Fixed #1081](https://github.com/NativeScript/nativescript-cli/issues/1081): CLI LiveSync command conflicts with Android Studio.
* [Fixed #1416](https://github.com/NativeScript/nativescript-cli/issues/1416): Livesync does not work when `/data/local/tmp/<app-identifier>` file exists on Android device.
* [Fixed #1541](https://github.com/NativeScript/nativescript-cli/issues/1541): Plugin remove fails if plugin version is not available in npm.
* [Fixed #1576](https://github.com/NativeScript/nativescript-cli/issues/1576): `tns run android` just starts emulator but does not deploy app on it when no devices are attached.

1.6.2 (2016, March 2)
==

### Fixed
* [Fixed #1313](https://github.com/NativeScript/nativescript-cli/issues/1313): `tns livesync <platform> --watch` is not working for changed platform specific files.
* [Fixed #1513](https://github.com/NativeScript/nativescript-cli/issues/1513): `tns test <platform>` does not work in case the application is not installed on the device.
* [Fixed #1555](https://github.com/NativeScript/nativescript-cli/issues/1555): CLI installs beta versions of runtimes in case they are published in npm.

1.6.1 (2016, February 19)
==

### Fixed
* [Fixed #1499](https://github.com/NativeScript/nativescript-cli/issues/1499): `livesync --watch` fails for TypeScript projects with `sourceMaps` enabled.
* [Fixed #1503](https://github.com/NativeScript/nativescript-cli/issues/1503): Livesync fails to install app on multiple devices.

1.6.0 (2016, February 17)
==

### Breaking
* CLI requires full `AndroidManifest.xml` in `app/App_Resources/Android`. Any project which already has such manifest will be upgraded on prepare command.
The existing `AndroidManifest.xml` will be renamed and default manifest will be extracted. You will have to merge the files manually.
* Remove support for `tns library add` command.
* Remove support for `ant` builds.

### New
* [Implemented #374](https://github.com/NativeScript/nativescript-cli/issues/374): Add support for different templates by using `--template` option for `tns create` command.
* [Implemented #625](https://github.com/NativeScript/nativescript-cli/issues/625): A script to set up Mac machine for developing with NativeScript.
* [Implemented #921](https://github.com/NativeScript/nativescript-cli/issues/921): Initial LiveSync is extremly slow if the project has thousands of files.
* [Implemented #952](https://github.com/NativeScript/nativescript-cli/issues/952): Add `--sdk` option to specify SDK version of iOS Simulator.
* [Implemented #1026](https://github.com/NativeScript/nativescript-cli/issues/1026): Out of the box support for application id in plugins.
* [Implemented #1089](https://github.com/NativeScript/nativescript-cli/issues/1089): Allow full `Info.plist` and `AndroidManifest.xml` files to be placed in `app/App_Resources/<platform>`.
* [Implemented #1239](https://github.com/NativeScript/nativescript-cli/issues/1239): Remove support for `library add` command.
* [Implemented #1243](https://github.com/NativeScript/nativescript-cli/issues/1243): Fast livesync for images in `app` directory.
* [Implemented #1294](https://github.com/NativeScript/nativescript-cli/issues/1294): `tns doctor` should check CocoaPods/Ruby version.
* [Implemented #1302](https://github.com/NativeScript/nativescript-cli/issues/1302): Add command for generating html help pages - `dev-generate-help`.
* [Implemented #1329](https://github.com/NativeScript/nativescript-cli/issues/1329): `tns device` to show status of connected devices.
* [Implemented #1338](https://github.com/NativeScript/nativescript-cli/issues/1338): Remove the requirement for external watchers.
* [Implemented #1363](https://github.com/NativeScript/nativescript-cli/issues/1363): Support debug commands with `--no-client` argument.
* [Implemented #1375](https://github.com/NativeScript/nativescript-cli/issues/1375): Improve the output of `tns debug android --get-port`.
* [Implemented #1382](https://github.com/NativeScript/nativescript-cli/issues/1382): Show a progress indicator when downloading platforms.
* [Implemented #1412](https://github.com/NativeScript/nativescript-cli/issues/1412): Store settings in the Roaming Windows profile.
* [Implemented #1420](https://github.com/NativeScript/nativescript-cli/issues/1420): Log how often CLI users "opt out" of CLI usage tracking.
* [Implemented #1440](https://github.com/NativeScript/nativescript-cli/issues/1440): Show loading indicator when an exception is tracked.
* [Implemented #1486](https://github.com/NativeScript/nativescript-cli/issues/1486): Implement Android debugging with unix sockets redirection.

### Fixed
* [Fixed #575](https://github.com/NativeScript/nativescript-cli/issues/575): Plugin remove does not work with `--path` option.
* [Fixed #1027](https://github.com/NativeScript/nativescript-cli/issues/1027): Prepare android/ios command prepares both platforms when added.
* [Fixed #1236](https://github.com/NativeScript/nativescript-cli/issues/1236): The command `tns device log` prints only the log of the app on Android.
* [Fixed #1237](https://github.com/NativeScript/nativescript-cli/issues/1237): `tns livesync --watch` fails when ios device is not attached and simulator is running.
* [Fixed #1292](https://github.com/NativeScript/nativescript-cli/issues/1292): Livesync fails when using typescript in VisualStudio.
* [Fixed #1307](https://github.com/NativeScript/nativescript-cli/issues/1307): Infinite loop when trying to validate xml.
* [Fixed #1315](https://github.com/NativeScript/nativescript-cli/issues/1315): LiveSync does not respect deleted files on some android devices.
* [Fixed #1328](https://github.com/NativeScript/nativescript-cli/issues/1328): Terminal hangs if tns device is run and there is an untrusted iPhone connected.
* [Fixed #1332](https://github.com/NativeScript/nativescript-cli/issues/1332): Application entry point file not found... when using livesync (android).
* [Fixed #1337](https://github.com/NativeScript/nativescript-cli/issues/1337): Syntax error in a babel source crashes livesync watch.
* [Fixed #1339](https://github.com/NativeScript/nativescript-cli/issues/1339): LiveSync watch breaks when deleting a folder and then adding a new file|folder on OS X.
* [Fixed #1360](https://github.com/NativeScript/nativescript-cli/issues/1360): Missing iOS console logs in some cases.
* [Fixed #1386](https://github.com/NativeScript/nativescript-cli/issues/1386): Unit tests crash on Android emulator.
* [Fixed #1401](https://github.com/NativeScript/nativescript-cli/issues/1401): Unit testing: `tns test android` command hangs.
* [Fixed #1403](https://github.com/NativeScript/nativescript-cli/issues/1403): `tns deploy ios --release` command prints incorrect message.
* [Fixed #1428](https://github.com/NativeScript/nativescript-cli/issues/1428): XCode v7.2+ Fails with Cocoapods on emulator.
* [Fixed #1437](https://github.com/NativeScript/nativescript-cli/issues/1437): `tns debug android --emulator` does not stop at the app initial breakpoint.
* [Fixed #1455](https://github.com/NativeScript/nativescript-cli/issues/1455): CLI not supporting a project path having a spaces.

1.5.2 (2015, December 12)
==
### New
* [Implemented #1247](https://github.com/NativeScript/nativescript-cli/issues/1247): Do not kill adb server if possible.

### Fixed
* [Fixed #956](https://github.com/NativeScript/nativescript-cli/issues/956): Better error reporting for deploy on device.
* [Fixed #1210](https://github.com/NativeScript/nativescript-cli/issues/1210): LiveSync does not handle correctly removed files on iOS simulator.
* [Fixes #1308](https://github.com/NativeScript/nativescript-cli/issues/1308): Livesync ends up with an endless loop for projects that have before-prepare hook that changes some project file.

1.5.1 (2015, December 03)
==
### New
* [Implemented #452](https://github.com/NativeScript/nativescript-cli/issues/452): Build should report malformed XML.
* [Implemented #1263](https://github.com/NativeScript/nativescript-cli/issues/1263): Add timestamps to LiveSync messages.

### Fixed
* [Fixed #1234](https://github.com/NativeScript/nativescript-cli/issues/1234): LiveSync does not work for iOS platform specific .xml/.css files on iOS Simulator.
* [Fixed #1242](https://github.com/NativeScript/nativescript-cli/issues/1242): `ANDROID_HOME environment variable is not set correctly` error is thrown when `tns run ios --log trace` command is executed.
* [Fixed #1245](https://github.com/NativeScript/nativescript-cli/issues/1245): `TypeError: Cannot read property 'match' of null` error is thrown on various commands.
* [Fixed #1246](https://github.com/NativeScript/nativescript-cli/issues/1246): LiveSync on android device is throwing ENAMTOOLONG error on Windows.
* [Fixed #1253](https://github.com/NativeScript/nativescript-cli/issues/1253): iOS debugger does not work with iOS Simulator with Xcode7+.
* [Fixed #1268](https://github.com/NativeScript/nativescript-cli/issues/1268): Hook failures treated as bad user input.

1.5.0 (2015, November 24)
==

### New
* [Implemented #493](https://github.com/NativeScript/nativescript-cli/issues/493): Enable transpilers support in NativeScript projects.
* [Implemented #594](https://github.com/NativeScript/nativescript-cli/issues/594): Implement a hard dependency on the node.js version and exit if not satisfied.
* [Implemented #684](https://github.com/NativeScript/nativescript-cli/issues/684): Enable commands hooks.
* [Implemented #955](https://github.com/NativeScript/nativescript-cli/issues/955): Support for Xcode7 simulator.
* [Implemented #1007](https://github.com/NativeScript/nativescript-cli/issues/1007): Smarter and faster LiveSync.
* [Implemented #1048](https://github.com/NativeScript/nativescript-cli/issues/1048): Support Gradle files from plugins, merge android resource files using aapt and respect AndroidManifest.xml from App_Resources.
* [Implemented #1113](https://github.com/NativeScript/nativescript-cli/issues/1113): Let users create and execute unit tests in their projects.
* [Implemented #1117](https://github.com/NativeScript/nativescript-cli/issues/1117): Support for TypeScript-based NativeScript projects.
* [Implemented #1130](https://github.com/NativeScript/nativescript-cli/issues/1130): Show application output from livesync command for iOS devices and android devices and emulators.
* [Implemented #1164](https://github.com/NativeScript/nativescript-cli/issues/1164): Use android tools from ANDROID_HOME.
* [Implemented #1229](https://github.com/NativeScript/nativescript-cli/issues/1229): Support for Node 5.1.0.

### Fixed
* [Fixed #727](https://github.com/NativeScript/nativescript-cli/issues/727): Double logging with tns run ios.
* [Fixed #1044](https://github.com/NativeScript/nativescript-cli/issues/1044): iOS debug break on Simulator causes app crash when the debugger is paused on the first line for a long time.
* [Fixed #1086](https://github.com/NativeScript/nativescript-cli/issues/1086): --key-store-path option to look for the keystore file path relative to the app root.
* [Fixed #1106](https://github.com/NativeScript/nativescript-cli/issues/1106): Livesync double restarts for TS projects.
* [Fixed #1110](https://github.com/NativeScript/nativescript-cli/issues/1110): `tns doctor` command should detect invalid java version.
* [Fixed #1167](https://github.com/NativeScript/nativescript-cli/issues/1167): `tns run`, `tns emulate` and `tns deploy` commands do not check if device is available before build.
* [Fixed #1177](https://github.com/NativeScript/nativescript-cli/issues/1177): `tns run` command fails when multiple devices with same platform are attached.
* [Fixed #1185](https://github.com/NativeScript/nativescript-cli/issues/1185): `tns device` command fails when VS Emulator is running.
* [Fixed #1204](https://github.com/NativeScript/nativescript-cli/issues/1204): Incorrect prepare when using npm 3.x.

1.4.3 (2015, October 21)
==

### New
* [Implemented #883](https://github.com/NativeScript/nativescript-cli/issues/883): Support xcconfig file from plugin.
* [Implemented #958](https://github.com/NativeScript/nativescript-cli/issues/958): Support for Node 4.2.1+.
* [Implemented #1065](https://github.com/NativeScript/nativescript-cli/issues/1065): Support sandbox-pod.

### Fixed
* [Fixed #1031](https://github.com/NativeScript/nativescript-cli/issues/1031): Command emulate android after LiveSync starts the last synced app on the emulator.
* [Fixed #1044](https://github.com/NativeScript/nativescript-cli/issues/1044): iOS debug break on Simulator causes app crash when the debugger is paused on the first line for a long time.
* [Fixed #1054](https://github.com/NativeScript/nativescript-cli/issues/1054): ENOENT error is thrown when `tns platform add ios` command is executed.
* [Fixed #1066](https://github.com/NativeScript/nativescript-cli/issues/1066): Merge Info.plist fails second build.
* [Fixed #1080](https://github.com/NativeScript/nativescript-cli/issues/1080): Using --symlink for android runtime is modifying the original one.

1.4.2 (2015, October 15)
==

### Fixed
* [Fixed #1041](https://github.com/NativeScript/nativescript-cli/issues/1041): Unable to run the application when project root directory is renamed.

1.4.0 (2015, October 07)
==

### Breaking
* Application cannot be built with android-21 SDK. You need at least android-22 SDK in order to build or run your application on connected device or in emulator.

### New
* [Implemented #685](https://github.com/NativeScript/nativescript-cli/issues/685): Support static libraries in plugins for iOS.
* [Implemented #923](https://github.com/NativeScript/nativescript-cli/issues/923): Ability to specify android debug ui on Windows and Linux.
* [Implemented #927](https://github.com/NativeScript/nativescript-cli/issues/927): Support compileSdk option for android build.
* [Implemented #935](https://github.com/NativeScript/nativescript-cli/issues/935): Android 6.0 support.
* [Implemented #949](https://github.com/NativeScript/nativescript-cli/issues/949): `tns doctor` command checks if CocoaPods are not installed or old CocoaPods version is used.

### Fixed
* [Fixed #393](https://github.com/NativeScript/nativescript-cli/issues/393): Unable to build when app contains .gz file.
* [Fixed #748](https://github.com/NativeScript/nativescript-cli/issues/748): Debug --stop option does not detach the debug tools.
* [Fixed #936](https://github.com/NativeScript/nativescript-cli/issues/936): javac version is not getting properly extracted in case of open jdk systems.
* [Fixed #941](https://github.com/NativeScript/nativescript-cli/issues/941): `tns doctor` command reports Ant is not installed.
* [Fixed #942](https://github.com/NativeScript/nativescript-cli/issues/942): Updating some files in App_Resources kills livesync.
* [Fixed #943](https://github.com/NativeScript/nativescript-cli/issues/943): `tns run android` or `tns debug android` after `tns livesync android` starts the last synced app on the android device with api level 21 or greater.
* [Fixed #944](https://github.com/NativeScript/nativescript-cli/issues/944): Using CocosPods does not update the app deployment target to iOS 8.
* [Fixed #947](https://github.com/NativeScript/nativescript-cli/issues/947): Creash for missing module at runtime after upgrade a project from 1.2.0 version to 1.3.0 version.
* [Fixed #961](https://github.com/NativeScript/nativescript-cli/issues/961): `tns build` command crashes when NativeScript CLI is added as dev dependency to project.
* [Fixed #977](https://github.com/NativeScript/nativescript-cli/issues/977): `tns livesync <Platform> --watch` installs the application on the device on every change.
* [Fixed #989](https://github.com/NativeScript/nativescript-cli/issues/989): `tns doctor` command is failing when installed Gradle version contains more than 2 numbers.
* [Fixed #1018](https://github.com/NativeScript/nativescript-cli/issues/1018): ProjectName is incorrect in settings.gradle when projectDir name is different from projectId.
* [Fixed #1019](https://github.com/NativeScript/nativescript-cli/issues/1019): Check if shasum is correct for all cached packages.

1.3.0 (2015, September 16)
==

### Breaking

`library add` command is deprecated and will be removed completely in one of our next releases (currently scheduled for 1.5).
You cannot create NativeScript plugins with Android native code using Eclipse projects. You need to import your Eclipse project into Android Studio, convert it to Gradle build and consume the produced AAR file.
You cannot use Apache Ant to create new projects for Android but you can continue build your existing Ant-based projects. Starting with NativeScript 1.3, Android builds require Gradle. Run `tns doctor` on the command line to learn more.
Building NativeScript projects for Android requires Android SDK 22, Android SDK Build-tools 22, Android Support Repository and ANDROID_HOME environment variable set. Run `android` to configure Android SDK.

### New
* [Implemented #390](https://github.com/NativeScript/nativescript-cli/issues/390): Support tns_modules from npm.
* [Implemented #686](https://github.com/NativeScript/nativescript-cli/issues/686): Support building of XCode workspaces.
* [Implemented #687](https://github.com/NativeScript/nativescript-cli/issues/687): Android build with Gradle.
* [Implemented #729](https://github.com/NativeScript/nativescript-cli/issues/729): CocoaPods support from plugins.
* [Implemented #785](https://github.com/NativeScript/nativescript-cli/issues/785): Add platform on each platform related command.
* [Implemented #875](https://github.com/NativeScript/nativescript-cli/issues/875): Init command configure tns-core-modules version.

### Fixed
* [Fixed #662](https://github.com/NativeScript/nativescript-cli/issues/662): Failed `tns platform add android` command leaves the project in inconsistent state.
* [Fixed #730](https://github.com/NativeScript/nativescript-cli/issues/730): `tns livesync android` throws stdout maxBuffer exceeded.
* [Fixed #772](https://github.com/NativeScript/nativescript-cli/issues/772): `tns platform update ios` command does not update metadata generator.
* [Fixed #793](https://github.com/NativeScript/nativescript-cli/issues/793): The NativeScript CLI writes errors on stdout.
* [Fixed #797](https://github.com/NativeScript/nativescript-cli/issues/797): Plugin add does not merge plugins's Info.plist file.
* [Fixed #811](https://github.com/NativeScript/nativescript-cli/issues/811): `tns livesync <Platform> --watch` reports an error when platform specific file is changed.
* [Fixed #826](https://github.com/NativeScript/nativescript-cli/issues/826): Failed `tns prepare <Platform>` command leaves the project in inconsistent state.
* [Fixed #829](https://github.com/NativeScript/nativescript-cli/issues/829): Fail to build the project when `nativescript-telerik-ui` plugin is added before the platform.
* [Fixed #866](https://github.com/NativeScript/nativescript-cli/issues/866): The NativeScript CLI is not able to detect java on Ubuntu.
* [Fixed #896](https://github.com/NativeScript/nativescript-cli/issues/896): `tns run <Platform>` after `tns livesync <Platform>` starts the last synced app on the device.

1.2.4 (2015, August 24)
==

### Fixed

* [Fixed #806](https://github.com/NativeScript/nativescript-cli/issues/806): `tns library add android` command does not execute android project update if target 17 is not installed.
* [Fixed #807](https://github.com/NativeScript/nativescript-cli/issues/807): Android native libs are not respected correctly if the plugin is added as depedency to another plugin.

1.2.3 (2015, August 18)
==

### Fixed

* [Fixed #776](https://github.com/NativeScript/nativescript-cli/issues/776): `tns livesync ios --emulator --watch` doesn't sync changes.
* [Fixed #777](https://github.com/NativeScript/nativescript-cli/issues/777): `tns library add ios` does not build correct relative paths to referenced frameworks for mdgenerator.
* [Fixed #779](https://github.com/NativeScript/nativescript-cli/issues/779): Command failed due to space in library reference path.

1.2.2 (2015, August 11)
==

### New
* [Implemented #470](https://github.com/NativeScript/nativescript-cli/issues/470): Add `--timeout` option to `tns debug`.
* [Implemented #682](https://github.com/NativeScript/nativescript-cli/issues/682): Set `--debug-brk` as the default option of `tns debug`.
* [Implemented #706](https://github.com/NativeScript/nativescript-cli/issues/706): LiveSync to iOS Simulator.

### Fixed

* [Fixed #470](https://github.com/NativeScript/nativescript-cli/issues/470): Command failed due to space in file path.
* [Fixed #632](https://github.com/NativeScript/nativescript-cli/issues/632): Android debugger does not work on some OS X systems.
* [Fixed #652](https://github.com/NativeScript/nativescript-cli/issues/652): `tns debug ios` does not load inspector from the added iOS runtime.
* [Fixed #663](https://github.com/NativeScript/nativescript-cli/issues/663): Verify that Java is at least 1.7.
* [Fixed #671](https://github.com/NativeScript/nativescript-cli/issues/671): `tns debug ios` doesn't work for projects created with framework versions earlier than 1.2.0.
* [Fixed #679](https://github.com/NativeScript/nativescript-cli/issues/679): `tns library add ios` adds the framework with its full path in the Xcode project.
* [Fixed #695](https://github.com/NativeScript/nativescript-cli/issues/695): Exceptions tracking is not correctly set in the user settings.
* [Fixed #699](https://github.com/NativeScript/nativescript-cli/issues/699): Unable to update Android platform when npm cache is in an inconsistent state.
* [Fixed #722](https://github.com/NativeScript/nativescript-cli/issues/722): `tns debug` builds and installs the app twice.
* [Fixed #742](https://github.com/NativeScript/nativescript-cli/issues/742): `tns livesync android` doesn't work on some Android devices.
* [Fixed #747](https://github.com/NativeScript/nativescript-cli/issues/747): New files are not respected by `tns livesync`.

1.2.1 (2015, July 27)
==

### Fixed

* [Fixed #690](https://github.com/NativeScript/nativescript-cli/issues/690): The `$ tns debug ios --debug-brk` command does not work.

1.2.0 (2015, July 24)
==

### New

* [Implemented #621](https://github.com/NativeScript/nativescript-cli/issues/621): Added the `$ tns error-reporting` command. By default, anonymous error reporting is enabled.
* [Implemented #620](https://github.com/NativeScript/nativescript-cli/issues/620): Renamed the `$ tns feature-usage-tracking` command to `$ tns usage-reporting`. By default, anonymous usage reporting is enabled.
* [Implemented #523](https://github.com/NativeScript/nativescript-cli/issues/523): Added the `$ tns livesync <Platform>` command. You can use it to quickly synchronize changes to connected devices without re-building and re-deploying your apps.
* [Implemented #510](https://github.com/NativeScript/nativescript-cli/issues/510): Improvements and updates to the `$ tns plugin` sets of commands.
	* You can create and work with custom NativeScript plugins which contain Android native libraries.
	* You can create and work with custom NativeScript plugins which contain iOS dynamic native libraries.
	* The `$ tns plugin remove` command removes the Android native libraries carried by the plugin.
* [Implemented #480](https://github.com/NativeScript/nativescript-cli/issues/480): Added the `$ tns doctor` command. You can use it to quickly check for any configuration issues which might prevent the NativeScript CLI from working properly.

### Fixed

* [Fixed #658](https://github.com/NativeScript/nativescript-cli/issues/658): The `$ tns platform remove` command does not remove framework data from `package.json` for the project.
* [Fixed #644](https://github.com/NativeScript/nativescript-cli/issues/644): You cannot build your app for Android, if it contains a custom `styles.xml`.
* [Fixed #632](https://github.com/NativeScript/nativescript-cli/issues/632): On OS X systems with custom Chrome builds, you cannot debug Android apps. To be able to debug Android apps, you need to set the name of the custom Chrome build in the `ANDROID_DEBUG_UI_MAC` setting in `config.json`.
* [Fixed #629](https://github.com/NativeScript/nativescript-cli/issues/629): The `$ tns prepare` command does not populate the platform-specific directories correctly, if your project contains both an npm module, installed using `$ npm install`, and a NativeScript plugin, installed using `$ tns plugin add`.
* [Fixed #574](https://github.com/NativeScript/nativescript-cli/issues/574): The `$ tns prepare ios` command does not preserve file name casing when populating the platform-specific directories.
* [Fixed #538](https://github.com/NativeScript/nativescript-cli/issues/538): The NativeScript CLI interprets files whose names contain `ios` or `android` as platform-specific files and renames them, even if they are not platform-specific.
* [Fixed #281](https://github.com/NativeScript/nativescript-cli/issues/281): The `$ tns platform remove` command does not print any status message when the operation is successful.
* [Fixed #271](https://github.com/NativeScript/nativescript-cli/issues/271): The `$ tns create` command does not validate the path provided with the `--copy-from` option.
* [Fixed #139](https://github.com/NativeScript/nativescript-cli/issues/139): The `$ tns prepare` command does not remove files from the platform-specific directories correctly.

1.1.2 (2015, July 2)
==

### New

* [Implemented #600](https://github.com/NativeScript/nativescript-cli/issues/600): Added the `$ tns init` command. You can use it to initialize a NativeScript project for development. The command recreates or updates the `package.json` file of the project. You can then run `$ tns install` to install the platforms and dependencies described in the `package.json` file.
* [Implemented #587](https://github.com/NativeScript/nativescript-cli/issues/587): Added the `$ tns install` command. You can use it to quickly install all platforms and dependencies described in a `package.json` file.

### Fixed

* [Fixed #606](https://github.com/NativeScript/nativescript-cli/issues/606): The NativeScript CLI lets you run `<Platform>`-based commands on operating systems which do not support development for this platform. For example, you can run `$ tns build ios` on a Windows system.
* [Fixed #601](https://github.com/NativeScript/nativescript-cli/issues/601): The NativeScript CLI does not treat the dependencies of devDependencies as devDependencies.
* [Fixed #599](https://github.com/NativeScript/nativescript-cli/issues/599): The NativeScript CLI always creates a `tmp` directory in the current directory when you run any command and modifies the `package.json` file for the project.
* [Fixed #584](https://github.com/NativeScript/nativescript-cli/issues/584): The NativeScript CLI references the files in the project with their absolute paths instead of their relative paths. This might cause the project to stop working when transfered to another location and might cause issues with your application packages.
* [Fixed #578](https://github.com/NativeScript/nativescript-cli/issues/578): Platform-specific files in NativeScript plugins are not processed correctly. The NativeScript CLI copies them to the correct platform-specific directory but does not rename them correctly.
* [Fixed #520](https://github.com/NativeScript/nativescript-cli/issues/520): iOS resources from the `App_Resources` folder are not included in the native Xcode project and are not accessible in the application package.

1.1.1 (2015, June 17)
==

### New

* [Implemented #551](https://github.com/NativeScript/nativescript-cli/issues/551): You can now develop for Android 5.1.1 (API Level 22). If you have this SDK installed on your system, the CLI will set it as the default target SDK when you run `$ tns platform add android`
* [Implemented #552](https://github.com/NativeScript/nativescript-cli/issues/552): You can now set the target Android SDK for your project by specifying the `--sdk ` option for `$ tns platform add android` operations.

### Fixed

* [Fixed #555](https://github.com/NativeScript/nativescript-cli/issues/555): In some cases, the CLI merges incorrectly the plugin platform-specific `AndroidManifest.xml` or `Info.plist` with the respective platform-specific configuration files from the project.
* [Fixed #567](https://github.com/NativeScript/nativescript-cli/issues/567): You cannot use npm as a package manager inside your project.
* [Fixed #569](https://github.com/NativeScript/nativescript-cli/issues/569): On some Windows systems, the CLI installation shows errors in the console.

1.1.0 (2015, June 10)
==

### Breaking

* Replaced `.tnsproject` with `package.json` to let you use npm and work with custom plugins in your project.<br/>The first time you run any NativeScript command on an existing project, your `.tnsproject` file will be automatically transformed into a `package.json` file describing your project configuration and data. After this, make sure to commit and push your changes if you are using version control.<br/>After the transformation is complete, you can install and use custom NativeScript plugins inside your project.

### New

* [Implemented #510](https://github.com/NativeScript/nativescript-cli/issues/510): You can work with custom NativeScript plugins in your project. You can add a plugin from an npm package, a local folder, a URL or a `.tar.gz` file. For more information, run `$ tns help plugin`
* [Implemented #362](https://github.com/NativeScript/nativescript-cli/issues/362): You can use npm as package manager for your NativeScript projects.

### Updated

* [Updated #358](https://github.com/NativeScript/nativescript-cli/issues/358): Multiple improvements and bug fixes for iOS debugging.

### Fixed

* [Fixed #446](https://github.com/NativeScript/nativescript-cli/issues/446): Autocompletion might continue to work after disabling because `tns autocomplete disable` does not update `.profile` files.
* [Fixed #391](https://github.com/NativeScript/nativescript-cli/issues/391): The default 9-patch image for Android projects is malformed and causes error messages in the build log.
* [Fixed #324](https://github.com/NativeScript/nativescript-cli/issues/324): When you run commands for the `ios` platform, the NativeScript CLI might show the following unrelated adb warning: `Unable to find adb in PATH. Default one from %s resources will be used.`
* [Fixed #309](https://github.com/NativeScript/nativescript-cli/issues/309): You cannot open the device log for streaming with the `tns device log` command.

1.0.2 (2015, May 27)
==

### Fixed

* [Fixed #498](https://github.com/NativeScript/nativescript-cli/issues/498): On some Linux and OS X systems, when the USER or SUDO_USER environment variables are missing, you cannot run NativeScript CLI commands. The following error appears when you attempt to run `nativescript` or `tns` commands: `TypeError: Arguments to path.join must be strings`.

1.0.1 (2015, May 8)
==

### Fixed

* [Fixed #459](https://github.com/NativeScript/nativescript-cli/issues/459): You cannot add a third-party iOS native library to your project, if the path to the library contains spaces.
* [Fixed #458](https://github.com/NativeScript/nativescript-cli/issues/458): If you have installed Xcode 6.2 or earlier on your system, you cannot debug in the iOS Simulator.
* [Fixed #413](https://github.com/NativeScript/nativescript-cli/issues/413): If your project name contains a hyphen, the NativeScript CLI sets your application identifier inconsistently across the project.

1.0.0 (2015, April 28)
==

### New

* [Implemented #447](https://github.com/NativeScript/nativescript-cli/issues/447): `tns run ios`, `tns run android` and `tns emulate android` print the output of the running application in the console.
* [Implemented #441](https://github.com/NativeScript/nativescript-cli/issues/441): Improved command-line completion.
* [Implemented #416](https://github.com/NativeScript/nativescript-cli/issues/416): Improved installation.
* [Implemented #358](https://github.com/NativeScript/nativescript-cli/issues/358): Improved `tns debug ios`.

### Fixed

* [Fixed #446](https://github.com/NativeScript/nativescript-cli/issues/446): `tns autocomplete disable` might not disable command-line completion properly.
* [Fixed #445](https://github.com/NativeScript/nativescript-cli/issues/445): For some commands, HTML help is shown instead of the console help.
* [Fixed #444](https://github.com/NativeScript/nativescript-cli/issues/444): When you attempt to install the `nativescript` npm module using `sudo`, errors might be shown.
* [Fixed #443](https://github.com/NativeScript/nativescript-cli/issues/443): When you attempt to configure command-line completion during installation, `ENOENT` error might be shown.
* [Fixed #442](https://github.com/NativeScript/nativescript-cli/issues/442): The console does not show links properly.
* [Fixed #394](https://github.com/NativeScript/nativescript-cli/issues/394): On OS X or Linux systems, the NativeScript CLI does not resolve symlinks and you cannot build your apps.
* [Fixed #391](https://github.com/NativeScript/nativescript-cli/issues/391): The Android splash screen image in the template is malformed and causes errors in the build log.
* [Fixed #324](https://github.com/NativeScript/nativescript-cli/issues/324): If the Android SDK is not properly configured, when you run `tns build ios`, `run ios`, `tns deploy ios` or `tns emulate ios`, the NativeScript CLI prints an irrelevant adb-related warning.
* [Fixed #309](https://github.com/NativeScript/nativescript-cli/issues/309): You cannot open the device log for streaming with `tns device log`.
* [Fixed #276](https://github.com/NativeScript/nativescript-cli/issues/276): On bash consoles, command-line completion does not work.

0.10.0 (2015, April 21)
==

### Breaking

* Introduced new project structure. To migrate to the new structure, complete the following steps.
	1. Manually move all files and folders from the inner `app` folder one level up inside the outer `app` folder.
	1. Remove the now empty inner `app` folder.
	1. Verify that your project structure reflects the structure described [here](https://github.com/NativeScript/nativescript-cli/blob/production/README.md#create-project).

### New

* [Implemented #388](https://github.com/NativeScript/nativescript-cli/issues/388): Improved the `--log trace` global option.
* [Implemented #387](https://github.com/NativeScript/nativescript-cli/issues/387): Improved installation.
* [Implemented #350](https://github.com/NativeScript/nativescript-cli/issues/350): Improved command-line completion.
* [Implemented #175](https://github.com/NativeScript/nativescript-cli/issues/175): You can run your app in Android virtual devices, created from the Google APIs images from the Android SDK.
* [Implemented #88](https://github.com/NativeScript/nativescript-cli/issues/88), [#291](https://github.com/NativeScript/nativescript-cli/issues/291): Introduced context-aware console help which you can access by running `tns <Command> -h` and extended HTML help which you access by running `tns help <Command>`.

### Fixed

* [Fixed #380](https://github.com/NativeScript/nativescript-cli/issues/380): When you run `tns build android`, `tns run android`, `tns deploy android` or `tns emulate android`, the NativeScript CLI builds your project twice.
* [Fixed #371](https://github.com/NativeScript/nativescript-cli/issues/371): On Android 5.x devices, NativeScript apps load very slowly on first run.
* [Fixed #260](https://github.com/NativeScript/nativescript-cli/issues/260): On bash consoles, the `open` command might stop working.
* [Fixed #257](https://github.com/NativeScript/nativescript-cli/issues/257): On bash consoles, you cannot pass arguments with spaces, even if escaped.
* [Fixed #251](https://github.com/NativeScript/nativescript-cli/issues/251): On OS X systems, the command validation might not work properly.
* [Fixed #248](https://github.com/NativeScript/nativescript-cli/issues/248): On OS X systems, the `tns deploy` command might not release the console.
* [Fixed #169](https://github.com/NativeScript/nativescript-cli/issues/169): The native Xcode project is created with an incorrect name.

0.9.4 (2015, March 18)
==

### Fixed

* [Fixed #348](https://github.com/NativeScript/nativescript-cli/issues/348): `tns platform add ios` downloads the latest experimental version of the ios runtime instead of the latest stable version.

0.9.3 (2015, March 18)
==

### Fixed

* [Fixed #312](https://github.com/NativeScript/nativescript-cli/issues/312): `tns platform add ios` does not preserve your app ID, if not default.

0.9.2 (2015, March 17)
===

### New

* [Implemented #305](https://github.com/NativeScript/nativescript-cli/issues/305), [#322](https://github.com/NativeScript/nativescript-cli/issues/322): You can quickly add or update your platform runtime to a specific version by running `tns platform update platform@version`<br/>For example: `tns platform update ios@0.9.2-beta`<br/>The NativeScript team will publish experimental support for the latest versions of iOS and Android.<br/>To list all available versions for android, run $ npm view tns-android versions<br/>To list only experimental versions for android, run $ npm view tns-android dist-tags
To list all available versions for ios, run $ npm view tns-ios versions<br/>To list only experimental versions for ios, run $ npm view tns-ios dist-tags
* [Implemented #302](https://github.com/NativeScript/nativescript-cli/issues/302): You can configure proxy settings for the NativeScript CLI.

### Fixed

* [Fixed #299](https://github.com/NativeScript/nativescript-cli/issues/299): You cannot build the default `Hello World` app for Android on OS X systems.
* [Fixed #297](https://github.com/NativeScript/nativescript-cli/issues/297): You cannot install the NativeScript CLI.
