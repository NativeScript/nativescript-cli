debug ios
==========

Usage:
    `$ tns debug ios [--debug-brk | --start] [--device <Device ID> | --emulator <Emulator Options>] [--no-client]`

Example usage:
    `$ tns debug ios --debug-brk`
    `$ tns debug ios --start`
    `$ tns debug ios --debug-brk --emulator`
    `$ tns debug ios --start --emulator`	

Debugs your project on a connected device or in a native emulator.

`<Device ID>` is the index or name of the target device as listed by `$ tns list-devices`
Before debugging on iOS device, verify that you have configured a valid pair of development certificate and provisioning profile on your OS X system.
Debugging on iOS device will forward the debugging traffic on port 8080 from the device to the local machine.

Debugging on emulator will require an already started emulator and Xcode 6 or later.

Options:
* `--debug-brk` - Shorthand for prepare, build and deploy. Prepares, builds and deploys the application package on a device or in an emulator, launches the developer tools of your Safari browser.
* `--start` - Attaches the debug tools to a deployed and running app. Your app must be running on device or emulator, launches the developer tools of your Safari browser.
* `--emulator` - Debug on already running emulator. Requires `xcrun` from Xcode 6 or later.
* `--no-client` - Suppresses the launch of the developer tools in Safari.
<% if(isHtml) { %> 

#### Related Commands

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
<% } %>