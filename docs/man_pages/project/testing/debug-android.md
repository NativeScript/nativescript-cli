<% if (isJekyll) { %>---
title: tns debug android
position: 4
---<% } %>

# tns debug android

### Description 

Initiates a debugging session for your project on a connected Android device or Android emulator. When necessary, the command will prepare, build, deploy and launch the app before starting the debug session. While debugging, the output from the application is printed in the console and any changes made to your code are synchronizes with the deployed app.

To enable Hot Module Replacement (HMR) in Angular projects, follow the steps outlined in this wiki: https://github.com/NativeScript/nativescript-angular/wiki/HMR.

### Commands

Usage | Synopsis
---|---
Deploy on device/emulator, run the app and generate a Chrome DevTools link for debugging | `$ tns debug android`
Deploy on device/emulator, run the app and stop at the first code statement | `$ tns debug android --debug-brk [--device <Device ID>] [--timeout <timeout>]`
Deploy in the native emulator, run the app and stop at the first code statement | `$ tns debug android --debug-brk --emulator [--timeout <timeout>]`
Attach the debug tools to a running app on device/emulator | `$ tns debug android --start [--device <Device ID>] [--timeout <timeout>]`
Attach the debug tools to a running app in the native emulator | `$ tns debug android --start --emulator [--timeout <timeout>]`

### Options

* `--device` - Specifies a connected device/emulator on which to debug the app. `<Device ID>` is the device identifier or name of the target device as listed by the `$ tns device android` command.
* `--emulator` - Specifies that you want to debug the app in the native Android emulator.
* `--debug-brk` - Prepares, builds and deploys the application package on a device/emulator, generates a link for Chrome Developer Tools and stops at the first code statement.
* `--start` - Attaches the debug tools to a deployed and running app.
* `--timeout` - Sets the number of seconds that the NativeScript CLI will wait for the emulator/device to boot. If not set, the default timeout is 90 seconds.
* `--no-watch` - If set, changes in your code will not be reflected during the execution of this command.
* `--clean` - If set, forces the complete rebuild of the native application.
* `--bundle` - Specifies that the `webpack` bundler will be used to bundle the application.
* `--hmr` - (Beta) Enables the hot module replacement (HMR) feature. HMR depends on `webpack` and adding the `--hmr` flag to the command will automatically enable the `--bundle` option as well.<% if(isConsole) { %> The HMR feature is currently in Beta. For more information about the current development state and any known issues, please check the relevant GitHub issue: https://github.com/NativeScript/NativeScript/issues/6398.<% } %>
* `--syncAllFiles` - Watches all production dependencies inside node_modules for changes. Triggers project rebuild if necessary!

<% if(isHtml) { %>

>Note: Hot Module Replacement (HMR) is currently in Beta. For more information about the current development state and any known issues, please check the relevant GitHub issue: https://github.com/NativeScript/NativeScript/issues/6398.

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