<% if (isJekyll) { %>---
title: tns deploy
position: 7
---<% } %>

# tns deploy

### Description

Prepares, builds and deploys the project to a connected device or native emulator. <% if(isMacOS) { %>You must specify the target platform on which you want to deploy.<% } %> It will deploy the app on all connected devices targeting the selected platform.

<% if(isMacOS) { %>
<% if(isHtml) { %>> <% } %>IMPORTANT: Before building for iOS device, verify that you have configured a valid pair of certificate and provisioning profile on your macOS system. <% if(isHtml) { %>For more information, see the [Code Signing](https://developer.apple.com/support/code-signing/) and [Maintain Signing Assets](https://help.apple.com/xcode/mac/current/#/dev3a05256b8) sections from the Apple Developer documentation.<% } %>

### Commands

Usage | Synopsis
---|---
Deploy on Android | `$ tns deploy android [--device <Device ID>] [--key-store-path <File Path> --key-store-password <Password> --key-store-alias <Name> --key-store-alias-password <Password>] [--release]`
<% if(isMacOS) { %>Deploy on iOS | `$ tns deploy ios [--device <Device ID>] [--release]`<% } %>

### Options for iOS

* `--device` - Deploys the project on the specified connected physical or virtual device. `<Device ID>` is the index or name of the target device as listed by the `$ tns devices` command.
* `--release` - If set, produces a release build. Otherwise, produces a debug build.<% } %>

### Options<% if(isMacOS) { %> for Android<% } %>

* `--device` - Deploys the project on the specified connected physical or virtual device. `<Device ID>` is the index or name of the target device as listed by the `$ tns devices` command.
* `--clean` - If set, forces the complete rebuild of the native application.
* `--release` - If set, produces a release build. Otherwise, produces a debug build. When set, you must also specify the `--key-store-*` options.
* `--key-store-path` - Specifies the file path to the keystore file (P12) which you want to use to code sign your APK. You can use the `--key-store-*` options along with `--release` to produce a signed release build. You need to specify all `--key-store-*` options.
* `--key-store-password` - Provides the password for the keystore file specified with `--key-store-path`. You can use the `--key-store-*` options along with `--release` to produce a signed release build. You need to specify all `--key-store-*` options.
* `--key-store-alias` - Provides the alias for the keystore file specified with `--key-store-path`. You can use the `--key-store-*` options along with `--release` to produce a signed release build. You need to specify all `--key-store-*` options.
* `--key-store-alias-password` - Provides the password for the alias specified with `--key-store-alias-password`. You can use the `--key-store-*` options along with `--release` to produce a signed release build. You need to specify all `--key-store-*` options.

<% if(isHtml) { %>

### Command Limitations

* You can run `$ tns deploy ios` only on macOS systems.
* When the `--release` flag is set for an Android build, you must also specify all `--key-store-*` options.

### Related Commands

Command | Description
----------|----------
[appstore](../../publishing/appstore.html) | Lists applications registered in iTunes Connect.
[appstore upload](../../publishing/appstore-upload.html) | Uploads project to iTunes Connect.
[build android](build-android.html) | Builds the project for Android and produces an APK that you can manually deploy on device or in the native emulator.
[build ios](build-ios.html) | Builds the project for iOS and produces an APP or IPA that you can manually deploy in the iOS Simulator or on device, respectively.
[build](build.html) | Builds the project for the selected target platform and produces an application package that you can manually deploy on device or in the native emulator.
[debug android](debug-android.html) | Debugs your project on a connected Android device or in a native emulator.
[debug ios](debug-ios.html) | Debugs your project on a connected iOS device or in a native emulator.
[debug](debug.html) | Debugs your project on a connected device or in a native emulator.
[run android](run-android.html) | Runs your project on a connected Android device or in a native Android emulator, if configured.
[run ios](run-ios.html) | Runs your project on a connected iOS device or in the iOS Simulator, if configured.
[run](run.html) | Runs your project on a connected device or in the native emulator for the selected platform.
[test init](test-init.html) | Configures your project for unit testing with a selected framework.
[test android](test-android.html) | Runs the tests in your project on Android devices or native emulators.
[test ios](test-ios.html) | Runs the tests in your project on iOS devices or the iOS Simulator.
<% } %>