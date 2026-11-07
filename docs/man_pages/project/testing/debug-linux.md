<% if (isJekyll) { %>---
title: ns debug linux
position: 12
---<% } %>

# ns debug linux

### Description

Runs your project on the local Linux machine with the Chrome DevTools inspector enabled (port 9229, or `$NS_LINUX_INSPECTOR_PORT`) and prints the DevTools URL.

<% if(isConsole && (isWindows || isMacOS)) { %>WARNING: You can run this command only on Linux systems. To view the complete help for this command, run `$ ns help debug linux`<% } %>

### Commands

Usage | Synopsis
---|---
Debug on the local Linux machine | `$ ns debug linux [--debug-brk] [--start] [--timeout <seconds>] [--env.*]`

### Options

* `--debug-brk` - Stops on the first line of the app until DevTools attaches.
* `--start` - Attaches to the already running app instead of starting it.
* `--timeout` - Seconds to wait for the inspector. Defaults to 90.
* `--no-hmr` - Disables Hot Module Replacement (HMR).
* `--env.*` - Specifies additional flags that the bundler may process. Can be passed multiple times.

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[run linux](run-linux.html) | Runs your project on the local Linux machine.
[build linux](build-linux.html) | Builds the project for Linux.
[debug](debug.html) | Debugs your project on a connected device or in a native emulator.
<% } %>
