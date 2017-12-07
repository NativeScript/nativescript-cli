build ios
==========

Usage | Synopsis
---|---
General | `$ tns build ios [--for-device] [--release] [--copy-to <File Path>] [--provision [<UUID/name>]] [--bundle [<value>] [--env.*]]`

Builds the project for iOS and produces an `APP` or `IPA` that you can manually deploy in the iOS Simulator or on device, respectively.

<% if(isConsole && (isWindows || isLinux)) { %>WARNING: You can run this command only on OS X systems. To view the complete help for this command, run `$ tns help build ios`<% } %>
<% if((isConsole && isMacOS) || isHtml) { %>
<% if(isHtml) { %>> <% } %>IMPORTANT: Before building for iOS device, verify that you have configured a valid pair of certificate and provisioning profile on your OS X system. <% if(isHtml) { %>For more information, see [Obtaining Signing Identities and Downloading Provisioning Profiles](https://developer.apple.com/library/mac/recipes/xcode_help-accounts_preferences/articles/obtain_certificates_and_provisioning_profiles.html).<% } %>

### Options
* `--release` - If set, produces a release build. Otherwise, produces a debug build.
* `--for-device` - If set, produces an application package that you can deploy on device. Otherwise, produces a build that you can run only in the native iOS Simulator.
* `--copy-to` - Specifies the file path where the built `.ipa` will be copied. If it points to a non-existent directory, it will be created. If the specified value is directory, the original file name will be used.
* `--team-id` - If used without parameter, lists all team names and ids. If used with team name or id, it will switch to automatic signing mode and configure the .xcodeproj file of your app. In this case .xcconfig should not contain any provisioning/team id flags. This team id will be further used for codesigning the app. For Xcode 9.0+, xcodebuild will be allowed to update and modify automatically managed provisioning profiles.
* `--provision` - If used without parameter, lists all eligible provisioning profiles. If used with UUID or name of your provisioning profile, it will switch to manual signing mode and configure the .xcodeproj file of your app. In this case xcconfig should not contain any provisioning/team id flags. This provisioning profile will be further used for codesigning the app.
* `--bundle` - Specifies that a bundler (e.g. webpack) should be used if one is present. If no value is passed will default to `webpack`.
* `--env.*` - Specifies additional flags that the bundler may process. May be passed multiple times. For example: `--env.uglify --env.snapshot`.
<% } %>
<% if(isHtml) { %>
### Command Limitations

* You can run `$ tns build ios` only on OS X systems.

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