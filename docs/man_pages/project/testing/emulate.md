emulate
==========

Usage | Synopsis
---|---
<% if((isConsole && isMacOS) || isHtml) { %>General | `$ tns emulate <Platform>`<% } %><% if(isConsole && (isLinux || isWindows)) { %>General | `$ tns emulate android`<% } %>

Runs the project in the native emulator for the selected target platform. <% if(isMacOS) { %>You must specify the target platform for which you want to build your project.<% } %> The command will prepare, build and deploy the app when necessary. By default listens for changes in your code, synchronizes those changes and refreshes all selected emulators.

<% if((isConsole && isMacOS) || isHtml) { %>### Attributes
`<Platform>` is the target mobile platform for which you want to emulate your project. You can set the following target platforms.
* `android` - Builds the specified project and runs it in the native Android emulator.
* `ios` - Builds the specified project and runs it in the native iOS Simulator.<% } %>

<% if(isHtml) { %>
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
[run android](run-android.html) | Runs your project on a connected Android device or in a native Android emulator, if configured.
[run ios](run-ios.html) | Runs your project on a connected iOS device or in the iOS Simulator, if configured.
[run](run.html) | Runs your project on a connected device or in the native emulator for the selected platform.
[test init](test-init.html) | Configures your project for unit testing with a selected framework.
[test android](test-android.html) | Runs the tests in your project on Android devices or native emulators.
[test ios](test-ios.html) | Runs the tests in your project on iOS devices or the iOS Simulator.
<% } %>