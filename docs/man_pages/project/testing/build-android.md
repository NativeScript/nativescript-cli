build android
==========

Usage:
    `$ tns build android [--keyStorePath <File Path> --keyStorePassword <Password> --keyStoreAlias <Name> --keyStoreAliasPassword <Password>] [--release]`

Builds the project for Android and produces an APK that you can manually deploy on device or in the native emulator.

Options:
* `--release` - If set, produces a release build. Otherwise, produces a debug build. When the `--keyStore*` options are specified, produces a signed release build.
* `--keyStorePath` - Specifies the file path to the keystore file (P12) which you want to use to code sign your APK. You can use the `--keyStore*` options along with `--release` to produce a signed release build. You need to specify all `--keyStore*` options.
* `--keyStorePassword` - Provides the password for the keystore file specified with `--keyStorePath`. You can use the `--keyStore*` options along with `--release` to produce a signed release build. You need to specify all `--keyStore*` options.
* `--keyStoreAlias` - Provides the alias for the keystore file specified with `--keyStorePath`. You can use the `--keyStore*` options along with `--release` to produce a signed release build. You need to specify all `--keyStore*` options.
* `--keyStoreAliasPassword` - Provides the password for the alias specified with `--keStoreAliasPassword`. You can use the `--keyStore*` options along with `--release` to produce a signed release build. You need to specify all `--keyStore*` options.
<% if(isHtml) { %> 

#### Related Commands

Command | Description
----------|----------
[build ios](build-ios.html) | Builds the project for iOS and produces an APP or IPA that you can manually deploy in the iOS Simulator or on device, respectively.
[build](build.html) | Builds the project for the selected target platform and produces an application package that you can manually deploy on device or in the native emulator.
[debug android](debug-android.html) | Debugs your project on a connected Android device or in a native emulator.
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