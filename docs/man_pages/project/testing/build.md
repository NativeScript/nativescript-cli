<% if (isJekyll) { %>---
title: tns build
position: 3
---<% } %>

# tns build

### Description

Builds the project for Android <% if(isMacOS) { %>or iOS <% } %>and produces an application package that you can manually deploy on a device or native emulator. <% if(isMacOS) { %>You must specify the target platform for which you want to build your project.<% } %>

When running this command the HMR (Hot Module Replacement) is not enabled by default. In case you want to enable HMR, you can pass `--hmr` flag.

<% if(isHtml) { %>
> NOTE: When passing `--release` CLI will disable HMR.
<% } %>

### Commands

Usage | Synopsis
---|---
<% if((isConsole && isMacOS) || isHtml) { %>General | `$ tns build <Platform>`<% } %><% if(isConsole && (isLinux || isWindows)) { %>General | `$ tns build android`<% } %>

<% if((isConsole && isMacOS) || isHtml) { %>### Arguments
`<Platform>` is the target mobile platform for which you want to build your project. You can set the following target platforms.
* `android` - Build the project for Android and produces an `APK` that you can manually deploy on a device or in the native emulator.
* `ios` - Build the project for iOS and produces an `APP` or `IPA` that you can manually deploy in the iOS Simulator or on a device.<% } %>

### Options

* `--justlaunch` - If set, does not print the application output in the console.
* `--release` -If set, produces a release build by running webpack in production mode and native build in release mode. Otherwise, produces a debug build.
* `--device` - Specifies a connected device/emulator to start and run the app. `<Device ID>` is the index or `Device Identifier` of the target device as listed by the `$ tns device <Platform> --available-devices` command.
* `--hmr` - Enables the hot module replacement (HMR) feature.
* `--env.*` - Specifies additional flags that the bundler may process. Can be passed multiple times. Supported additional flags:
    *   `--env.aot` - creates Ahead-Of-Time build (Angular only).
    *   `--env.snapshot`- creates [a V8 Snapshot](https://docs.nativescript.org/performance-optimizations/bundling-with-webpack#v8-heap-snapshot) decreasing the app start time (only for release builds for Android).
    *   `--env.compileSnapshot`- compiles the static assets produced by `--env.snapshot` into `.so` files allowing the native build to split them per architecture. This will reduce the app size when using the `--aab` option. 
    *   `--env.uglify` - provides basic obfuscation and smaller app size.
    *   `--env.report` - creates a Webpack report inside a `report` folder in the root folder.
    *   `--env.sourceMap` - creates inline source maps.
    *   `--env.hiddenSourceMap` - creates sources maps in the root folder (useful for Crashlytics usage with bundled app in release).
* `--aab` - Specifies that the command will produce and deploy an Android App Bundle.
* `--force` - If set, skips the application compatibility checks and forces `npm i` to ensure all dependencies are installed. Otherwise, the command will check the application compatibility with the current CLI version and could fail requiring `tns migrate`.

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[appstore](../../publishing/appstore.html) | Lists applications registered in iTunes Connect.
[appstore upload](../../publishing/appstore-upload.html) | Uploads project to iTunes Connect.
[build android](build-android.html) | Builds the project for Android and produces an APK that you can manually deploy on device or in the native emulator.
[build ios](build-ios.html) | Builds the project for iOS and produces an APP or IPA that you can manually deploy in the iOS Simulator or on device, respectively.
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