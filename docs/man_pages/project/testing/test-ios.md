<% if (isJekyll) { %>---
title: tns test ios
position: 22
---<% } %>

# tns test ios

### Description

Runs the tests in your project on connected iOS devices or the iOS Simulator.<% if(isConsole && isMacOS) { %> Your project must already be configured for unit testing by running `$ tns test init`.<% } %>

<% if(isConsole && (isLinux || isWindows)) { %>WARNING: You can run this command only on macOS systems. To view the complete help for this command, run `$ tns help test ios`<% } %> 

### Commands

Usage | Synopsis
------|-------
Run tests on all connected devices | `$ tns test ios [--watch] [--debug-brk]`
Run tests on a selected device | `$ tns test ios --device <Device ID> [--watch] [--debug-brk]`
Run tests in the iOS Simulator | `$ tns test ios --emulator [--watch] [--debug-brk]`

<% if((isConsole && isMacOS) || isHtml) { %>

### Options

* `--watch` - If set, when you save changes to the project, changes are automatically synchronized to the connected device and tests are re-ran.
* `--device` - Specifies the serial number or the index of the connected device on which you want to run tests. To list all connected devices, grouped by platform, run `$ tns device`. You cannot set `--device` and `--emulator` simultaneously. `<Device ID>` is the device index or identifier as listed by the `$ tns device` command.
* `--emulator` - Runs tests on the iOS Simulator. You cannot set `--device` and `--emulator` simultaneously.
* `--debug-brk` - Runs the tests under the debugger. The debugger will break just before your tests are executed, so you have a chance to place breakpoints.
* `--force` - If set, skips the application compatibility checks and forces `npm i` to ensure all dependencies are installed. Otherwise, the command will check the application compatibility with the current CLI version and could fail requiring `tns migrate`.

<% } %>

<% if(isHtml) { %>

### Prerequisites

* Verify that [you have configured your project for unit testing](test-init.html).
* Verify that [you have stored your unit tests in `app` &#8594; `tests`](http://docs.nativescript.org/testing).
* Verify that [you have configured your system and devices properly](http://docs.nativescript.org/testing).

### Related Commands

Command | Description
--------|------------
[test init](test-init.html) | Configures your project for unit testing with a selected framework.
[test android](test-android.html) | Runs the tests in your project on Android devices or native emulators.
<% } %>
