<% if (isJekyll) { %>---
title: tns run
position: 12
---<% } %>

# tns run

### Description

Runs your project on all connected devices or in native emulators for the selected platform.<% if(isConsole && (isLinux || isWindows)) { %>The command will work with all currently running Android devices and emulators.<% } %> The command will prepare, build and deploy the app when necessary. By default listens for changes in your code, synchronizes those changes and refreshes all selected devices.

### Commands

Usage | Synopsis
---|---
Run on all connected devices | `$ tns run [--release] [--justlaunch]`
Run on a selected connected device or running emulator. Will start emulator with specified `Device Identifier`, if not already running. | `$ tns run --device <Device ID> [--release] [--justlaunch]`
<% if((isConsole && isMacOS) || isHtml) { %>Run on all connected devices of the speficied `Platform` | `$ tns run <Platform> [--release] [--justlaunch]`<% } %>

### Options

* `--justlaunch` - If set, does not print the application output in the console.
* `--release` - If set, produces a release build. Otherwise, produces a debug build.
* `--device` - Specifies a connected device/emulator to start and run the app. `<Device ID>` is the index or `Device Identifier` of the target device as listed by the `$ tns device <Platform> --available-devices` command.

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
