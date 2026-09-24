<% if (isJekyll) { %>---
title: ns run windows
position: 11
---<% } %>

# ns run windows

### Description

Runs your project on the local Windows machine. This is shorthand for prepare, build, deploy and launch. While your app is running, prints the output from the application in the console and watches for changes in your code. Once a change is detected, it synchronizes the change with the running application.

<% if(isConsole && (isLinux || isMacOS)) { %>WARNING: You can run this command only on Windows systems. To view the complete help for this command, run `$ ns help run windows`<% } %>
<% if((isConsole && isWindows) || isHtml) { %>
When running this command without passing `--release` flag, the app is built in debug configuration with the DevTools server enabled on port 9229.
<% } %>

### Commands

Usage | Synopsis
---|---
Run on the local Windows device | `$ ns run windows [--release] [--justlaunch] [--env.*]`

### Options

* `--justlaunch` - If set, does not print the application output in the console.
* `--release` - If set, produces a release build. Otherwise, produces a debug build.
* `--no-hmr` - Disables Hot Module Replacement (HMR). When a change in the code is applied, CLI will transfer the modified files and restart the application.
* `--env.*` - Specifies additional flags that the bundler may process. Can be passed multiple times. Supported additional flags:
    *   `--env.aot` - creates Ahead-Of-Time build (Angular only).
    *   `--env.uglify` - provides basic obfuscation and smaller app size.
    *   `--env.report` - creates a Webpack report inside a `report` folder in the root folder.
    *   `--env.sourceMap` - creates inline source maps.
* `--force` - If set, skips the application compatibility checks and forces `npm i` to ensure all dependencies are installed.

<% if(isHtml) { %>

### Prerequisites

Before running your app, verify that your system meets the following requirements.
* Windows 10 version 1809 (build 17763) or later.
* [.NET 10 SDK](https://dotnet.microsoft.com/download) with the Windows App SDK workload installed.
* Developer Mode enabled in Windows Settings → Privacy & Security → For Developers.

### Command Limitations

* You can run `$ ns run windows` only on Windows systems.

### Related Commands

Command | Description
----------|----------
[build windows](build-windows.html) | Builds the project for Windows and produces an MSIX package.
[build android](build-android.html) | Builds the project for Android.
[build ios](build-ios.html) | Builds the project for iOS.
[build](build.html) | Builds the project for the selected target platform.
[debug windows](debug-windows.html) | Debugs your project on the local Windows machine.
[debug android](debug-android.html) | Debugs your project on a connected Android device or in a native emulator.
[debug ios](debug-ios.html) | Debugs your project on a connected iOS device or in a native emulator.
[debug](debug.html) | Debugs your project on a connected device or in a native emulator.
[run android](run-android.html) | Runs your project on a connected Android device or in a native Android emulator, if configured.
[run ios](run-ios.html) | Runs your project on a connected iOS device or in the iOS Simulator, if configured.
[run](run.html) | Runs your project on a connected device or in the native emulator for the selected platform.
<% } %>
