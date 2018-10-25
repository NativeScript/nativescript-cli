<% if (isJekyll) { %>---
title: tns run ios
position: 11
---<% } %>

# tns run ios

### Description

Runs your project on a connected iOS device or in the iOS Simulator, if configured. This is shorthand for prepare, build and deploy. While your app is running, prints the output from the application in the console and watches for changes in your code. Once a change is detected, it synchronizes the change with all selected devices and restarts/refreshes the application.

<% if(isConsole && (isWindows || isLinux)) { %>WARNING: You can run this command only on macOS systems. To view the complete help for this command, run `$ tns help run ios`<% } %>
<% if((isConsole && isMacOS) || isHtml) { %>
<% if(isHtml) { %>> <% } %>IMPORTANT: Before building for iOS device, verify that you have configured a valid pair of certificate and provisioning profile on your macOS system. <% if(isHtml) { %>For more information, see the [Code Signing](https://developer.apple.com/support/code-signing/) and [Maintain Signing Assets](https://help.apple.com/xcode/mac/current/#/dev3a05256b8) sections from the Apple Developer documentation.<% } %>

To enable Hot Module Replacement (HMR) in Angular projects, follow the steps outlined in this wiki: https://github.com/NativeScript/nativescript-angular/wiki/HMR.

### Commands

Usage | Synopsis
---|---
Run on all connected devices | `$ tns run ios [--release] [--justlaunch] [--bundle [<value>] [--env.*]]`
Run on a selected connected device. Will start simulator with specified `Device Identifier`, if not already running. | `$ tns run ios [--device <Device ID>] [--release] [--justlaunch] [--bundle [<value>] [--env.*]]`
Start an emulator and run the app inside it | `$ tns run ios --emulator [--release] [--bundle [<value>] [--env.*]]`
Start an emulator with specified device name and sdk | `$ tns run ios [--device <Device Name>] [--sdk <sdk>]`
Start an emulator with specified device identifier and sdk | `$ tns run ios [--device <Device Identifier>] [--sdk <sdk>]`

### Options

* `--device` - Specifies a connected device/simulator to start and run the app. `<Device ID>` is the index or `Device Identifier` of the target device as listed by the `$ tns device ios --available-devices` command.
* `--emulator` - If set, runs the app in all available and configured ios simulators. It will start a simulator if none are already running.
* `--sdk` - Specifies the target simulator's sdk.
* `--justlaunch` - If set, does not print the application output in the console.
* `--clean` - If set, forces the complete rebuild of the native application.
* `--no-watch` - If set, changes in your code will not be reflected during the execution of this command.
* `--release` - If set, produces a release build. Otherwise, produces a debug build.
* `--bundle` - Specifies that the `webpack` bundler will be used to bundle the application.
* `--hmr` - (Beta) Enables the hot module replacement (HMR) feature. HMR depends on `webpack` and adding the `--hmr` flag to the command will automatically enable the `--bundle` option as well. <% if(isConsole) { %> The HMR feature is currently in Beta. For more information about the current development state and any known issues, please check the relevant GitHub issue: https://github.com/NativeScript/NativeScript/issues/6398.<% } %>
* `--env.*` - Specifies additional flags that the bundler may process. May be passed multiple times. For example: `--env.uglify --env.snapshot`.
* `--syncAllFiles` - Watches all production dependencies inside node_modules for changes. Triggers project rebuild if necessary!

<% } %>
<% if(isHtml) { %>

>Note: Hot Module Replacement (HMR) is currently in Beta. For more information about the current development state and any known issues, please check the relevant GitHub issue: https://github.com/NativeScript/NativeScript/issues/6398.

### Prerequisites

Before running the iOS Simulator, verify that your system meets the following requirements.
* You have installed a version of Xcode which is compatible with the ios-sim-portable npm package on which the NativeScript CLI depends. For more information, visit [https://www.npmjs.org/package/ios-sim-portable](https://www.npmjs.org/package/ios-sim-portable).

### Command Limitations

* You can run `$ tns run ios` only on macOS systems.
* You cannot use `--device` and `--emulator` simultaneously.

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
[run](run.html) | Runs your project on a connected device or in the native emulator for the selected platform.
[test init](test-init.html) | Configures your project for unit testing with a selected framework.
[test android](test-android.html) | Runs the tests in your project on Android devices or native emulators.
[test ios](test-ios.html) | Runs the tests in your project on iOS devices or the iOS Simulator.
<% } %>
