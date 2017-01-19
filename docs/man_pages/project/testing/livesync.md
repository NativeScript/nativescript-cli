livesync
==========

Usage | Synopsis
------|-------
General | `$ tns livesync [<Platform>]`

Synchronizes the latest changes in your project to devices.

`This command is deprecated. It will be removed in the next version of NativeScript CLI. Use the "run" command instead.`

### Attributes
`<Platform>` is the target mobile platform to which you want to synchronize your changes. <% if(isHtml) { %>If you have connected only Android or only iOS devices, you can omit setting the target platform. If you have connected devices of multiple platforms, you must specify the target platform. <% } %>You can set the following target platforms.
* `android` - Synchronizes the latest changes in your project to connected Android devices.
* `ios` - Synchronizes the latest changes in your project to connected iOS devices.
* All installed platforms and the corresponding devices/emulators will be synchronized when started without a platform.

<% if(isHtml) { %>
### Command Limitations

* You cannot run this command on Android 4.3 devices and on some Samsung devices.

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
[livesync ios](livesync-ios.html) | Synchronizes the latest changes in your project to iOS devices or the iOS Simulator.
[livesync android](livesync-android.html) | Synchronizes the latest changes in your project to Android devices.
[run android](run-android.html) | Runs your project on a connected Android device or in a native Android emulator, if configured.
[run ios](run-ios.html) | Runs your project on a connected iOS device or in the iOS Simulator, if configured.
[test init](test-init.html) | Configures your project for unit testing with a selected framework.
[test android](test-android.html) | Runs the tests in your project on Android devices or native emulators.
[test ios](test-ios.html) | Runs the tests in your project on iOS devices or the iOS Simulator.
<% } %>