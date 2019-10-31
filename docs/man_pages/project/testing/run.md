<% if (isJekyll) { %>---
title: tns run
position: 12
---<% } %>

# tns run

### Description

Runs your project on all connected devices or in native emulators for the selected platform.<% if(isConsole && (isLinux || isWindows)) { %>The command will work with all currently running Android devices and emulators.<% } %> The command will prepare, build and deploy the app when necessary. By default listens for changes in your code, synchronizes those changes and refreshes all selected devices.

<% if(isHtml) { %>
When running this command without passing `--release` flag, the HMR (Hot Module Replacement) is enabled by default. In case you want to disable HMR, you can pass `--no-hmr` flag. When `--release` is passed, CLI disables HMR.

#### How file changes are handled
With HMR (Hot Module Replacement):
* Changes in `.js`, `.ts`, `.less`, `.sass` and other file types that are accepted will cause a refresh of the application.
* Changes in `App_Resources` will cause a rebuild of the application.
* Changes in any `package.json` file inside the project will cause a rebuild of the application.
* Changes in `node_modules/somePlugin` if accepted will cause a refresh of the application.
* Changes in `node_modules/somePlugin/platforms` will cause a rebuild of the application.
* Changes in `node_modules/somePlugin/package.json` file will cause a rebuild of the application.
* Changes that are not accepted and HMR fails will cause a restart of the native application.

With **no** HMR:
* Changes in `.js`, `.ts`, `.less`, `.sass` and other file types will cause a restart of the native application.
* Changes in `App_Resources` will cause a rebuild of the application.
* Changes in any `package.json` file inside the project will cause a rebuild of the application.
* Changes in `node_modules/somePlugin` will cause a restart of the native application.
* Changes in `node_modules/somePlugin/platforms` will cause a rebuild of the application.
* Changes in `node_modules/somePlugin/package.json` file will cause a rebuild of the application.
<% } %>

### Commands

Usage | Synopsis
---|---
Run on all connected devices | `$ tns run [--release] [--justlaunch]`
Run on a selected connected device or running emulator. Will start emulator with specified `Device Identifier`, if not already running. | `$ tns run --device <Device ID> [--release] [--justlaunch]`
<% if((isConsole && isMacOS) || isHtml) { %>Run on all connected devices of the specified `Platform` | `$ tns run <Platform> [--release] [--justlaunch]`<% } %>

### Options

* `--justlaunch` - If set, does not print the application output in the console.
* `--release` - If set, produces a release build by running webpack in production mode and native build in release mode. Otherwise, produces a debug build.
* `--device` - Specifies a connected device/emulator to start and run the app. `<Device ID>` is the index or `Device Identifier` of the target device as listed by the `$ tns device <Platform> --available-devices` command.
* `--no-hmr` - Disables Hot Module Replacement (HMR). In this case, when a change in the code is applied, CLI will transfer the modified files and restart the application.
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


<% if((isConsole && isMacOS) || isHtml) { %>### Arguments
`<Platform>` is the target mobile platform for which you want to run your project. You can set the following target platforms:
 * `android` - Run your project on all Android devices and emulators.
 * `ios` - Run your project on all iOS devices and simulators.

<% } %>

<% if(isHtml) { %>

### Command Limitations

* The command will work with all connected devices and running emulators on macOS. On Windows and Linux the command will work with Android devices only.
* In case a platform is not specified and there's no running devices and emulators, the command will fail.

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
[deploy](deploy.html) | Builds and deploys the project to a connected physical or virtual device.
[run android](run-android.html) | Runs your project on a connected Android device or in a native Android emulator, if configured.
[run ios](run-ios.html) | Runs your project on a connected iOS device or in the iOS Simulator, if configured.
[test init](test-init.html) | Configures your project for unit testing with a selected framework.
[test android](test-android.html) | Runs the tests in your project on Android devices or native emulators.
[test ios](test-ios.html) | Runs the tests in your project on iOS devices or the iOS Simulator.
<% } %>
