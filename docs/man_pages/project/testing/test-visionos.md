<% if (isJekyll) { %>---
title: ns test visionos
position: 24
---<% } %>

# ns test visionos

### Description

Runs the tests in your project in the visionOS Simulator or on connected Apple Vision Pro devices.<% if(isConsole && isMacOS) { %> Your project must already be configured for unit testing with the Vitest framework by running `$ ns test init --framework vitest`.<% } %> Unit testing on visionOS requires the Vitest testing framework; the deprecated Karma-based frameworks are not supported on this platform.

<% if(isConsole && (isLinux || isWindows)) { %>WARNING: You can run this command only on macOS systems. To view the complete help for this command, run `$ ns help test visionos`<% } %> 

### Commands

Usage | Synopsis
------|-------
Run tests in the visionOS Simulator | `$ ns test visionos`
Run tests on a selected device | `$ ns test visionos --device <Device ID>`

<% if((isConsole && isMacOS) || isHtml) { %>

### Options

* `--device` - Specifies the serial number or the index of the connected device on which you want to run tests. To list all connected devices, grouped by platform, run `$ ns device`. `<Device ID>` is the device index or identifier as listed by the `$ ns device` command.
* `--env.codeCoverage` - If set, collects code coverage for the test run.
* `--force` - If set, skips the application compatibility checks and forces `npm i` to ensure all dependencies are installed. Otherwise, the command will check the application compatibility with the current CLI version and could fail requiring `ns migrate`.

<% } %>

<% if(isHtml) { %>

### Prerequisites

* Verify that [you have configured your project for unit testing](test-init.html) with the Vitest framework.
* Verify that [you have stored your unit tests in `app` &#8594; `tests`](http://docs.nativescript.org/testing).
* Verify that [you have configured your system and devices properly](http://docs.nativescript.org/testing).

### Related Commands

Command | Description
--------|------------
[test init](test-init.html) | Configures your project for unit testing with a selected framework.
[test android](test-android.html) | Runs the tests in your project on Android devices or native emulators.
[test ios](test-ios.html) | Runs the tests in your project on iOS devices or the iOS Simulator.
<% } %>
