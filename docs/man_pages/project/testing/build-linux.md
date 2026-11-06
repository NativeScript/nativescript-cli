<% if (isJekyll) { %>---
title: ns build linux
position: 12
---<% } %>

# ns build linux

### Description

Builds the project for Linux. The output is a folder with the runtime executable (named after the project), its metadata and the bundled app; `--release` also packs it as a `.tar.gz`.

<% if(isConsole && (isWindows || isMacOS)) { %>WARNING: You can run this command only on Linux systems. To view the complete help for this command, run `$ ns help build linux`<% } %>

### Commands

Usage | Synopsis
---|---
Build for Linux | `$ ns build linux [--release] [--arch <x64|arm64>] [--env.*]`

### Options

* `--release` - If set, produces a release build in `platforms/linux/<Project>/dist`. Otherwise, produces a debug build in `platforms/linux/<Project>/bin`.
* `--arch` - The runtime architecture to package, `x64` or `arm64`. Defaults to the host architecture.
* `--env.*` - Specifies additional flags that the bundler may process. Can be passed multiple times.
* `--force` - If set, skips the application compatibility checks and forces `npm i` to ensure all dependencies are installed.

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[run linux](run-linux.html) | Runs your project on the local Linux machine.
[debug linux](debug-linux.html) | Debugs your project on the local Linux machine.
[build](build.html) | Builds the project for the selected target platform.
<% } %>
