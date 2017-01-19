debug android
==========

Usage | Synopsis
---|---
Deploy on device, run the app start Chrome DevTools, and attach the debugger | `$ tns debug android`
Deploy on device, run the app and stop at the first code statement | `$ tns debug android --debug-brk [--device <Device ID>] [--debug-port <port>] [--timeout <timeout>]`
Deploy in the native emulator, run the app and stop at the first code statement | `$ tns debug android --debug-brk --emulator [<Emulator Options>] [--timeout <timeout>]`
Attach the debug tools to a running app on device | `$ tns debug android --start [--device <Device ID>] [--debug-port <port>] [--timeout <timeout>]`
Attach the debug tools to a running app in the native emulator | `$ tns debug android --start --emulator [<Emulator Options>] [--timeout <timeout>]`
Detach the debug tools | `$ tns debug android --stop`

Prepares, builds and deploys the project when necessary. Debugs your project on a connected device or emulator.
While debugging, prints the output from the application in the console and watches for changes in your code. Once a change is detected, it synchronizes the change with all selected devices and restarts/refreshes the application.

### Options
* `--device` - Specifies a connected device on which to debug the app.
* `--emulator` - Specifies that you want to debug the app in the native Android emulator from the Android SDK.
* `--debug-brk` - Prepares, builds and deploys the application package on a device or in an emulator, launches the Chrome DevTools of your Chrome browser and stops at the first code statement.
* `--start` - Attaches the debug tools to a deployed and running app.
* `--stop` - Detaches the debug tools.
* `--debug-port` - Sets a new port on which to attach the debug tools.
* `--timeout` - Sets the number of seconds that the NativeScript CLI will wait for the debugger to boot. If not set, the default timeout is 90 seconds.
* `--no-watch` - If set, changes in your code will not be reflected during the execution of this command.
* `--clean` - If set, forces rebuilding the native application.

### Attributes
* `<Device ID>` is the index or name of the target device as listed by `$ tns device`
* `<Port>` is an accessible port on the device to which you want to attach the debugging tools.
* `<Emulator Options>` is any valid combination of options as listed by `$ tns help emulate android`

<% if(isHtml) { %>
### Prerequisites

* You must have Chrome installed on your system.<br/>If you are using a non-standard named Chrome app on an OS X system (for example, a nightly Canary update), you need to set this name in the `ANDROID_DEBUG_UI_MAC` setting in the NativeScript [config.json](file:///<%= #{config.getConfigPath(config)} %>).

### Related Commands

Command | Description
----------|----------
[build android](build-android.html) | Builds the project for Android and produces an APK that you can manually deploy on device or in the native emulator.
[build ios](build-ios.html) | Builds the project for iOS and produces an APP or IPA that you can manually deploy in the iOS Simulator or on device, respectively.
[build](build.html) | Builds the project for the selected target platform and produces an application package that you can manually deploy on device or in the native emulator.
[debug ios](debug-ios.html) | Debugs your project on a connected iOS device or in a native emulator.
[debug](debug.html) | Debugs your project on a connected device or in a native emulator.
[deploy](deploy.html) | Builds and deploys the project to a connected physical or virtual device.
[emulate android](emulate-android.html) | Builds the specified project and runs it in a native Android emulator.
[emulate ios](emulate-ios.html) | Builds the specified project and runs it in the native iOS Simulator.
[emulate](emulate.html) | You must run the emulate command with a related command.
[run android](run-android.html) | Runs your project on a connected Android device or in a native Android emulator, if configured.
[run ios](run-ios.html) | Runs your project on a connected iOS device or in the iOS Simulator, if configured.
[run](run.html) | Runs your project on a connected device or in the native emulator for the selected platform.
[test init](test-init.html) | Configures your project for unit testing with a selected framework.
[test android](test-android.html) | Runs the tests in your project on Android devices or native emulators.
[test ios](test-ios.html) | Runs the tests in your project on iOS devices or the iOS Simulator.
<% } %>