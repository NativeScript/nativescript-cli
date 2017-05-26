debug android
==========

Usage | Synopsis
---|---
Deploy on device/emulator, run the app, follow generated link to use in Chrome Developer Tools, and attach the debugger | `$ tns debug android`
Deploy on device/emulator, run the app and stop at the first code statement | `$ tns debug android --debug-brk [--device <Device ID>] [--timeout <timeout>]`
Deploy in the native emulator, run the app and stop at the first code statement | `$ tns debug android --debug-brk --emulator [--timeout <timeout>]`
Attach the debug tools to a running app on device/emulator | `$ tns debug android --start [--device <Device ID>] [--timeout <timeout>]`
Attach the debug tools to a running app in the native emulator | `$ tns debug android --start --emulator [--timeout <timeout>]`

Prepares, builds and deploys the project when necessary. Debugs your project on a connected device or emulator.
While debugging, prints the output from the application in the console and watches for changes in your code. Once a change is detected, it synchronizes the change with the selected device and restarts the application.

### Options
* `--device` - Specifies a connected device/emulator on which to debug the app.
* `--emulator` - Specifies that you want to debug the app in the native Android emulator.
* `--debug-brk` - Prepares, builds and deploys the application package on a device/emulator, generates a link for Chrome Developer Tools and stops at the first code statement.
* `--start` - Attaches the debug tools to a deployed and running app.
* `--timeout` - Sets the number of seconds that the NativeScript CLI will wait for the emulator/device to boot. If not set, the default timeout is 90 seconds.
* `--no-watch` - If set, changes in your code will not be reflected during the execution of this command.
* `--clean` - If set, forces rebuilding the native application.

### Attributes
* `<Device ID>` is the device identifier or name of the target device as listed by `$ tns device android`

<% if(isHtml) { %>
### Prerequisites

* You must have Chrome installed on your system.<br/>


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