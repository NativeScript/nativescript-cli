<% if (isJekyll) { %>---
title: ns debug windows
position: 7
---<% } %>

# ns debug windows

### Description

Initiates a debugging session for your project on the local Windows machine. When necessary, the command will prepare, build, deploy and launch the app before starting the debug session. The NativeScript runtime starts a Chrome DevTools Protocol server on port 9229 — attach Chrome DevTools or any CDP-compatible debugger to `ws://localhost:9229`.

<% if(isConsole && (isLinux || isMacOS)) { %>WARNING: You can run this command only on Windows systems. To view the complete help for this command, run `$ ns help debug windows`<% } %>
<% if((isConsole && isWindows) || isHtml) { %>
### Commands

Usage | Synopsis
---|---
Deploy, run and attach the Chrome DevTools debugger | `$ ns debug windows [--device <Device ID>] [--timeout <timeout>]`
Deploy, run and stop at the first code statement | `$ ns debug windows --debug-brk [--timeout <timeout>]`
Attach the debug tools to a running app | `$ ns debug windows --start [--timeout <timeout>]`

### Options

* `--debug-brk` - Builds, deploys and launches the application and stops at the first JavaScript statement.
* `--start` - Attaches the debug tools to a deployed and running app without restarting it.
* `--timeout` - Sets the number of seconds that the NativeScript CLI will wait for the app to launch. Default: 90 seconds.
* `--no-watch` - If set, changes in your code will not be reflected during the execution of this command.
* `--no-hmr` - Disables Hot Module Replacement (HMR).
* `--env.*` - Specifies additional flags that the bundler may process. Can be passed multiple times.
* `--force` - If set, skips the application compatibility checks and forces `npm i` to ensure all dependencies are installed.

<% } %>

<% if(isHtml) { %>

### Prerequisites

* Windows 10 version 1809 (build 17763) or later.
* [.NET 10 SDK](https://dotnet.microsoft.com/download) with the Windows App SDK workload installed.
* Developer Mode enabled in Windows Settings.
* Google Chrome or any debugger supporting the Chrome DevTools Protocol (CDP).

### How to attach Chrome DevTools

1. Run `ns debug windows`
2. Open Chrome and navigate to `chrome://inspect`
3. Under **Devices**, click **Configure** and add `localhost:9229`
4. The NativeScript runtime will appear under **Remote Target** — click **inspect**

### Command Limitations

* You can run `$ ns debug windows` only on Windows systems.

### Related Commands

Command | Description
----------|----------
[build windows](build-windows.html) | Builds the project for Windows and produces an MSIX package.
[build android](build-android.html) | Builds the project for Android.
[build ios](build-ios.html) | Builds the project for iOS.
[build](build.html) | Builds the project for the selected target platform.
[debug android](debug-android.html) | Debugs your project on a connected Android device or in a native emulator.
[debug ios](debug-ios.html) | Debugs your project on a connected iOS device or in a native emulator.
[debug](debug.html) | Debugs your project on a connected device or in a native emulator.
[run windows](run-windows.html) | Runs your project on the local Windows machine.
[run android](run-android.html) | Runs your project on a connected Android device or in a native Android emulator, if configured.
[run ios](run-ios.html) | Runs your project on a connected iOS device or in the iOS Simulator, if configured.
[run](run.html) | Runs your project on a connected device or in the native emulator for the selected platform.
<% } %>
