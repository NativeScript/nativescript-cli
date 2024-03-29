<% if (isJekyll) { %>---
title: ns build android
position: 1
---<% } %>

# ns build android

### Description

Builds the project for Android and produces an APK that you can manually deploy on an Android device or Android emulator.

### Commands

Usage | Synopsis
---|---
General | `$ ns build android [--compileSdk <API Level>] [--key-store-path <File Path> --key-store-password <Password> --key-store-alias <Name> --key-store-alias-password <Password>] [--release] [--static-bindings] [--copy-to <File Path>] [--env.*]] [--aab]`

### Options

* `--compileSdk` - Sets the Android SDK that will be used to build the project. `<API Level>` is a valid Android API level. For example: 28, 29. The minimum supported SDK is 28. <% if(isHtml) { %> For a complete list of the Android API levels and their corresponding Android versions, click [here](http://developer.android.com/guide/topics/manifest/uses-sdk-element.html#platform).<% } %>
* `--clean` - If set, forces the complete rebuild of the native application.
* `--release` - If set, produces a release build. Otherwise, produces a debug build. When set, you must also specify the `--key-store-*` options.
* `--key-store-path` - Specifies the file path to the keystore file (P12) which you want to use to code sign your APK. You can use the `--key-store-*` options along with `--release` to produce a signed release build. You need to specify all `--key-store-*` options.
* `--key-store-password` - Provides the password for the keystore file specified with `--key-store-path`. You can use the `--key-store-*` options along with `--release` to produce a signed release build. You need to specify all `--key-store-*` options.
* `--key-store-alias` - Provides the alias for the keystore file specified with `--key-store-path`. You can use the `--key-store-*` options along with `--release` to produce a signed release build. You need to specify all `--key-store-*` options.
* `--key-store-alias-password` - Provides the password for the alias specified with `--key-store-alias-password`. You can use the `--key-store-*` options along with `--release` to produce a signed release build. You need to specify all `--key-store-*` options.
* `--copy-to` - Specifies the file path where the built `.apk` will be copied. If it points to a non-existent directory path, it will be created. If the specified value is existing directory, the original file name will be used.
* `--env.*` - Specifies additional flags that the bundler may process. Can be passed multiple times. Supported additional flags:
    *   `--env.aot` - creates Ahead-Of-Time build (Angular only).
    *   `--env.snapshot`- creates [a V8 Snapshot](https://docs.nativescript.org/performance-optimizations/bundling-with-webpack#v8-heap-snapshot) decreasing the app start time (only for release builds for Android).
    *   `--env.compileSnapshot`- compiles the static assets produced by `--env.snapshot` into `.so` files allowing the native build to split them per architecture. This will reduce the app size when using the `--aab` option. 
    *   `--env.uglify` - provides basic obfuscation and smaller app size.
    *   `--env.report` - creates a Webpack report inside a `report` folder in the root folder.
    *   `--env.sourceMap` - creates inline source maps.
    *   `--env.hiddenSourceMap` - creates sources maps in the root folder (useful for Crashlytics usage with bundled app in release).
* `--aab` - Specifies that the build will produce an Android App Bundle(`.aab`) file.
* `--force` - If set, skips the application compatibility checks and forces `npm i` to ensure all dependencies are installed. Otherwise, the command will check the application compatibility with the current CLI version and could fail requiring `ns migrate`.
* `--path <Directory>` - Specifies the directory that contains the project. If not set, the project is searched for in the current directory and all directories above it.

<% if(isHtml) { %>

### Command Limitations

* When the `--release` flag is set, you must also specify all `--key-store-*` options.

### Related Commands

Command | Description
----------|----------
[build ios](build-ios.html) | Builds the project for iOS and produces an APP or IPA that you can manually deploy in the iOS Simulator or on device, respectively.
[build](build.html) | Builds the project for the selected target platform and produces an application package that you can manually deploy on device or in the native emulator.
[debug android](debug-android.html) | Debugs your project on a connected Android device or in a native emulator.
[debug ios](debug-ios.html) | Debugs your project on a connected iOS device or in a native emulator.
[debug](debug.html) | Debugs your project on a connected device or in a native emulator.
[deploy](deploy.html) | Builds and deploys the project to a connected physical or virtual device.
[run android](run-android.html) | Runs your project on a connected Android device or in a native Android emulator, if configured.
[run ios](run-ios.html) | Runs your project on a connected iOS device or in the iOS Simulator, if configured.
[run](run.html) | Runs your project on a connected device or in the native emulator for the selected platform.
[test init](test-init.html) | Configures your project for unit testing with a selected framework.
[test android](test-android.html) | Runs the tests in your project on Android devices or native emulators.
[test ios](test-ios.html) | Runs the tests in your project on iOS devices or the iOS Simulator.
<% } %>
