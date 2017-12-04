debug ios
==========

Usage | Synopsis
---|---
Deploy on device/simulator, run the app, start Safari Web Inspector and attache the debugger | `$ tns debug ios`
Deploy on device/simulator, run the app and stop at the first code statement | `$ tns debug ios --debug-brk [--device <Device ID>] [--no-client]`
Deploy in the iOS simulator, run the app and stop at the first code statement | `$ tns debug ios --debug-brk --emulator [--no-client]`
Attach the debug tools to a running app on specified device or simulator| `$ tns debug ios --start [--device <Device ID>] [--no-client]`
Attach the debug tools to a running app in the iOS simulator | `$ tns debug ios --start --emulator [--no-client]`

Prepares, builds and deploys the project when necessary. Debugs your project on a connected device or in the iOS simulator. <% if(isHtml) { %>Any debugging traffic is forwarded to port 8080( or the next available one) from the device to the local machine.<% } %>
While debugging, prints the output from the application in the console and watches for changes in your code. Once a change is detected, it synchronizes the change with the selected device and restarts the application.

<% if(isConsole && (isWindows || isLinux)) { %>WARNING: You can run this command only on OS X systems. To view the complete help for this command, run `$ tns help debug ios`<% } %>

<% if((isConsole && isMacOS) || isHtml) { %>
<% if(isHtml) { %>> <% } %>IMPORTANT: Before building for iOS device, verify that you have configured a valid pair of certificate and provisioning profile on your OS X system. <% if(isHtml) { %>For more information, see [Obtaining Signing Identities and Downloading Provisioning Profiles](https://developer.apple.com/library/mac/recipes/xcode_help-accounts_preferences/articles/obtain_certificates_and_provisioning_profiles.html).<% } %>

### Options
* `--device` - Specifies a connected device or iOS simulator on which to run the app.
* `--emulator` - Indicates that you want to debug your app in the iOS simulator.
* `--debug-brk` - Prepares, builds and deploys the application package on a device or in a simulator, runs the app, launches the developer tools of your Safari browser and stops at the first code statement.
* `--start` - Attaches the debug tools to a deployed and running app and launches the developer tools of your Safari browser.
* `--no-client` - If set, the NativeScript CLI attaches the debug tools but does not launch the developer tools in Safari. Could be used on already started Safari Web Inspector.
* `--timeout` - Sets the number of seconds that NativeScript CLI will wait for the simulator/device to boot. If not set, the default timeout is 90 seconds.
* `--no-watch` - If set, changes in your code will not be reflected during the execution of this command.
* `--clean` - If set, forces rebuilding the native application.
* `--chrome` - Deprecated - default behavior uses '--chrome' implicitly. Allows debugging in Chrome Developer Tools. If set, Safari Web Inspector is not started and debugging is attached to Chrome Developer Tools.
* `--inspector` - If set, the developer tools in the Safari Web Inspector are used for debugging the application.

### Attributes
* `<Device ID>` is the device identifier of the target device as listed by `$ tns device ios`
<% } %>
<% if(isHtml) { %>
### Prerequisite

* If you want to debug in the iOS simulator, you must have Xcode 6 or later installed on your system.

### Command Limitations

* You can run `$ tns debug ios` only on OS X systems.

### Related Commands

Command | Description
----------|----------
[build](build.html) | Builds the project for the selected target platform and produces an application package that you can manually deploy on device or in the native emulator.
[build ios](build-ios.html) | Builds the project for iOS and produces an APP or IPA that you can manually deploy in the iOS simulator or on device, respectively.
[debug](debug.html) | Debugs your project on a connected device or in a native emulator.
[debug android](debug-android.html) | Debugs your project on a connected Android device or in a native emulator.
[deploy](deploy.html) | Builds and deploys the project to a connected physical or virtual device.
[device](../../device/device.html) | Lists all connected devices/emulators.
[device ios](../../device/device-ios.html) | Lists all connected devices/simulators for iOS.
[run](run.html) | Runs your project on a connected device or in the native emulator for the selected platform.
[run ios](run-ios.html) | Runs your project on a connected iOS device or in the iOS simulator, if configured.
[test init](test-init.html) | Configures your project for unit testing with a selected framework.
[test ios](test-ios.html) | Runs the tests in your project on iOS devices or the iOS simulator.
<% } %>