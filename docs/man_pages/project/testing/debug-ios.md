debug ios
==========

Usage | Synopsis
---|---
Deploy on device, run the app, start Safari Web Inspector and attach the debugger | `$ tns debug ios`
Deploy on device, run the app and stop at the first code statement | `$ tns debug ios --debug-brk [--device <Device ID>] [--no-client]`
Deploy in the iOS Simulator, run the app and stop at the first code statement | `$ tns debug ios --debug-brk --emulator [<Emulator Options>] [--no-client]`
Attach the debug tools to a running app on device | `$ tns debug ios --start [--device <Device ID>] [--no-client]`
Attach the debug tools to a running app in the iOS Simulator | `$ tns debug ios --start --emulator [<Emulator Options>] [--no-client]`

Prepares, builds and deploys the project when necessary. Debugs your project on a connected device or in the iOS Simulator. <% if(isHtml) { %>Any debugging traffic is forwarded on port 8080 from the device to the local machine.<% } %>
While debugging, prints the output from the application in the console and watches for changes in your code. Once a change is detected, it synchronizes the change with all selected devices and restarts/refreshes the application.

<% if(isConsole && (isWindows || isLinux)) { %>WARNING: You can run this command only on OS X systems. To view the complete help for this command, run `$ tns help debug ios`<% } %>

<% if((isConsole && isMacOS) || isHtml) { %>
<% if(isHtml) { %>> <% } %>IMPORTANT: Before building for iOS device, verify that you have configured a valid pair of certificate and provisioning profile on your OS X system. <% if(isHtml) { %>For more information, see [Obtaining Signing Identities and Downloading Provisioning Profiles](https://developer.apple.com/library/mac/recipes/xcode_help-accounts_preferences/articles/obtain_certificates_and_provisioning_profiles.html).<% } %>

### Options
* `--device` - Specifies a connected device on which to run the app.
* `--emulator` - Indicates that you want to debug your app in the iOS simulator.
* `--debug-brk` - Prepares, builds and deploys the application package on a device or in an emulator, runs the app, launches the developer tools of your Safari browser and stops at the first code statement.
* `--start` - Attaches the debug tools to a deployed and running app and launches the developer tools of your Safari browser.
* `--no-client` - If set, the NativeScript CLI attaches the debug tools but does not launch the developer tools in Safari.
* `--timeout` - Sets the number of seconds that NativeScript CLI will wait for the debugger to boot. If not set, the default timeout is 90 seconds.
* `--no-watch` - If set, changes in your code will not be reflected during the execution of this command.
* `--clean` - If set, forces rebuilding the native application.

### Attributes
* `<Device ID>` is the index or name of the target device as listed by `$ tns device`
* `<Emulator Options>` is any valid combination of options as listed by `$ tns help emulate ios`
<% } %>
<% if(isHtml) { %>
### Prerequisite

* If you want to debug in the iOS Simulator, you must have Xcode 6 or later installed on your system.

### Command Limitations

* You can run `$ tns debug ios` only on OS X systems.

### Related Commands

Command | Description
----------|----------
[build android](build-android.html) | Builds the project for Android and produces an APK that you can manually deploy on device or in the native emulator.
[build ios](build-ios.html) | Builds the project for iOS and produces an APP or IPA that you can manually deploy in the iOS Simulator or on device, respectively.
[build](build.html) | Builds the project for the selected target platform and produces an application package that you can manually deploy on device or in the native emulator.
[debug android](debug-android.html) | Debugs your project on a connected Android device or in a native emulator.
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