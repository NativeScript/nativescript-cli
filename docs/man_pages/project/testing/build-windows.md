<% if (isJekyll) { %>---
title: ns build windows
position: 4
---<% } %>

# ns build windows

### Description

Builds the project for Windows and produces an MSIX package that you can deploy on any Windows 10/11 machine with Developer Mode enabled.

<% if(isConsole && (isLinux || isMacOS)) { %>WARNING: You can run this command only on Windows systems. To view the complete help for this command, run `$ ns help build windows`<% } %>
<% if((isConsole && isWindows) || isHtml) { %>
### Commands

Usage | Synopsis
---|---
General | `$ ns build windows [--release] [--env.*]`

### Options

* `--release` - If set, produces a release build. Otherwise, produces a debug build with DevTools support enabled.
* `--env.*` - Specifies additional flags that the bundler may process. Can be passed multiple times. Supported additional flags:
    *   `--env.aot` - creates Ahead-Of-Time build (Angular only).
    *   `--env.uglify` - provides basic obfuscation and smaller app size.
    *   `--env.report` - creates a Webpack report inside a `report` folder in the root folder.
    *   `--env.sourceMap` - creates inline source maps.
* `--force` - If set, skips the application compatibility checks and forces `npm i` to ensure all dependencies are installed.

<% } %>

<% if(isHtml) { %>

### Prerequisites

* Windows 10 version 1809 (build 17763) or later.
* [.NET 10 SDK](https://dotnet.microsoft.com/download) with the Windows App SDK workload installed (`dotnet workload install windows`).
* MSBuild available in `PATH` (installed with Visual Studio or the .NET SDK).

### Command Limitations

* You can run `$ ns build windows` only on Windows systems.

### Related Commands

Command | Description
----------|----------
[build android](build-android.html) | Builds the project for Android and produces an APK.
[build ios](build-ios.html) | Builds the project for iOS and produces an APP or IPA.
[build](build.html) | Builds the project for the selected target platform.
[debug windows](debug-windows.html) | Debugs your project on the local Windows machine.
[run windows](run-windows.html) | Runs your project on the local Windows machine.
[run android](run-android.html) | Runs your project on a connected Android device or in a native Android emulator, if configured.
[run ios](run-ios.html) | Runs your project on a connected iOS device or in the iOS Simulator, if configured.
[run](run.html) | Runs your project on a connected device or in the native emulator for the selected platform.
<% } %>
