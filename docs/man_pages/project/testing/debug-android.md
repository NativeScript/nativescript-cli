debug android
==========

Usage | Synopsis
---|---
Deploy on device, run the app start Chrome DevTools, and attach the debugger | `$ tns debug android`
Deploy on device, run the app and stop at the first code statement | `$ tns debug android --debug-brk [--device <Device ID>] [--debug-port <port>] [--timeout <timeout>]`
Deploy in the native emulator, run the app and stop at the first code statement | `$ tns debug android --debug-brk --emulator [<Emulator Options>] [--timeout <timeout>]`
Deploy in Genymotion, run the app and stop at the first code statement | `$ tns debug android --debug-brk --geny <Geny Name> [--timeout <timeout>]`
Attach the debug tools to a running app on device | `$ tns debug android --start [--device <Device ID>] [--debug-port <port>] [--timeout <timeout>]`
Attach the debug tools to a running app in the native emulator | `$ tns debug android --start --emulator [<Emulator Options>] [--timeout <timeout>]`
Attach the debug tools to a running app in Genymotion | `$ tns debug android --start --geny <Geny Name> [--print-app-output] [--timeout <timeout>]`
Retrieve the device port on which you are debugging | `$ tns debug android [--device <Device ID>] --get-port`
Detach the debug tools | `$ tns debug android --stop`

Debugs your project on a connected device, in a native emulator or in Genymotion.

### Options
* `--device` - Specifies a connected device on which to debug the app.
* `--emulator` - Specifies that you want to debug the app in the native Android emulator from the Android SDK.
* `--geny` - Specifies a Genymotion emulator on which you want to debug your app.
* `--debug-brk` - Prepares, builds and deploys the application package on a device or in an emulator, launches the Chrome DevTools of your Chrome browser and stops at the first code statement.
* `--start` - Attaches the debug tools to a deployed and running app.
* `--stop` - Detaches the debug tools.
* `--get-port` - Retrieves the port on which you are debugging your application.
* `--debug-port` - Sets a new port on which to attach the debug tools.
* `--timeout` - Sets the number of seconds that the NativeScript CLI will wait for the debugger to boot. If not set, the default timeout is 90 seconds.

### Attributes
* `<Device ID>` is the index or name of the target device as listed by `$ tns device`
* `<Port>` is an accessible port on the device to which you want to attach the debugging tools.
* `<Emulator Options>` is any valid combination of options as listed by `$ tns help emulate android`
* `<GenyName>` is the name of the Genymotion virtual device that you want to use as listed by `$ genyshell -c "devices list"`

<% if(isHtml) { %>
###Prerequisites

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
[livesync](livesync.html) | Synchronizes the latest changes in your project to devices.
[livesync ios](livesync-ios.html) | Synchronizes the latest changes in your project to iOS devices or the iOS Simulator.
[livesync android](livesync-android.html) | Synchronizes the latest changes in your project to Android devices.
[run android](run-android.html) | Runs your project on a connected Android device or in a native Android emulator, if configured.
[run ios](run-ios.html) | Runs your project on a connected iOS device or in the iOS Simulator, if configured.
[run](run.html) | Runs your project on a connected device or in the native emulator for the selected platform.
[test init](test-init.html) | Configures your project for unit testing with a selected framework.
[test android](test-android.html) | Runs the tests in your project on Android devices or native emulators.
[test ios](test-ios.html) | Runs the tests in your project on iOS devices or the iOS Simulator.
<% } %>