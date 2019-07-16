<% if (isJekyll) { %>---
title: tns test
position: 23
---<% } %>

# tns test

### Description

Runs unit tests on the selected mobile platform.<% if(isConsole) { %> Your project must already be configured for unit testing by running `$ tns test init`.<% } %>

<% if(isHtml) { %>
#### How file changes are handled
* Changes in `.js`, `.ts`, `.less`, `.sass` and other file types will cause a restart of the native application.
* Changes in `App_Resources` will cause a rebuild of the application.
* Changes in any `package.json` file inside the project will cause a rebuild of the application.
* Changes in `node_modules/somePlugin` will cause a restart of the native application.
* Changes in `node_modules/somePlugin/platforms` will cause a rebuild of the application.
* Changes in `node_modules/somePlugin/package.json` file will cause a rebuild of the application.
<% } %>

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
