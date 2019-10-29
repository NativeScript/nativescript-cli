<% if (isJekyll) { %>---
title: tns test android
position: 20
---<% } %>

# tns test android

### Description

Runs the tests in your project on connected Android devices and Android emulators.<% if(isConsole) { %> Your project must already be configured for unit testing by running `$ tns test init`.<% } %>

### Commands

Usage | Synopsis
------|-------
Run tests on all connected devices | `$ tns test android [--watch] [--debug-brk] [--aab]`
Run tests on a selected device | `$ tns test android --device <Device ID> [--watch] [--debug-brk] [--aab]`

### Options

* `--watch` - If set, when you save changes to the project, changes are automatically synchronized to the connected device and tests are re-run.
* `--device` - Specifies the serial number or the index of the connected device on which to run the tests. To list all connected devices, grouped by platform, run `$ tns device`. `<Device ID>` is the device index or identifier as listed by the `$ tns device` command.
* `--debug-brk` - Runs the tests under the debugger. The debugger will break just before your tests are executed, so you have a chance to place breakpoints.
* `--env.*` - Specifies additional flags that the bundler may process. Can be passed multiple times. Supported additional flags:
    *   `--env.uglify` - provides basic obfuscation and smaller app size.
    *   `--env.report` - creates a Webpack report inside a `report` folder in the root folder.
    *   `--env.sourceMap` - creates inline source maps.
    *   `--env.hiddenSourceMap` - creates sources maps in the root folder (useful for Crashlytics usage with bundled app in release).
* `--aab` - Specifies that the command will produce and deploy an Android App Bundle.
* `--force` - If set, skips the application compatibility checks and forces `npm i` to ensure all dependencies are installed. Otherwise, the command will check the application compatibility with the current CLI version and could fail requiring `tns migrate`.

<% if(isHtml) { %>

### Prerequisites

* Verify that [you have configured your project for unit testing](test-init.html).
* Verify that [you have stored your unit tests in `app` &#8594; `tests`](http://docs.nativescript.org/testing).
* Verify that [you have configured your system and devices properly](http://docs.nativescript.org/testing).

### Related Commands

Command | Description
--------|------------
[test init](test-init.html) | Configures your project for unit testing with a selected framework.
[test ios](test-ios.html) | Runs the tests in your project on iOS devices or the iOS Simulator.
<% } %>
