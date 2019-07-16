<% if (isJekyll) { %>---
title: tns debug
position: 6
---<% } %>

# tns debug

### Description

Initiates a debugging session for your project on a connected device or native emulator. <% if(isMacOS) { %>You must specify the target platform on which you want to debug.<% } %> When necessary, the command will prepare, build, deploy and launch the app before starting the debug session. While debugging, the output from the application is printed in the console and any changes made to your code are synchronized on all connected devices or running emulators.

<% if(isHtml) { %>
#### How file changes are handled
With HMR (Hot Module Replacement):
* Changes in `.js`, `.ts`, `.less`, `.sass` and other file types that are accepted will cause a refresh of the application.
* Changes in `App_Resources` will cause a rebuild of the application.
* Changes in any `package.json` file inside the project will cause a rebuild of the application.
* Changes in `node_modules/somePlugin` if accepted will cause a refresh of the application.
* Changes in `node_modules/somePlugin/platforms` will cause a rebuild of the application.
* Changes in `node_modules/somePlugin/package.json` file will cause a rebuild of the application.
* Changes that are not accepted and HMR fails will cause a restart of the native application.

With **no** HMR:
* Changes in `.js`, `.ts`, `.less`, `.sass` and other file types will cause a restart of the native application.
* Changes in `App_Resources` will cause a rebuild of the application.
* Changes in any `package.json` file inside the project will cause a rebuild of the application.
* Changes in `node_modules/somePlugin` will cause a restart of the native application.
* Changes in `node_modules/somePlugin/platforms` will cause a rebuild of the application.
* Changes in `node_modules/somePlugin/package.json` file will cause a rebuild of the application.

When running this command with `--debug-brk` any file change will cause a restart of the native application (HMR is disabled). Changes in `App_Resources` and `node_modules/somePlugin/platforms` will cause a rebuild of the application.
<% } %>

### Commands

Usage | Synopsis
---|---
<% if((isConsole && isMacOS) || isHtml) { %>General | `$ tns debug <Platform>`<% } %><% if(isConsole && (isLinux || isWindows)) { %>General | `$ tns debug android`<% } %>

<% if((isConsole && isMacOS) || isHtml) { %>### Arguments
`<Platform>` is the target mobile platform for which you want to debug your project. You can set the following target platforms:
* `android` - Start a debugging session for your project on a connected Android device or Android emulator.
* `ios` - Start a debugging session for your project on a connected iOS device or in the native iOS simulator.<% } %>

<% if(isHtml) { %>

### Command Limitations

* You can run `$ tns debug ios` only on macOS systems.

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