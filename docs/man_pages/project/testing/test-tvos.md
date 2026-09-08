<% if (isJekyll) { %>---
title: ns test tvos
position: 25
---<% } %>

# ns test tvos

### Description

Runs the tests in your project in the tvOS Simulator or on connected Apple TV devices.<% if(isConsole && isMacOS) { %> Your project must already be configured for unit testing with the Vitest framework by running `$ ns test init --framework vitest`.<% } %> Unit testing on tvOS requires the Vitest testing framework; the deprecated Karma-based frameworks are not supported on this platform.

<% if(isConsole && (isLinux || isWindows)) { %>WARNING: You can run this command only on macOS systems. To view the complete help for this command, run `$ ns help test tvos`<% } %> 

### Commands

Usage | Synopsis
------|-------
Run tests in the tvOS Simulator | `$ ns test tvos`
Run tests on a selected device | `$ ns test tvos --device <Device ID>`

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

Requires a version of `@nativescript/unit-test-runner` that accepts the `tvos` platform.
