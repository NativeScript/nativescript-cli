<% if (isJekyll) { %>---
title: tns debug android
position: 4
---<% } %>

# tns debug android

### Description 

Initiates a debugging session for your project on a connected Android device or Android emulator. When necessary, the command will prepare, build, deploy and launch the app before starting the debug session. While debugging, the output from the application is printed in the console and any changes made to your code are synchronizes with the deployed app.

### Commands

Usage | Synopsis
---|---
Deploy on device/emulator, run the app and generate a Chrome DevTools link for debugging | `$ tns debug android [--device <Device ID>] [--timeout <timeout>] [--aab]`
Deploy on device/emulator, run the app and stop at the first code statement | `$ tns debug android --debug-brk [--device <Device ID>] [--timeout <timeout>] [--aab]`
Deploy in the native emulator, run the app and stop at the first code statement | `$ tns debug android --debug-brk --emulator [--timeout <timeout>] [--aab]`
Attach the debug tools to a running app on device/emulator | `$ tns debug android --start [--device <Device ID>] [--timeout <timeout>] [--aab]`
Attach the debug tools to a running app in the native emulator | `$ tns debug android --start --emulator [--timeout <timeout>] [--aab]`

### Options

* `--device` - Specifies a connected device/emulator on which to debug the app. `<Device ID>` is the device identifier or name of the target device as listed by the `$ tns device android` command.
* `--emulator` - Specifies that you want to debug the app in the native Android emulator.
* `--debug-brk` - Prepares, builds and deploys the application package on a device/emulator, generates a link for Chrome Developer Tools and stops at the first code statement.
* `--start` - Attaches the debug tools to a deployed and running app.
* `--timeout` - Sets the number of seconds that the NativeScript CLI will wait for the emulator/device to boot. If not set, the default timeout is 90 seconds.
* `--no-watch` - If set, changes in your code will not be reflected during the execution of this command.
* `--clean` - If set, forces the complete rebuild of the native application.
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

<% if(isHtml) { %>

### Command Limitations

* You must have Google Chrome installed on your machine.

### Related Commands

Command | Description
----------|----------
[build](build.html) | Builds the project for the selected target platform and produces an application package that you can manually deploy on device or in the native emulator.
[build android](build-android.html) | Builds the project for Android and produces an APK that you can manually deploy on device or in the native emulator.
[debug](debug.html) | Debugs your project on a connected device or in a native emulator.
[debug ios](debug-ios.html) | Debugs your project on a connected iOS device or in a native emulator.
[deploy](deploy.html) | Builds and deploys the project to a connected physical or virtual device.
[device](../../device/device.html) | Lists all connected devices/emulators.
[device android](../../device/device-android.html) | Lists all connected devices/emulators for android.
[run](run.html) | Runs your project on a connected device or in the native emulator for the selected platform.
[run android](run-android.html) | Runs your project on a connected Android device or in a native Android emulator, if configured.
[test init](test-init.html) | Configures your project for unit testing with a selected framework.
[test android](test-android.html) | Runs the tests in your project on Android devices or native emulators.
<% } %>