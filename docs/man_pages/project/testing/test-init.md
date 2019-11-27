<% if (isJekyll) { %>---
title: tns test init
position: 21
---<% } %>

# tns test init

### Description

Configures your project for unit testing with a selected framework. This operation installs the nativescript-unit-test-runner npm module and its dependencies and creates a `tests` folder in the `app` directory.

### Commands

Usage | Synopsis
------|-------
General | `$ tns test init [--framework <Framework>]`

### Options

* `--framework <Framework>` - Sets the unit testing framework to install. The following frameworks are available: mocha, jasmine and qunit.

<% if(isHtml) { %>

### Command Limitations

* You can configure only one unit testing framework per project.

### Related Commands

Command | Description
--------|------------
[test android](test-android.html) | Runs the tests in your project on Android devices or native emulators. 
[test ios](test-ios.html) | Runs the tests in your project on iOS devices or the iOS Simulator.
<% } %>