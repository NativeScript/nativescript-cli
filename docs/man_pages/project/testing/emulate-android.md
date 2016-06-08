emulate android
==========

Usage | Synopsis
---|---
Run in the native emulator | `$ tns emulate android [--device <Name>] [--path <Directory>] [--timeout <Seconds>] [--key-store-path <File Path> --key-store-password <Password> --key-store-alias <Name> --key-store-alias-password <Password>] [--release] [--justlaunch]`
Run in Genymotion | `$ tns emulate android --geny <GenyName> [--path <Directory>] [--timeout <Seconds>] [--key-store-path <File Path> --key-store-password <Password> --key-store-alias <Name> --key-store-alias-password <Password>] [--release] [--justlaunch]`
Run in the default Android virtual device or in a currently running emulator | `$ tns emulate android [--path <Directory>] [--timeout <Seconds>] [--key-store-path <File Path> --key-store-password <Password> --key-store-alias <Name> --key-store-alias-password <Password>] [--release] [--justlaunch]`

Builds the specified project and runs it in the native emulator from the Android SDK or Genymotion. While your app is running, prints the output from the application in the console.<% if(isHtml) { %>If you do not select an Android virtual device (AVD) with the `--device` option or a Genymotion virtual device with the `--geny` option, your app runs in the default AVD or a currently running emulator, if any. <% } %>

### Options
* `--path` - Specifies the directory that contains the project. If not specified, the project is searched for in the current directory and all directories above it.
* `--device` - Sets the Android virtual device on which you want to run your app. You can set only one device at a time. You cannot use `--device` and `--geny` simultaneously.
* `--geny` - Sets the Genymotion virtual device on which you want to run your app. You can set only one device at a time. You cannot use `--device` and `--geny` simultaneously.
* `--timeout` - Sets the number of seconds that the NativeScript CLI will wait for the virtual device to boot before quitting the operation and releasing the console. If not set, the default timeout is 120 seconds. To wait indefinitely, set 0.
* `--release` - If set, produces a release build. Otherwise, produces a debug build. When set, you must also specify the `--key-store-*` options.
* `--key-store-path` - Specifies the file path to the keystore file (P12) which you want to use to code sign your APK. You can use the `--key-store-*` options along with `--release` to produce a signed release build. You need to specify all `--key-store-*` options.
* `--key-store-password` - Provides the password for the keystore file specified with --key-store-path. You can use the `--key-store-*` options along with --release to produce a signed release build. You need to specify all `--key-store-*` options.
* `--key-store-alias` - Provides the alias for the keystore file specified with `--key-store-path`. You can use the `--key-store-*` options along with `--release` to produce a signed release build. You need to specify all `--key-store-*` options.
* `--key-store-alias-password` - Provides the password for the alias specified with `--key-store-alias-password`. You can use the `--key-store-*` options along with `--release` to produce a signed release build. You need to specify all `--key-store-*` options.
* `--justlaunch` - If set, does not print the application output in the console.

### Attributes
* `<Name>` is the name of the Android virtual device that you want to use as listed by `$ android list avd`
* `<GenyName>` is the name of the Genymotion virtual device that you want to use as listed by `$ genyshell -c "devices list"`

<% if(isHtml) { %>
### Prerequisites
Before running your app in the Android emulator from the Android SDK, verify that your system meets the following requirements.
* Verify that you have installed the Android SDK.
* Verify that you have added the following Android SDK directories to the `PATH` environment variable:
    * `platform-tools`
    * `tools`
* Before running your app in the Genymotion emulator, verify that your system meets the following requirements.
    * Verify that you have installed Genymotion.
	* On Windows and Linux systems, verify that you have added the Genymotion installation directory to the `PATH` environment variable.
	* On OS X systems, verify that you have added the following paths to the PATH environment variable.
        * For Genymotion earlier than 2.6:
            * `/Applications/Genymotion.app/Contents/MacOS/`
            * `/Applications/Genymotion Shell.app/Contents/MacOS/`
        * For Genymotion 2.6:
            * `/Applications/Genymotion.app/Contents/MacOS/player.app/Contents/MacOS`
            * `/Applications/Genymotion Shell.app/Contents/MacOS/`

### Command Limitations

* You can run this command for one virtual device at a time. To test your app on multiple Android virtual devices, run `$ tns emulate android --device <Name>` or `$ tns emulate android --geny <GenyName>` for each virtual device.
* When the `--release` flag is set, you must also specify all `--key-store-*` options.

### Related Commands

Command | Description
----------|----------
[build android](build-android.html) | Builds the project for Android and produces an APK that you can manually deploy on device or in the native emulator.
[build ios](build-ios.html) | Builds the project for iOS and produces an APP or IPA that you can manually deploy in the iOS Simulator or on device, respectively.
[build](build.html) | Builds the project for the selected target platform and produces an application package that you can manually deploy on device or in the native emulator.
[debug android](debug-android.html) | Debugs your project on a connected Android device or in a native emulator.
[debug ios](debug-ios.html) | Debugs your project on a connected iOS device or in a native emulator.
[debug](debug.html) | Debugs your project on a connected device or in a native emulator.
[deploy](deploy.html) | Builds and deploys the project to a connected physical or virtual device.
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