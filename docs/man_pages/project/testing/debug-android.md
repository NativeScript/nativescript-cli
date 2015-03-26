debug android
==========

Usage:
    `$ tns debug android [--device <Device ID> | --emulator <Emulator Options> | --geny <Geny Name> ] [--debug-brk | --start | --stop | --get-port] [--debug-port <port>]`

Example usage:
    `$ tns debug android --get-port`    `$ tns debug android --debug-brk [--debug-port <port>]`    
    `$ tns debug android --start [--debug-port <port>]`  
    `$ tns debug android --stop`

Debugs your project on a connected device or in a native emulator.

`<Device ID>` is the index or name of the target device as listed by `$ tns list-devices <Port>` is an accessible port on the device to which you want to attach the debugging tools.

Options:
* `--device` - Specifies a connected device on which to run the app.
* `--emulator` - Specifies that you want to debug the app in the native Android emulator from the Android SDK.
* `--geny` - Specifies a Genymotion emulator on which you want to debug your app.
* `--debug-brk` - Shorthand for prepare, build and deploy. Prepares, builds and deploys the application package on a device or in an emulator, launches the Chrome DevTools of your Chrome browser. You must have Chrome installed on your system.
* `--start` - Attaches the debug tools to a deployed and running app. Your app must be running on device.
* `--stop` - Detaches the debug tools.
* `--get-port` - Retrieves the port on which you are debugging your application.
* `--debug-port` - Sets a new port on which to attach the debug tools.
<% if(isHtml) { %> 

#### Related Commands

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
<% } %>