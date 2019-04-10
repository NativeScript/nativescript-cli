<% if (isJekyll) { %>---
title: tns build
position: 3
---<% } %>

# tns build

### Description

Builds the project for Android <% if(isMacOS) { %>or iOS <% } %>and produces an application package that you can manually deploy on a device or native emulator. <% if(isMacOS) { %>You must specify the target platform for which you want to build your project.<% } %>

### Commands

Usage | Synopsis
---|---
<% if((isConsole && isMacOS) || isHtml) { %>General | `$ tns build <Platform>`<% } %><% if(isConsole && (isLinux || isWindows)) { %>General | `$ tns build android`<% } %>

<% if((isConsole && isMacOS) || isHtml) { %>### Arguments
`<Platform>` is the target mobile platform for which you want to build your project. You can set the following target platforms.
* `android` - Build the project for Android and produces an `APK` that you can manually deploy on a device or in the native emulator.
* `ios` - Build the project for iOS and produces an `APP` or `IPA` that you can manually deploy in the iOS Simulator or on a device.<% } %>

<% if(isHtml) { %>

### Options

* `--justlaunch` - If set, does not print the application output in the console.
* `--release` - If set, produces a release build. Otherwise, produces a debug build.
* `--device` - Specifies a connected device/emulator to start and run the app. `<Device ID>` is the index or `Device Identifier` of the target device as listed by the `$ tns device <Platform> --available-devices` command.
* `--bundle` - Specifies that the `webpack` bundler will be used to bundle the application.
* `--hmr` - (Beta) Enables the hot module replacement (HMR) feature. HMR depends on `webpack` and adding the `--hmr` flag to the command will automatically enable the `--bundle` option as well. <% if(isConsole) { %> The HMR feature is currently in Beta. For more information about the current development state and any known issues, please check the relevant GitHub issue: https://github.com/NativeScript/NativeScript/issues/6398.<% } %>
* `--env.*` - Specifies additional flags that the bundler may process. May be passed multiple times. Supported additional flags:
    *   `--env.aot` - creates Ahead-Of-Time build (Angular only)
    *   `--env.snapshot`- creates Snapshot (only on Mac OS & only for Android)
    *   `--env.uglify` - obfuscates the code with Uglify.js
    *   `--env.report` - creates a report inside a `report` folder in the root folde
    *   `--env.sourceMap` - creates inline source maps (useful for debbuging bundled app).
    *   `--env.hiddenSourceMap` - creates sources maps in the root folder (useful for Crashlytics usage with bundled app in release)
* `--syncAllFiles` - Watches all production dependencies inside node_modules for changes. Triggers project rebuild if necessary!


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