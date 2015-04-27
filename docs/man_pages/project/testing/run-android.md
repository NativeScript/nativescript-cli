run android
==========

Usage | Synopsis
---|---
Run on all connected devices and running emulators | `$ tns run android [--keyStorePath <File Path> --keyStorePassword <Password> --keyStoreAlias <Name> --keyStoreAliasPassword <Password>] [--release] [--justlaunch]`
Run on a selected connected device or running emulator | `$ tns run android --device <Device ID> [--keyStorePath <File Path> --keyStorePassword <Password> --keyStoreAlias <Name> --keyStoreAliasPassword <Password>] [--release] [--justlaunch]`
Start an emulator and run the app inside it | `$ tns run android --emulator [<Emulator Options>] [--keyStorePath <File Path> --keyStorePassword <Password> --keyStoreAlias <Name> --keyStoreAliasPassword <Password>] [--release] [--justlaunch]`

Runs your project on a connected Android device or in a native Android emulator, if configured. This is shorthand for prepare, build and deploy.

### Options
* `--device` - Specifies a connected device on which to run the app. 
* `--emulator` - If set, runs the app in a native emulator for the target platform, if configured. When set, you can also set any other valid combination of emulator options as listed by `$ tns help emulate android`. 
* `--release` - If set, produces a release build. Otherwise, produces a debug build. When the `--keyStore*` options are specified, produces a signed release build.
* `--keyStorePath` - Specifies the file path to the keystore file (P12) which you want to use to code sign your APK. You can use the `--keyStore*` options along with `--release` to produce a signed release build. You need to specify all `--keyStore*` options.
* `--keyStorePassword` - Provides the password for the keystore file specified with `--keyStorePath`. You can use the `--keyStore*` options along with `--release` to produce a signed release build. You need to specify all `--keyStore*` options.
* `--keyStoreAlias` - Provides the alias for the keystore file specified with `--keyStorePath`. You can use the `--keyStore*` options along with `--release` to produce a signed release build. You need to specify all `--keyStore*` options.
* `--keyStoreAliasPassword` - Provides the password for the alias specified with `--keStoreAliasPassword`. You can use the `--keyStore*` options along with `--release` to produce a signed release build. You need to specify all `--keyStore*` options.
* `--justlaunch` - If set, does not print application output on the console. Otherwise prints the application output on the console. 

### Attributes
* `<Device ID>` is the index or name of the target device as listed by `$ tns device android`
* `<Emulator Options>` is any valid combination of options as listed by `$ tns help emulate android`

<% if(isHtml) { %> 
###Prerequisites:
Before running your app in the Android emulator from the Android SDK, verify that your system meets the following requirements.
* Verify that you have installed the Android SDK.
* Verify that you have added the following Android SDK directories to the `PATH` environment variable:
    * `platform-tools`
    * `tools`
* Before running your app in the Genymotion emulator, verify that your system meets the following requirements.
    * Verify that you have installed Genymotion.
	* On Windows and Linux systems, verify that you have added the Genymotion installation directory to the `PATH` environment variable.
	* On OS X systems, verify that you have added the following paths to the `PATH` environment variable.
        * `/Applications/Genymotion.app/Contents/MacOS/`
        * `/Applications/Genymotion Shell.app/Contents/MacOS/`

### Command Limitations

* You cannot use `--device` and `--emulator` simultaneously.

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
[emulate android](emulate-android.html) | Builds the specified project and runs it in a native Android emulator.
[emulate ios](emulate-ios.html) | Builds the specified project and runs it in the native iOS Simulator.
[emulate](emulate.html) | You must run the emulate command with a related command.
[run ios](run-ios.html) | Runs your project on a connected iOS device or in the iOS Simulator, if configured.
[run](run.html) | Runs your project on a connected device or in the native emulator for the selected platform.
<% } %>