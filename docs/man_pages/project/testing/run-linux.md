<% if (isJekyll) { %>---
title: ns run linux
position: 12
---<% } %>

# ns run linux

### Description

Runs your project on the local Linux machine. This is shorthand for prepare, build, deploy and launch. While your app is running, prints the output from the application in the console and watches for changes in your code. Once a change is detected, it synchronizes the change with the running application.

<% if(isConsole && (isWindows || isMacOS)) { %>WARNING: You can run this command only on Linux systems. To view the complete help for this command, run `$ ns help run linux`<% } %>
<% if((isConsole && isLinux) || isHtml) { %>
The app runs as a child process of the CLI. To start it with the Chrome DevTools inspector enabled, use `$ ns debug linux`.
<% } %>

### Commands

Usage | Synopsis
---|---
Run on the local Linux machine | `$ ns run linux [--release] [--justlaunch] [--arch <x64|arm64>] [--env.*]`

### Options

* `--justlaunch` - If set, does not print the application output in the console.
* `--release` - If set, produces a release build. Otherwise, produces a debug build.
* `--arch` - The runtime architecture to package, `x64` or `arm64`. Defaults to the host architecture.
* `--no-hmr` - Disables Hot Module Replacement (HMR). When a change in the code is applied, CLI will transfer the modified files and restart the application.
* `--env.*` - Specifies additional flags that the bundler may process. Can be passed multiple times.
* `--force` - If set, skips the application compatibility checks and forces `npm i` to ensure all dependencies are installed.

<% if(isHtml) { %>

### Prerequisites

* A Linux distribution with GTK 4 installed (for example `sudo apt install libgtk-4-1` or `sudo dnf install gtk4`).

### Command Limitations

* You can run `$ ns run linux` only on Linux systems.

### Related Commands

Command | Description
----------|----------
[build linux](build-linux.html) | Builds the project for Linux.
[debug linux](debug-linux.html) | Debugs your project on the local Linux machine.
[run](run.html) | Runs your project on a connected device or in the native emulator for the selected platform.
<% } %>
