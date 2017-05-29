debug
==========

Usage | Synopsis
---|---
<% if((isConsole && isMacOS) || isHtml) { %>General | `$ tns debug <Platform>`<% } %><% if(isConsole && (isLinux || isWindows)) { %>General | `$ tns debug android`<% } %>

Debugs your project on a connected device or in a native emulator. <% if(isMacOS) { %>You must specify the target platform on which you want to debug.<% } %> The command will prepare, build and deploy the app when necessary. By default listens for changes in your code, synchronizes those changes and restarts the app on the targeted device.

<% if((isConsole && isMacOS) || isHtml) { %>### Attributes
`<Platform>` is the target mobile platform for which you want to debug your project. You can set the following target platforms:
* `android` - Debugs your project on a connected Android device or Android emulator.
* `ios` - Debugs your project on a connected iOS device or in a native iOS simulator.<% } %>

<% if(isHtml) { %>
### Command Limitations

* You can run `$ tns debug ios` only on OS X systems.

### Related Commands

Command | Description
----------|----------
[build android](build-android.html) | Builds the project for Android and produces an APK that you can manually deploy on device or in the native emulator.
[build ios](build-ios.html) | Builds the project for iOS and produces an APP or IPA that you can manually deploy in the iOS Simulator or on device, respectively.
[build](build.html) | Builds the project for the selected target platform and produces an application package that you can manually deploy on device or in the native emulator.
[debug android](debug-android.html) | Debugs your project on a connected Android device or in a native emulator.
[debug ios](debug-ios.html) | Debugs your project on a connected iOS device or in a native emulator.
[deploy](deploy.html) | Builds and deploys the project to a connected physical or virtual device.
[run android](run-android.html) | Runs your project on a connected Android device or in a native Android emulator, if configured.
[run ios](run-ios.html) | Runs your project on a connected iOS device or in the iOS Simulator, if configured.
[run](run.html) | Runs your project on a connected device or in the native emulator for the selected platform.
[test init](test-init.html) | Configures your project for unit testing with a selected framework.
[test android](test-android.html) | Runs the tests in your project on Android devices or native emulators.
[test ios](test-ios.html) | Runs the tests in your project on iOS devices or the iOS Simulator.
<% } %>