<% if (isJekyll) { %>---
title: tns test
position: 23
---<% } %>

# tns test

### Description

Runs unit tests on the selected mobile platform.<% if(isConsole) { %> Your project must already be configured for unit testing by running `$ tns test init`.<% } %>

### Commands

Usage | Synopsis
------|-------
<% if((isConsole && isMacOS) || isHtml) { %>General | `$ tns test <Platform>`<% } %><% if(isConsole && (isLinux || isWindows)) { %>General | `$ tns test android`<% } %>

<% if((isConsole && isMacOS) || isHtml) { %>### Arguments
`<Platform>` is the target mobile platform on which you want to run the tests. You can set the following target platforms.
* `android` - Runs the tests in your project on connected Android devices or Android emulators. 
* `ios` - Runs the tests in your project on connected iOS devices.<% } %>

<% if(isHtml) { %>

### Prerequisites

* Verify that [you have configured your project for unit testing](test-init.html).
* Verify that [you have stored your unit tests in `app/tests`](http://docs.nativescript.org/testing).
* Verify that [you have configured your system and devices properly](http://docs.nativescript.org/testing).

### Related Commands

Command | Description
--------|------------
[test init](test-init.html) | Configures your project for unit testing with a selected framework.
[test android](test-android.html) | Runs the tests in your project on Android devices or native emulators. 
[test ios](test-ios.html) | Runs the tests in your project on iOS devices or the iOS Simulator.
<% } %>
