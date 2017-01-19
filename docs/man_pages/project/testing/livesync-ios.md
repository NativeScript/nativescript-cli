livesync ios
==========

Usage | Synopsis
------|-------
Synchronize changes to all connected devices | `$ tns livesync ios [--watch]`
Synchronize changes to a selected device | `$ tns livesync ios --device <Device ID> [--watch]`
Synchronize changes to the iOS Simulator | `$ tns livesync ios --emulator [--watch]`

Synchronizes the latest changes in your project to iOS devices or the iOS Simulator.

`This command is deprecated. It will be removed in the next version of NativeScript CLI. Use the "run" command instead.`

### Options
* `--watch` - If set, when you save changes to the project, changes are automatically synchronized to the connected device.
* `--device` - Specifies the serial number or the index of the connected device to which you want to synchronize changes. To list all connected devices, grouped by platform, run `$ tns device`. You cannot set `--device` and `--emulator` simultaneously.
* `--emulator` - Synchronizes changes to the iOS Simulator. You cannot set `--device` and `--emulator` simultaneously.

### Attributes
* `<Device ID>` is the device index or identifier as listed by `$ tns device`

<% if(isHtml) { %>
### Command Limitations

* You cannot set `--device` and `--emulator` simultaneously.

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
[emulate android](emulate-android.html) | Builds the specified project and runs it in a native Android emulator.
[emulate ios](emulate-ios.html) | Builds the specified project and runs it in the native iOS Simulator.
[emulate](emulate.html) | You must run the emulate command with a related command.
[livesync](livesync.html) | Synchronizes the latest changes in your project to devices.
[livesync android](livesync-android.html) | Synchronizes the latest changes in your project to Android devices.
[run android](run-android.html) | Runs your project on a connected Android device or in a native Android emulator, if configured.
[run ios](run-ios.html) | Runs your project on a connected iOS device or in the iOS Simulator, if configured.
[test init](test-init.html) | Configures your project for unit testing with a selected framework.
[test android](test-android.html) | Runs the tests in your project on Android devices or native emulators.
[test ios](test-ios.html) | Runs the tests in your project on iOS devices or the iOS Simulator.
<% } %>