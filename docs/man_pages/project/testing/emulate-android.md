emulate android
==========

Usage:
    `$ tns emulate android [--path <Directory>] [--timeout <Seconds>] [--keyStorePath <File Path> --keyStorePassword <Password> --keyStoreAlias <Name> --keyStoreAliasPassword <Password>] [--release]`
    `$ tns emulate android [--avd <Name>] [--path <Directory>] [--timeout <Seconds>] [--keyStorePath <File Path> --keyStorePassword <Password> --keyStoreAlias <Name> --keyStoreAliasPassword <Password>] [--release]`
    `$ tns emulate android [--geny <GenyName>] [--path <Directory>] [--timeout <Seconds>] [--keyStorePath <File Path> --keyStorePassword <Password> --keyStoreAlias <Name> --keyStoreAliasPassword <Password>] [--release]`

Builds the specified project and runs it in a native Android emulator.

`<Name>` is the name of the Android virtual device that you want to use as listed by `$ android list avd`    You can specify only one name at a time.
`<GenyName>` is the name of the Genymotion virtual device that you want to use as listed by `$ genyshell -c "devices list"`    You can specify only one name at a time.

If you do not select an Android virtual device (AVD) with the `--avd` option or a Genymotion
virtual device with the `--geny` option, your app runs in the default AVD or a currently running emulator, if any. 
To list the available AVDs, run `$ android list avd` To list the available Genymotion devices, run `$ genyshell -c "devices list"`
To test your app on multiple Android virtual devices, run `$ tns emulate android --avd <Name>` or `$ tns emulate android --geny <GenyName>` for each virtual device.

Prerequisites:
Before running your app in the Android emulator from the Android SDK, verify that your system meets the following requirements.
* Verify that you are running the NativeScript CLI on a Windows, OS X or Linux system.
* Verify that you have installed the Android SDK.
* Verify that you have added the following Android SDK directories to the PATH environment variable:
    * platform-tools
    * tools
* Before running your app in the Genymotion emulator, verify that your system meets the following requirements.
    * Verify that you have installed Genymotion.
<% if(isLinux || isWindows) { %>    * On Windows and Linux systems, verify that you have added the Genymotion installation directory to the PATH environment variable.<% } %>
<% if(isMacOS) { %>    * On OS X systems, verify that you have added the following paths to the PATH environment variable.
        * /Applications/Genymotion.app/Contents/MacOS/
        * /Applications/Genymotion Shell.app/Contents/MacOS/
<% } %>

Options:
* `--path` - Specifies the directory that contains the project. If not specified, the project is searched for in the current directory and all directories above it.
* `--avd` - Sets the Android virtual device on which you want to run your app. You can set only one device at a time. To list the available Android virtual devices, run `$ android list avd`. You cannot use `--avd` and `--geny` simultaneously.
* `--geny` - Sets the Genymotion virtual device on which you want to run your app. You can set only one device at a time. To list the available Genymotion virtual devices, run `$ genyshell -c "devices list"`. You cannot use `--avd` and `--geny` simultaneously.      
* `--timeout` - Sets the number of seconds that the NativeScript CLI will wait for the virtual device to boot before quitting the operation and releasing the console. If not set, the default timeout is 120 seconds. To wait indefinitely, set 0.
* `--release` - If set, produces a release build. Otherwise, produces a debug build. When the `--keyStore*` options are specified, produces a signed release build.
* `--keyStorePath` - Specifies the file path to the keystore file (P12) which you want to use to code sign your APK. You can use the `--keyStore*` options along with `--release` to produce a signed release build. You need to specify all `--keyStore*` options.
* `--keyStorePassword` - Provides the password for the keystore file specified with --keyStorePath. You can use the `--keyStore*` options along with --release to produce a signed release build. You need to specify all `--keyStore*` options.
* `--keyStoreAlias` - Provides the alias for the keystore file specified with `--keyStorePath`. You can use the `--keyStore*` options along with `--release` to produce a signed release build. You need to specify all `--keyStore*` options.
* `--keyStoreAliasPassword` - Provides the password for the alias specified with `--keStoreAliasPassword`. You can use the `--keyStore*` options along with `--release` to produce a signed release build. You need to specify all `--keyStore*` options.
<% if(isHtml) { %> 

#### Related Commands

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
[run android](run-android.html) | Runs your project on a connected Android device or in a native Android emulator, if configured.
[run ios](run-ios.html) | Runs your project on a connected iOS device or in the iOS Simulator, if configured.
[run](run.html) | Runs your project on a connected device or in the native emulator for the selected platform.
<% } %>