<% if (isJekyll) { %>---
title: ns test init
position: 21
---<% } %>

# ns test init

### Description

Configures your project for unit testing with a selected framework. This operation installs the @nativescript/unit-test-runner npm module and its dependencies and creates a `tests` folder in the `app` directory.

The recommended framework is `vitest`, which runs your specs inside real NativeScript runtimes on device/emulator and also supports UI testing. The Karma-based frameworks (jasmine, mocha, qunit) are deprecated and will be removed in a future release.

### Commands

Usage | Synopsis
------|-------
General | `$ ns test init [--framework <Framework>]`

### Options

* `--framework <Framework>` - Sets the unit testing framework to install. The following frameworks are available: vitest (recommended), mocha, jasmine and qunit (deprecated).

<% if(isHtml) { %>

### Command Limitations

* You can configure only one unit testing framework per project.

### Related Commands

Command | Description
--------|------------
[test android](test-android.html) | Runs the tests in your project on Android devices or native emulators. 
[test ios](test-ios.html) | Runs the tests in your project on iOS devices or the iOS Simulator.
[test visionos](test-visionos.html) | Runs the tests in your project in the visionOS Simulator or on Apple Vision Pro devices.
<% } %>