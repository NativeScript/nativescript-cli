run ios
==========

Usage:
    `$ tns run ios [--device <Device ID>] [--release]`
    `$ tns run ios --emulator [<Emulator Options>] [--release]`

Runs your project on a connected iOS device or in the iOS Simulator, if configured. This is shorthand for prepare, build, and deploy.

`<Device ID>` is the index or name of the target device as listed by `$ tns device <Emulator Options>` is any valid combination of options as listed by `$ tns help emulate ios`
Prerequisites:
Before building for iOS device, verify that you have configured a valid pair of certificate and provisioning profile on your OS X system.

Before running the iOS Simulator, verify that you have met the following requirements.
* You are running the NativeScript CLI on OS X.
* You have installed Xcode. The version of Xcode must be compatible with the ios-sim-portable npm package on which the  NativeScript CLI depends. For more information, visit https://www.npmjs.org/package/ios-sim-portable

Options:
* `--device` - Specifies a connected device on which to run the app. You cannot use `--device` and `--emulator` simultaneously.
* `--emulator` - If set, runs the app in a native emulator for the target platform, if configured. When set, you can also set any other valid combination of emulator options as listed by `$ tns help emulate ios`. You cannot use `--device` and `--emulator` simultaneously.
* `--release` - If set, produces a release build. Otherwise, produces a debug build.
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
[emulate ios](emulate-ios.html) | Builds the specified project and runs it in the native iOS Simulator.
[emulate](emulate.html) | You must run the emulate command with a related command.
[run android](run-android.html) | Runs your project on a connected Android device or in a native Android emulator, if configured.
[run](run.html) | Runs your project on a connected device or in the native emulator for the selected platform.
<% } %>