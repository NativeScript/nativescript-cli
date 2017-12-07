run ios
==========

Usage | Synopsis
---|---
Run on all connected devices | `$ tns run ios [--release] [--justlaunch] [--bundle [<value>] [--env.*]]`
Run on a selected connected device. Will start simulator with specified `Device Identifier`, if not already running. | `$ tns run ios [--device <Device ID>] [--release] [--justlaunch] [--bundle [<value>] [--env.*]]`
Start an emulator and run the app inside it | `$ tns run ios --emulator [--release] [--bundle [<value>] [--env.*]]`

Runs your project on a connected iOS device or in the iOS Simulator, if configured. This is shorthand for prepare, build and deploy. While your app is running, prints the output from the application in the console and watches for changes in your code. Once a change is detected, it synchronizes the change with all selected devices and restarts/refreshes the application.

<% if(isConsole && (isWindows || isLinux)) { %>WARNING: You can run this command only on OS X systems. To view the complete help for this command, run `$ tns help run ios`<% } %>
<% if((isConsole && isMacOS) || isHtml) { %>
<% if(isHtml) { %>> <% } %>IMPORTANT: Before building for iOS device, verify that you have configured a valid pair of certificate and provisioning profile on your OS X system. <% if(isHtml) { %>For more information, see [Obtaining Signing Identities and Downloading Provisioning Profiles](https://developer.apple.com/library/mac/recipes/xcode_help-accounts_preferences/articles/obtain_certificates_and_provisioning_profiles.html).<% } %>

### Options
* `--device` - Specifies a connected device/simulator to start and run the app.
* `--emulator` - If set, runs the app in all available and configured ios simulators. It will start a simulator if none are already running.
* `--justlaunch` - If set, does not print the application output in the console.
* `--clean` - If set, forces rebuilding the native application.
* `--no-watch` - If set, changes in your code will not be reflected during the execution of this command.
* `--release` - If set, produces a release build. Otherwise, produces a debug build.
* `--bundle` - Specifies that a bundler (e.g. webpack) should be used if one is present. If no value is passed will default to `webpack`.
* `--env.*` - Specifies additional flags that the bundler may process. May be passed multiple times. For example: `--env.uglify --env.snapshot`.

### Attributes
* `<Device ID>` is the index or `Device Identifier` of the target device as listed by `$ tns device ios --available-devices`
<% } %>
<% if(isHtml) { %>
### Prerequisites
Before running the iOS Simulator, verify that you have met the following requirements.
* You have installed Xcode. The version of Xcode must be compatible with the ios-sim-portable npm package on which the  NativeScript CLI depends. For more information, visit [https://www.npmjs.org/package/ios-sim-portable](https://www.npmjs.org/package/ios-sim-portable).

### Command Limitations

* You can run `$ tns run ios` only on OS X systems.
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
