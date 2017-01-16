emulate ios
==========

Usage | Synopsis
---|---
General | `$ tns emulate ios [--path <Directory>] [--device <Device Name>] [--available-devices] [--release] [--timeout]`

Prepares, builds and deploys the specified project. Runs it in the native iOS Simulator. While your app is running, prints the output from the application in the console and watches for changes in your code. Once a change is detected, it synchronizes the change with all selected devices and restarts/refreshes the application.

<% if(isConsole && (isLinux || isWindows)) { %>WARNING: You can run this command only on OS X systems. To view the complete help for this command, run `$ tns help emulate ios`<% } %>

<% if((isConsole && isMacOS) || isHtml) { %>### Options
* `--available-devices` - Lists all available emulators for the current Xcode.
* `--no-watch` - If set, changes in your code will not be reflected during the execution of this command.
* `--release` - If set, produces a release build. Otherwise, produces a debug build.
* `--path` - Specifies the directory that contains the project. If not specified, the project is searched for in the current directory and all directories above it.
* `--device` - Specifies the name of the iOS Simulator device on which you want to run your app. To list the available iOS Simulator devices, run `$ tns emulate ios --available-devices`
* `--timeout` - Sets the number of seconds that the NativeScript CLI will wait for the iOS Simulator to start before quitting the operation and releasing the console. The value must be a positive integer. If not set, the default timeout is 90 seconds.
* `--justlaunch` - If set, does not print the application output in the console.
* `--clean` - If set, forces rebuilding the native application.

### Attributes
* `<Device Name>` is the name of the iOS Simulator device on which you want to run your app as listed by `$ tns emulate ios --available-devices`<% } %>

<% if(isHtml) { %>
### Prerequisites
Before running the iOS Simulator, verify that you have met the following requirements.
* You have installed Xcode. The version of Xcode must be compatible with the ios-sim-portable npm package on which the NativeScript CLI depends. For more information, visit [https://www.npmjs.org/package/ios-sim-portable](https://www.npmjs.org/package/ios-sim-portable).

### Command Limitations

* You can run `$ tns emulate ios` only on OS X systems.

### Related Commands

Command | Description
----------|----------
[build android](build-android.html) | Builds the project for Android and produces an APK that you can manually deploy on device or in the native emulator.
[build ios](build-ios.html) | Builds the project for iOS and produces an APP or IPA that you can manually deploy in the iOS Simulator or on device, respectively.
[build](build.html) | Builds the project for the selected target platform and produces an application package that you can manually deploy on device or in the native emulator.
[debug android](debug-android.html) | Debugs your project on a connected Android device or in a native emulator.
[debug ios](debug-ios.html) | Debugs your project on a connected iOS device or in a native emulator.
[debug](debug.html) | Debugs your project on a connected device or in a native emulator.
[deploy](deploy.html) | Builds and deploys the project to a connected physical or virtual device.
[emulate android](emulate-android.html) | Builds the specified project and runs it in a native Android emulator.
[emulate](emulate.html) | You must run the emulate command with a related command.
[run android](run-android.html) | Runs your project on a connected Android device or in a native Android emulator, if configured.
[run ios](run-ios.html) | Runs your project on a connected iOS device or in the iOS Simulator, if configured.
[run](run.html) | Runs your project on a connected device or in the native emulator for the selected platform.
[test init](test-init.html) | Configures your project for unit testing with a selected framework.
[test android](test-android.html) | Runs the tests in your project on Android devices or native emulators.
[test ios](test-ios.html) | Runs the tests in your project on iOS devices or the iOS Simulator.
<% } %>