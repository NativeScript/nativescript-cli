emulate ios
==========

Usage:
    `$ tns emulate ios [--path <Directory>] [--device <Device Name>] [--availableDevices] [--release] [--timeout]`

Builds the specified project in the cloud and runs it in the native iOS Simulator.

`<Device Name>` is the name of the iOS Simulator device on which you want to run your app as listed by `$ tns emulate ios --availableDevices`
Prerequisites:
Before running the iOS Simulator, verify that you have met the following requirements.
* You are running the NativeScript CLI on OS X.
* You have installed Xcode. The version of Xcode must be compatible with the ios-sim-portable npm package on which the NativeScript CLI depends. For more information, visit https://www.npmjs.org/package/ios-sim-portable

Options:
* `--availableDevices` - Lists all available device type identifiers for the current XCode.
* `--release` - If set, produces a release build. Otherwise, produces a debug build.
* `--path` - Specifies the directory that contains the project. If not specified, the project is searched for in the current directory and all directories above it.
* `--device` - Specifies the name of the iOS Simulator device on which you want to run your app. To list the available iOS Simulator devices, run `$ tns emulate ios --availableDevices`
* `--timeout` - Sets the number of seconds that the NativeScript CLI will wait for the iOS Simulator to start before quitting the operation and releasing the console. The value must be a positive integer. If not set, the default timeout is 90 seconds.
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
[emulate android](emulate-android.html) | Builds the specified project and runs it in a native Android emulator.
[emulate](emulate.html) | You must run the emulate command with a related command.
[run android](run-android.html) | Runs your project on a connected Android device or in a native Android emulator, if configured.
[run ios](run-ios.html) | Runs your project on a connected iOS device or in the iOS Simulator, if configured.
[run](run.html) | Runs your project on a connected device or in the native emulator for the selected platform.
<% } %>