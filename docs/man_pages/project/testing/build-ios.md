<% if (isJekyll) { %>---
title: tns build ios
position: 2
---<% } %>

# tns build ios

### Description

Builds the project for iOS and produces an `APP` or `IPA` that you can manually deploy in the iOS Simulator or on a device.

<% if(isConsole && (isWindows || isLinux)) { %>WARNING: You can run this command only on macOS systems. To view the complete help for this command, run `$ tns help build ios`<% } %>
<% if((isConsole && isMacOS) || isHtml) { %>
<% if(isHtml) { %>> <% } %>IMPORTANT: Before building for iOS device, verify that you have configured a valid pair of certificate and provisioning profile on your macOS system. <% if(isHtml) { %>For more information, see the [Code Signing](https://developer.apple.com/support/code-signing/) and [Maintain Signing Assets](https://help.apple.com/xcode/mac/current/#/dev3a05256b8) sections from the Apple Developer documentation.<% } %>

### Commands

Usage | Synopsis
---|---
General | `$ tns build ios [--for-device] [--release] [--copy-to <File Path>] [--provision [<UUID/name>]] [--env.*]]`

### Options

* `--release` - If set, produces a release build. Otherwise, produces a debug build.
* `--for-device` - If set, produces an application package that you can deploy on device. Otherwise, produces a build that you can run only in the native iOS Simulator.
* `--i-cloud-container-environment` - If set, adds the passed `iCloudContainerEnvironment` when exporting an application package with the `--for-device` option.
* `--copy-to` - Specifies the file path where the built `.ipa` will be copied. If it points to a non-existent directory path, it will be created. If the specified value is existing directory, the original file name will be used.
* `--team-id` - If used without parameter, lists all team names and ids. If used with team name or id, it will switch to automatic signing mode and configure the .xcodeproj file of your app. In this case .xcconfig should not contain any provisioning/team id flags. This team id will be further used for codesigning the app. For Xcode 9.0+, xcodebuild will be allowed to update and modify automatically managed provisioning profiles.
* `--provision` - If used without parameter, lists all eligible provisioning profiles. If used with UUID or name of your provisioning profile, it will switch to manual signing mode and configure the .xcodeproj file of your app. In this case xcconfig should not contain any provisioning/team id flags. This provisioning profile will be further used for codesigning the app.
* `--env.*` - Specifies additional flags that the bundler may process. Can be passed multiple times. Supported additional flags:
    *   `--env.aot` - creates Ahead-Of-Time build (Angular only).
    *   `--env.uglify` - provides basic obfuscation and smaller app size.
    *   `--env.report` - creates a Webpack report inside a `report` folder in the root folder.
    *   `--env.sourceMap` - creates inline source maps.
    *   `--env.hiddenSourceMap` - creates sources maps in the root folder (useful for Crashlytics usage with bundled app in release).
* `--force` - If set, skips the application compatibility checks and forces `npm i` to ensure all dependencies are installed. Otherwise, the command will check the application compatibility with the current CLI version and could fail requiring `tns migrate`.

<% } %>

<% if(isHtml) { %>

### Command Limitations

* You can run the `$ tns build ios` command only on macOS systems.

### Related Commands

Command | Description
----------|----------
[appstore](../../publishing/appstore.html) | Lists applications registered in iTunes Connect.
[appstore upload](../../publishing/appstore-upload.html) | Uploads project to iTunes Connect.
[build android](build-android.html) | Builds the project for Android and produces an APK that you can manually deploy on device or in the native emulator.
[build](build.html) | Builds the project for the selected target platform and produces an application package that you can manually deploy on device or in the native emulator.
[debug android](debug-android.html) | Debugs your project on a connected Android device or in a native emulator.
[debug ios](debug-ios.html) | Debugs your project on a connected iOS device or in a native emulator.
[debug](debug.html) | Debugs your project on a connected device or in a native emulator.
[deploy](deploy.html) | Builds and deploys the project to a connected physical or virtual device.
[run android](run-android.html) | Runs your project on a connected Android device or in a native Android emulator, if configured.
[run ios](run-ios.html) | Runs your project on a connected iOS device or in the iOS Simulator, if configured.
[run](run.html) | Runs your project on a connected device or in the native emulator for the selected platform.
[test init](test-init.html) | Configures your project for unit testing with a selected framework.
[test android](test-android.html) | Runs the tests in your project on Android devices or native emulators.
[test ios](test-ios.html) | Runs the tests in your project on iOS devices or the iOS Simulator.
<% } %>